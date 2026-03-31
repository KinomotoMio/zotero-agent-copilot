(function() {
  var Constants = ZoteroAgentCopilot.Constants;
  var IO = ZoteroAgentCopilot.IO;
  var PaperRenderer = ZoteroAgentCopilot.Shared.PaperRenderer;

  async function readWorkspaceMetadata(context) {
    if (!(await IO.pathExists(context.metaFile))) {
      return {};
    }
    return IO.readJSON(context.metaFile);
  }

  function buildWorkspaceMetadata(itemMeta, context, existingMeta, overrides) {
    let next = Object.assign({}, existingMeta || {}, overrides || {});
    return {
      itemID: itemMeta.itemID,
      itemKey: itemMeta.itemKey,
      libraryID: itemMeta.libraryID,
      generatedAt: new Date().toISOString(),
      workspaceVersion: Constants.WORKSPACE_VERSION,
      defaultAgent: ZoteroAgentCopilot.Prefs.getAll().defaultAgent,
      paperDir: context.relativePaperDir,
      sourcePdfName: next.sourcePdfName || "",
      sourcePdfRelativePath: next.sourcePdfRelativePath || "",
      parsedMarkdownRelativePath: next.parsedMarkdownRelativePath || "",
      lastMineruLanguage: next.lastMineruLanguage || "",
      lastMineruParsedAt: next.lastMineruParsedAt || "",
      lastMineruManifestPath: next.lastMineruManifestPath || "",
      lastMineruBatchId: next.lastMineruBatchId || "",
      lastMineruRawFiles: next.lastMineruRawFiles || []
    };
  }

  async function writeWorkspaceMetadata(context, metadata) {
    await IO.writeJSON(context.metaFile, metadata);
    return metadata;
  }

  async function refreshItemWorkspace(item, options) {
    let itemMeta = await ZoteroAgentCopilot.ItemService.extractItemMetadata(item);
    let context = await ZoteroAgentCopilot.RootService.ensureLibraryLayout(itemMeta);
    let existingMeta = await readWorkspaceMetadata(context);
    let metaOverrides = Object.assign({}, options?.metaOverrides || {});

    if (!metaOverrides.sourcePdfName && !existingMeta.sourcePdfName && itemMeta.primaryPdf?.fileName) {
      let sourcePdfFile = ZoteroAgentCopilot.RootService.getSourcePdfFile(context, itemMeta.primaryPdf.fileName);
      if (await IO.pathExists(sourcePdfFile)) {
        metaOverrides.sourcePdfName = itemMeta.primaryPdf.fileName;
        metaOverrides.sourcePdfRelativePath = ZoteroAgentCopilot.RootService.toPaperRelativePath(
          context,
          sourcePdfFile
        );
      }
    }

    let markdown = PaperRenderer.renderPaperCardMarkdown(itemMeta);
    await IO.writeText(context.paperCardFile, markdown);
    let workspaceMeta = buildWorkspaceMetadata(
      itemMeta,
      context,
      existingMeta,
      metaOverrides
    );
    await writeWorkspaceMetadata(context, workspaceMeta);
    await ZoteroAgentCopilot.NoteService.upsertPaperNote(item, markdown);
    await ZoteroAgentCopilot.RootService.writeCurrentItemContext(itemMeta, context, workspaceMeta);

    return {
      context,
      itemMeta,
      workspaceMeta,
      paperCardMarkdown: markdown
    };
  }

  async function openItemWorkspace(item) {
    let { context } = await refreshItemWorkspace(item);
    IO.openPath(context.paperDir);
    return context;
  }

  ZoteroAgentCopilot.PaperService = {
    buildWorkspaceMetadata,
    openItemWorkspace,
    readWorkspaceMetadata,
    refreshItemWorkspace
    ,
    writeWorkspaceMetadata
  };
})();
