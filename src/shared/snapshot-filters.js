(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.SnapshotFilters = api;
  }
})(function() {
  var EXCLUDED_NAMES = new Set([
    ".DS_Store",
    ".git",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
    "tmp",
    "venv"
  ]);

  function shouldIncludePath(path, isDirectory) {
    var normalized = String(path);
    var name = normalized.split("/").pop();
    if (EXCLUDED_NAMES.has(name)) {
      return false;
    }
    if (/\.(log|tmp|swp)$/i.test(name)) {
      return false;
    }
    if (!isDirectory && /(^|\/)\.git($|\/)/.test(normalized)) {
      return false;
    }
    return true;
  }

  return {
    EXCLUDED_NAMES,
    shouldIncludePath
  };
});
