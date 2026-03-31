(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.MinerUProtocol = api;
  }
})(function() {
  function safeURLHost(url) {
    try {
      return new URL(String(url)).host;
    }
    catch (error) {
      return "unknown-host";
    }
  }

  function snippet(text, maxLength) {
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength || 200);
  }

  function buildUploadRequestOptions(bytes) {
    return {
      method: "PUT",
      body: bytes
    };
  }

  function formatStageError(stage, details) {
    let info = details || {};
    let parts = [];
    if (info.status) {
      parts.push(`status ${info.status}`);
    }
    if (info.host) {
      parts.push(`host ${info.host}`);
    }
    if (info.batchID) {
      parts.push(`batch ${info.batchID}`);
    }
    if (info.traceID) {
      parts.push(`trace ${info.traceID}`);
    }
    let summary = parts.length ? ` (${parts.join(", ")})` : "";
    let message = `${stage}${summary}`;
    if (info.bodySnippet) {
      message += `: ${info.bodySnippet}`;
    }
    return message;
  }

  function normalizeTaskState(state) {
    return String(state || "").toLowerCase();
  }

  function describeTaskState(state, errMsg) {
    let normalized = normalizeTaskState(state);
    if (normalized === "done") {
      return { terminal: true, success: true, message: "" };
    }
    if (normalized === "failed") {
      return {
        terminal: true,
        success: false,
        message: errMsg || "MinerU failed to parse the PDF."
      };
    }
    if (normalized === "waiting-file") {
      return {
        terminal: false,
        success: false,
        message: "Upload accepted by client but not yet observed by MinerU."
      };
    }
    return {
      terminal: false,
      success: false,
      message: normalized || "pending"
    };
  }

  return {
    buildUploadRequestOptions,
    describeTaskState,
    formatStageError,
    normalizeTaskState,
    safeURLHost,
    snippet
  };
});
