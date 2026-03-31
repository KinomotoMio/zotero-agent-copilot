(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.PathModel = api;
  }
})(function() {
  function stripExtension(filename) {
    return String(filename || "").replace(/\.[^.]+$/, "");
  }

  function slugify(value) {
    return String(value || "library")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "library";
  }

  function libraryRootName(libraryID, libraryName) {
    return `library-${libraryID}-${slugify(libraryName)}`;
  }

  function paperRelativeDir(itemKey) {
    return `papers/${itemKey}`;
  }

  function paperRelativeSegments(itemKey) {
    return ["papers", itemKey];
  }

  function paperWorkspaceRelativeDir(itemKey) {
    return `${paperRelativeDir(itemKey)}/workspace`;
  }

  function paperWorkspaceRelativeSegments(itemKey) {
    return [...paperRelativeSegments(itemKey), "workspace"];
  }

  function sourceRelativeDir(itemKey) {
    return `${paperRelativeDir(itemKey)}/source`;
  }

  function sourceRelativeSegments(itemKey) {
    return [...paperRelativeSegments(itemKey), "source"];
  }

  function mineruRelativeDir(itemKey) {
    return `${paperRelativeDir(itemKey)}/mineru`;
  }

  function mineruRelativeSegments(itemKey) {
    return [...paperRelativeSegments(itemKey), "mineru"];
  }

  function parsedMarkdownFilename(pdfName) {
    return `${stripExtension(pdfName || "document.pdf") || "document"}.md`;
  }

  return {
    libraryRootName,
    mineruRelativeDir,
    mineruRelativeSegments,
    paperRelativeDir,
    paperRelativeSegments,
    paperWorkspaceRelativeDir,
    paperWorkspaceRelativeSegments,
    parsedMarkdownFilename,
    sourceRelativeDir,
    sourceRelativeSegments,
    stripExtension,
    slugify
  };
});
