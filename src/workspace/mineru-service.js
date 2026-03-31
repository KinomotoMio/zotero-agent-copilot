(function() {
  var IO = ZoteroAgentCopilot.IO;
  var MinerUOutput = ZoteroAgentCopilot.Shared.MinerUOutput;
  var MinerUProtocol = ZoteroAgentCopilot.Shared.MinerUProtocol;
  var Log = ZoteroAgentCopilot.Log;

  var POLL_INTERVAL_MS = 3000;
  var POLL_TIMEOUT_MS = 10 * 60 * 1000;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function getClientToken() {
    let currentUserID = Zotero.Users?.getCurrentUserID?.();
    return `zotero-agent-copilot-${currentUserID || "local"}`;
  }

  function getApiConfig(itemMeta) {
    let prefs = ZoteroAgentCopilot.Prefs.getAll();
    if (!prefs.mineruApiToken) {
      throw new Error("Set a MinerU API Token in Zotero Agent Copilot preferences before converting PDFs.");
    }
    return {
      baseUrl: trimTrailingSlash(prefs.mineruApiBaseUrl || "https://mineru.net/api/v4"),
      headers: {
        "Authorization": `Bearer ${prefs.mineruApiToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "token": getClientToken()
      }
    };
  }

  async function readResponseText(response) {
    try {
      return await response.text();
    }
    catch (error) {
      return "";
    }
  }

  async function requestJSON(url, options) {
    let response = await fetch(url, options);
    let text = await readResponseText(response);
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    }
    catch (error) {
      throw new Error(`MinerU returned invalid JSON from ${url}: ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(payload?.msg || `MinerU request failed with status ${response.status}`);
    }
    if (payload?.code !== 0) {
      throw new Error(payload?.msg || `MinerU returned code ${payload?.code}`);
    }
    return payload;
  }

  async function uploadFile(uploadUrl, filePath, uploadBatch) {
    let bytes = await IO.readBytes(filePath);
    let response = await fetch(uploadUrl, MinerUProtocol.buildUploadRequestOptions(bytes));
    if (!response.ok) {
      let responseText = await readResponseText(response);
      throw new Error(MinerUProtocol.formatStageError("MinerU file upload failed", {
        status: response.status,
        host: MinerUProtocol.safeURLHost(uploadUrl),
        batchID: uploadBatch?.batchID,
        traceID: uploadBatch?.traceID,
        bodySnippet: MinerUProtocol.snippet(responseText, 160)
      }));
    }
  }

  async function downloadBytes(url) {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MinerU result download failed with status ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async function requestUploadBatch(itemMeta, pdfInfo, language, apiConfig) {
    let payload = await requestJSON(`${apiConfig.baseUrl}/file-urls/batch`, {
      method: "POST",
      headers: apiConfig.headers,
      body: JSON.stringify({
        enable_formula: true,
        enable_table: true,
        language,
        files: [
          {
            name: pdfInfo.fileName,
            is_ocr: true,
            data_id: itemMeta.itemKey
          }
        ]
      })
    });

    let uploadUrl = payload?.data?.file_urls?.[0];
    let batchID = payload?.data?.batch_id;
    if (!uploadUrl || !batchID) {
      throw new Error("MinerU did not return a usable upload URL or batch ID.");
    }
    Log.debug(`MinerU batch requested: batch=${batchID} host=${MinerUProtocol.safeURLHost(uploadUrl)} trace=${payload.trace_id || ""}`);
    return {
      batchID,
      uploadUrl,
      traceID: payload.trace_id || ""
    };
  }

  function findExtractResult(results, itemMeta, pdfInfo) {
    return (results || []).find(result =>
      result?.data_id === itemMeta.itemKey ||
      result?.file_name === pdfInfo.fileName
    ) || results?.[0] || null;
  }

  async function pollBatchResult(itemMeta, pdfInfo, apiConfig, batchID) {
    let deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      let payload = await requestJSON(`${apiConfig.baseUrl}/extract-results/batch/${batchID}`, {
        method: "GET",
        headers: apiConfig.headers
      });
      let result = findExtractResult(payload?.data?.extract_result, itemMeta, pdfInfo);
      if (!result) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      let stateInfo = MinerUProtocol.describeTaskState(result.state, result.err_msg);
      if (result.state === "done") {
        if (!result.full_zip_url) {
          throw new Error("MinerU reported success but did not provide a result zip URL.");
        }
        Log.debug(`MinerU batch completed: batch=${batchID} state=${result.state}`);
        return result;
      }
      if (stateInfo.terminal) {
        Log.debug(`MinerU batch failed: batch=${batchID} state=${result.state}`);
        throw new Error(MinerUProtocol.formatStageError("MinerU extraction failed", {
          batchID,
          bodySnippet: stateInfo.message
        }));
      }
      if (MinerUProtocol.normalizeTaskState && MinerUProtocol.normalizeTaskState(result.state) === "waiting-file") {
        Log.debug(`MinerU batch waiting-file: batch=${batchID}`);
      }
      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(MinerUProtocol.formatStageError("MinerU result polling timed out", {
      batchID,
      bodySnippet: `Timed out after ${Math.round(POLL_TIMEOUT_MS / 1000)} seconds.`
    }));
  }

  async function unpackResultZip(zipPath, targetDir) {
    if (await IO.pathExists(targetDir)) {
      await IO.removePath(targetDir);
    }
    await IO.ensureDir(targetDir);
    let exitCode = IO.runShell(
      `unzip -qq ${IO.shellQuote(zipPath)} -d ${IO.shellQuote(targetDir)}`,
      true
    );
    if (exitCode !== 0) {
      throw new Error(`unzip exited with status ${exitCode}`);
    }
  }

  async function convertItemPdfToMarkdown(item, language) {
    let prepared = await ZoteroAgentCopilot.PaperService.refreshItemWorkspace(item);
    let pdfInfo = await ZoteroAgentCopilot.ItemService.extractPdfAttachmentInfo(item);
    if (!pdfInfo?.filePath) {
      throw new Error("This item does not have a local stored-file PDF attachment for MinerU.");
    }

    let apiConfig = getApiConfig(prepared.itemMeta);
    let uploadBatch;
    try {
      uploadBatch = await requestUploadBatch(prepared.itemMeta, pdfInfo, language, apiConfig);
    }
    catch (error) {
      throw new Error(MinerUProtocol.formatStageError("MinerU upload URL request failed", {
        bodySnippet: error?.message || String(error)
      }));
    }

    await uploadFile(uploadBatch.uploadUrl, pdfInfo.filePath, uploadBatch);
    let result;
    try {
      result = await pollBatchResult(prepared.itemMeta, pdfInfo, apiConfig, uploadBatch.batchID);
    }
    catch (error) {
      let message = error?.message || String(error);
      if (/waiting-file/i.test(message)) {
        throw new Error(MinerUProtocol.formatStageError("MinerU result polling failed", {
          batchID: uploadBatch.batchID,
          traceID: uploadBatch.traceID,
          bodySnippet: "Upload accepted by client but not yet observed by MinerU."
        }));
      }
      throw new Error(MinerUProtocol.formatStageError("MinerU result polling failed", {
        batchID: uploadBatch.batchID,
        traceID: uploadBatch.traceID,
        bodySnippet: message
      }));
    }
    let zipBytes = await downloadBytes(result.full_zip_url);

    let sourcePdfFile = ZoteroAgentCopilot.RootService.getSourcePdfFile(prepared.context, pdfInfo.fileName);
    let parsedMarkdownFile = ZoteroAgentCopilot.RootService.getParsedMarkdownFile(prepared.context, pdfInfo.fileName);

    await IO.copyRecursive(pdfInfo.filePath, sourcePdfFile);
    await IO.writeBytes(prepared.context.mineruZipFile, zipBytes);
    await unpackResultZip(prepared.context.mineruZipFile, prepared.context.mineruRawDir);

    let relativeFiles = await IO.listRelativeFiles(prepared.context.mineruRawDir);
    let artifactIndex = MinerUOutput.buildArtifactIndex(relativeFiles);
    if (!artifactIndex.fullMarkdownPath) {
      throw new Error("MinerU result zip did not contain a full.md Markdown file.");
    }

    let fullMarkdownFile = IO.join(
      prepared.context.mineruRawDir,
      ...IO.splitPathSegments(artifactIndex.fullMarkdownPath)
    );
    await IO.copyRecursive(fullMarkdownFile, parsedMarkdownFile);

    let sourcePdfRelativePath = ZoteroAgentCopilot.RootService.toPaperRelativePath(prepared.context, sourcePdfFile);
    let parsedMarkdownRelativePath = ZoteroAgentCopilot.RootService.toPaperRelativePath(prepared.context, parsedMarkdownFile);
    let mineruManifestRelativePath = ZoteroAgentCopilot.RootService.toPaperRelativePath(
      prepared.context,
      prepared.context.mineruManifestFile
    );

    let mineruManifest = {
      schemaVersion: 1,
      itemID: prepared.itemMeta.itemID,
      itemKey: prepared.itemMeta.itemKey,
      attachmentID: pdfInfo.attachmentID,
      attachmentKey: pdfInfo.attachmentKey,
      sourcePdfName: pdfInfo.fileName,
      sourcePdfRelativePath,
      requestedLanguage: language,
      parsedAt: new Date().toISOString(),
      batchID: uploadBatch.batchID,
      traceID: uploadBatch.traceID,
      fullZipURL: result.full_zip_url,
      rawFiles: artifactIndex.allFiles,
      keyArtifacts: {
        fullMarkdownPath: artifactIndex.fullMarkdownPath,
        contentListPaths: artifactIndex.contentListPaths,
        middlePaths: artifactIndex.middlePaths,
        modelPaths: artifactIndex.modelPaths,
        layoutPdfPaths: artifactIndex.layoutPdfPaths,
        spanPdfPaths: artifactIndex.spanPdfPaths
      },
      normalizedMarkdownRelativePath: parsedMarkdownRelativePath
    };
    await IO.writeJSON(prepared.context.mineruManifestFile, mineruManifest);

    let workspaceMeta = ZoteroAgentCopilot.PaperService.buildWorkspaceMetadata(
      prepared.itemMeta,
      prepared.context,
      prepared.workspaceMeta,
      {
        sourcePdfName: pdfInfo.fileName,
        sourcePdfRelativePath,
        parsedMarkdownRelativePath,
        lastMineruLanguage: language,
        lastMineruParsedAt: mineruManifest.parsedAt,
        lastMineruManifestPath: mineruManifestRelativePath,
        lastMineruBatchId: uploadBatch.batchID,
        lastMineruRawFiles: artifactIndex.allFiles
      }
    );
    await ZoteroAgentCopilot.PaperService.writeWorkspaceMetadata(prepared.context, workspaceMeta);
    await ZoteroAgentCopilot.RootService.writeCurrentItemContext(
      prepared.itemMeta,
      prepared.context,
      workspaceMeta
    );

    return {
      context: prepared.context,
      itemMeta: prepared.itemMeta,
      workspaceMeta,
      mineruManifest
    };
  }

  ZoteroAgentCopilot.MinerUService = {
    convertItemPdfToMarkdown
  };
})();
