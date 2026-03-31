(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.MarkdownNote = api;
  }
})(function() {
  var NOTE_TITLE = "Agent Copilot: paper-card.md";
  var MARKER = 'data-agent-copilot-role="paper-card-md"';
  var LEGACY_MARKER = 'data-agent-copilot-role="paper-md"';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unescapeHtml(value) {
    return String(value)
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&");
  }

  function isManagedNoteHtml(noteHtml) {
    return Boolean(noteHtml && (noteHtml.includes(MARKER) || noteHtml.includes(LEGACY_MARKER)));
  }

  function renderManagedNote(markdown) {
    return [
      '<h1>Agent Copilot: paper-card.md</h1>',
      "<p>Managed by Zotero Agent Copilot. Refresh from the item menu to update this note.</p>",
      `<pre ${MARKER}><code>${escapeHtml(markdown)}</code></pre>`
    ].join("");
  }

  function extractManagedMarkdown(noteHtml) {
    if (!isManagedNoteHtml(noteHtml)) {
      return null;
    }
    var match = noteHtml.match(/<pre[^>]*data-agent-copilot-role="(?:paper-card-md|paper-md)"[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/i);
    if (!match) {
      return null;
    }
    return unescapeHtml(match[1]);
  }

  return {
    LEGACY_MARKER,
    MARKER,
    NOTE_TITLE,
    escapeHtml,
    extractManagedMarkdown,
    isManagedNoteHtml,
    renderManagedNote
  };
});
