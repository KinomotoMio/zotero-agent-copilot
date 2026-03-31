(function() {
  var Constants = ZoteroAgentCopilot.Constants;
  var IO = ZoteroAgentCopilot.IO;
  var SnapshotFilters = ZoteroAgentCopilot.Shared.SnapshotFilters;

  async function copyIfExists(source, destination, filter) {
    if (!(await IO.pathExists(source))) {
      return false;
    }
    await IO.copyRecursive(source, destination, filter);
    return true;
  }

  async function saveSnapshotForItem(item, preparedContext) {
    let prepared = preparedContext || await ZoteroAgentCopilot.PaperService.refreshItemWorkspace(item);
    let { context, itemMeta, workspaceMeta } = prepared;
    let tempDir = await IO.createTempDir("zac-snapshot");
    let stageDir = IO.join(tempDir, "stage");
    let stagedPaperDir = IO.join(stageDir, "papers", itemMeta.itemKey);
    let zipPath = IO.join(tempDir, `zotero-agent-copilot-${itemMeta.itemKey}.zip`);

    try {
      await IO.ensureDir(stagedPaperDir);
      let includedPaths = [Constants.SNAPSHOT_MANIFEST_FILE];
      await copyIfExists(context.paperCardFile, IO.join(stagedPaperDir, Constants.PAPER_CARD_FILE));
      includedPaths.push(`papers/${itemMeta.itemKey}/${Constants.PAPER_CARD_FILE}`);
      await IO.copyRecursive(context.metaFile, IO.join(stagedPaperDir, "meta.json"));
      includedPaths.push(`papers/${itemMeta.itemKey}/meta.json`);
      if (workspaceMeta?.parsedMarkdownRelativePath) {
        let parsedMarkdownFile = ZoteroAgentCopilot.RootService.resolveLibraryRelativePath(
          context,
          workspaceMeta.parsedMarkdownRelativePath
        );
        if (await copyIfExists(parsedMarkdownFile, IO.join(stagedPaperDir, IO.basename(parsedMarkdownFile)))) {
          includedPaths.push(workspaceMeta.parsedMarkdownRelativePath);
        }
      }
      if (await copyIfExists(
        context.mineruDir,
        IO.join(stagedPaperDir, Constants.MINERU_DIR),
        SnapshotFilters.shouldIncludePath
      )) {
        includedPaths.push(`papers/${itemMeta.itemKey}/${Constants.MINERU_DIR}`);
      }
      await IO.copyRecursive(
        context.workspaceDir,
        IO.join(stagedPaperDir, "workspace"),
        SnapshotFilters.shouldIncludePath
      );
      includedPaths.push(`papers/${itemMeta.itemKey}/workspace`);
      await IO.writeJSON(IO.join(stageDir, Constants.SNAPSHOT_MANIFEST_FILE), {
        schemaVersion: 1,
        workspaceVersion: Constants.WORKSPACE_VERSION,
        itemID: itemMeta.itemID,
        itemKey: itemMeta.itemKey,
        createdAt: new Date().toISOString(),
        includedPaths
      });

      let exitCode = IO.runShell(
        `cd ${IO.shellQuote(stageDir)} && zip -qr ${IO.shellQuote(zipPath)} ${IO.shellQuote(Constants.SNAPSHOT_MANIFEST_FILE)} papers`,
        true
      );
      if (exitCode !== 0) {
        throw new Error(`zip exited with status ${exitCode}`);
      }

      await ZoteroAgentCopilot.AttachmentService.upsertSnapshotAttachment(item, zipPath);
      return zipPath;
    }
    finally {
      await IO.removePath(tempDir);
    }
  }

  async function restoreSnapshotForItem(item) {
    let prepared = await ZoteroAgentCopilot.PaperService.refreshItemWorkspace(item);
    let { context, itemMeta } = prepared;
    let zipPath = await ZoteroAgentCopilot.AttachmentService.getSnapshotFilePath(item);
    let tempDir = null;
    let restored = false;

    try {
      if (zipPath) {
        tempDir = await IO.createTempDir("zac-restore");
        let exitCode = IO.runShell(
          `unzip -qq ${IO.shellQuote(zipPath)} -d ${IO.shellQuote(tempDir)}`,
          true
        );
        if (exitCode !== 0) {
          throw new Error(`unzip exited with status ${exitCode}`);
        }
        await IO.copyRecursive(
          IO.join(tempDir, "papers", itemMeta.itemKey),
          context.paperDir
        );
        await ZoteroAgentCopilot.RootService.migrateLegacyPaperCard(context);
        restored = true;
      }

      if (!restored) {
        let noteMarkdown = await ZoteroAgentCopilot.NoteService.readManagedPaperMarkdown(item);
        if (!noteMarkdown) {
          throw new Error("No managed snapshot or paper-card.md note was found for this item.");
        }
        await IO.writeText(context.paperCardFile, noteMarkdown);
      }

      let restoredMeta = await ZoteroAgentCopilot.PaperService.readWorkspaceMetadata(context);
      let pdfInfo = await ZoteroAgentCopilot.ItemService.extractPdfAttachmentInfo(item);
      if (pdfInfo?.filePath) {
        let targetName = restoredMeta.sourcePdfName || pdfInfo.fileName;
        let sourcePdfFile = ZoteroAgentCopilot.RootService.getSourcePdfFile(context, targetName);
        await IO.copyRecursive(pdfInfo.filePath, sourcePdfFile);
      }

      return ZoteroAgentCopilot.PaperService.refreshItemWorkspace(item);
    }
    finally {
      if (tempDir) {
        await IO.removePath(tempDir);
      }
    }
  }

  ZoteroAgentCopilot.SnapshotService = {
    restoreSnapshotForItem,
    saveSnapshotForItem
  };
})();
