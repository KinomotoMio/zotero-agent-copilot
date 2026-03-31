(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.MinerUOutput = api;
  }
})(function() {
  function normalizeRelativePath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\.?\//, "");
  }

  function endsWithPath(path, suffix) {
    return normalizeRelativePath(path).toLowerCase().endsWith(suffix.toLowerCase());
  }

  function findFullMarkdownPath(relativePaths) {
    return [...(relativePaths || [])]
      .map(normalizeRelativePath)
      .filter(path => endsWithPath(path, "/full.md") || path.toLowerCase() === "full.md")
      .sort((left, right) => left.length - right.length)[0] || null;
  }

  function collectByPattern(relativePaths, pattern) {
    return (relativePaths || [])
      .map(normalizeRelativePath)
      .filter(path => pattern.test(path))
      .sort();
  }

  function buildArtifactIndex(relativePaths) {
    let normalized = (relativePaths || []).map(normalizeRelativePath).sort();
    return {
      allFiles: normalized,
      fullMarkdownPath: findFullMarkdownPath(normalized),
      contentListPaths: collectByPattern(normalized, /(?:^|\/).+_content_list(?:_v2)?\.json$/i),
      middlePaths: collectByPattern(normalized, /(?:^|\/).+_middle\.json$/i),
      modelPaths: collectByPattern(normalized, /(?:^|\/).+_model\.json$/i),
      layoutPdfPaths: collectByPattern(normalized, /(?:^|\/).+_layout\.pdf$/i),
      spanPdfPaths: collectByPattern(normalized, /(?:^|\/).+_span\.pdf$/i)
    };
  }

  return {
    buildArtifactIndex,
    findFullMarkdownPath,
    normalizeRelativePath
  };
});
