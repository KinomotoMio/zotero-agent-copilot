(function() {
  var Constants = ZoteroAgentCopilot.Constants;
  var IO = ZoteroAgentCopilot.IO;
  var PathModel = ZoteroAgentCopilot.Shared.PathModel;

  function getWorkspaceBasePath() {
    return IO.expandHome(ZoteroAgentCopilot.Prefs.getAll().workspaceBasePath);
  }

  function getLibraryRoot(meta) {
    return IO.join(
      getWorkspaceBasePath(),
      PathModel.libraryRootName(meta.libraryID, meta.libraryName)
    );
  }

  function getPaperDir(meta) {
    return IO.join(getLibraryRoot(meta), ...PathModel.paperRelativeSegments(meta.itemKey));
  }

  function getWorkspaceDir(meta) {
    return IO.join(getLibraryRoot(meta), ...PathModel.paperWorkspaceRelativeSegments(meta.itemKey));
  }

  function buildContext(meta) {
    let libraryRoot = getLibraryRoot(meta);
    let paperDir = getPaperDir(meta);
    let workspaceDir = getWorkspaceDir(meta);
    let sourceDir = IO.join(paperDir, Constants.SOURCE_DIR);
    let mineruDir = IO.join(paperDir, Constants.MINERU_DIR);
    return {
      libraryRoot,
      paperDir,
      workspaceDir,
      sourceDir,
      mineruDir,
      mineruRawDir: IO.join(mineruDir, Constants.MINERU_RAW_DIR),
      mineruZipFile: IO.join(mineruDir, Constants.MINERU_ZIP_FILE),
      mineruManifestFile: IO.join(mineruDir, Constants.MINERU_MANIFEST_FILE),
      relativePaperDir: PathModel.paperRelativeDir(meta.itemKey),
      relativeWorkspaceDir: PathModel.paperWorkspaceRelativeDir(meta.itemKey),
      libraryMetaDir: IO.join(libraryRoot, Constants.LIBRARY_META_DIR),
      libraryMetaFile: IO.join(libraryRoot, Constants.LIBRARY_META_DIR, Constants.LIBRARY_META_FILE),
      currentItemFile: IO.join(libraryRoot, Constants.LIBRARY_META_DIR, Constants.CURRENT_ITEM_FILE),
      currentItemMarkdownFile: IO.join(libraryRoot, Constants.CURRENT_ITEM_MARKDOWN),
      paperCardFile: IO.join(paperDir, Constants.PAPER_CARD_FILE),
      legacyPaperFile: IO.join(paperDir, Constants.LEGACY_PAPER_FILE),
      metaFile: IO.join(paperDir, Constants.META_FILE)
    };
  }

  function getSourcePdfFile(context, pdfName) {
    return IO.join(context.sourceDir, IO.basename(pdfName));
  }

  function getParsedMarkdownFile(context, pdfName) {
    return IO.join(context.paperDir, PathModel.parsedMarkdownFilename(IO.basename(pdfName)));
  }

  function toPaperRelativePath(context, absolutePath) {
    return `${context.relativePaperDir}/${absolutePath.slice(context.paperDir.length).replace(/^[\\/]+/, "").replace(/\\/g, "/")}`;
  }

  function resolveLibraryRelativePath(context, relativePath) {
    return IO.join(context.libraryRoot, ...IO.splitPathSegments(relativePath));
  }

  async function migrateLegacyPaperCard(context) {
    if (await IO.pathExists(context.paperCardFile) || !(await IO.pathExists(context.legacyPaperFile))) {
      return false;
    }
    await IO.movePath(context.legacyPaperFile, context.paperCardFile);
    return true;
  }

  async function ensureLibraryLayout(meta) {
    let context = buildContext(meta);
    await IO.ensureDir(getWorkspaceBasePath());
    await IO.ensureDir(context.libraryRoot);
    await IO.ensureDir(context.libraryMetaDir);
    await IO.ensureDir(IO.join(context.libraryRoot, "papers"));
    await IO.ensureDir(context.paperDir);
    await IO.ensureDir(context.sourceDir);
    await IO.ensureDir(context.mineruDir);
    await IO.ensureDir(context.mineruRawDir);
    await IO.ensureDir(context.workspaceDir);
    await writeLibraryMetadata(meta, context);
    await migrateLegacyPaperCard(context);
    return context;
  }

  async function writeLibraryMetadata(meta, context) {
    let existing = null;
    if (await IO.pathExists(context.libraryMetaFile)) {
      existing = await IO.readJSON(context.libraryMetaFile);
    }
    await IO.writeJSON(context.libraryMetaFile, {
      schemaVersion: 1,
      workspaceVersion: Constants.WORKSPACE_VERSION,
      libraryID: meta.libraryID,
      libraryName: meta.libraryName,
      createdAt: existing?.createdAt || new Date().toISOString()
    });
  }

  async function writeCurrentItemContext(meta, context, workspaceMeta) {
    let lines = [
      "# Current Zotero Item",
      "",
      `- Title: ${meta.title || "Untitled Item"}`,
      `- Item Key: ${meta.itemKey}`,
      `- Paper Directory: ${context.relativePaperDir}`,
      `- Workspace Directory: ${context.relativeWorkspaceDir}`,
      `- Paper Card: ${context.relativePaperDir}/${Constants.PAPER_CARD_FILE}`
    ];

    if (workspaceMeta?.parsedMarkdownRelativePath) {
      lines.push(`- Parsed Markdown: ${workspaceMeta.parsedMarkdownRelativePath}`);
    }
    if (workspaceMeta?.sourcePdfRelativePath) {
      lines.push(`- Source PDF: ${workspaceMeta.sourcePdfRelativePath}`);
    }

    lines.push(
      "",
      `Open \`${context.relativePaperDir}/${Constants.PAPER_CARD_FILE}\` for the Zotero metadata card.`
    );
    if (workspaceMeta?.parsedMarkdownRelativePath) {
      lines.push(`Open \`${workspaceMeta.parsedMarkdownRelativePath}\` for the MinerU Markdown output.`);
    }

    await IO.writeJSON(context.currentItemFile, {
      itemID: meta.itemID,
      itemKey: meta.itemKey,
      paperDir: context.relativePaperDir,
      updatedAt: new Date().toISOString()
    });
    await IO.writeText(context.currentItemMarkdownFile, lines.join("\n"));
  }

  ZoteroAgentCopilot.RootService = {
    buildContext,
    ensureLibraryLayout,
    getParsedMarkdownFile,
    getLibraryRoot,
    getPaperDir,
    getSourcePdfFile,
    getWorkspaceBasePath,
    getWorkspaceDir,
    migrateLegacyPaperCard,
    resolveLibraryRelativePath,
    toPaperRelativePath,
    writeCurrentItemContext
  };
})();
