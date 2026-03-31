(function(rootFactory) {
  var api = rootFactory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== "undefined" && globalThis.ZoteroAgentCopilot) {
    globalThis.ZoteroAgentCopilot.Shared = globalThis.ZoteroAgentCopilot.Shared || {};
    globalThis.ZoteroAgentCopilot.Shared.PaperRenderer = api;
  }
})(function() {
  function bullet(label, value) {
    return `- ${label}: ${value || "N/A"}`;
  }

  function renderList(items, emptyValue) {
    if (!items || items.length === 0) {
      return emptyValue;
    }
    return items.map(item => `- ${item}`).join("\n");
  }

  function renderPaperCardMarkdown(meta) {
    return [
      `# ${meta.title || "Untitled Item"}`,
      "",
      bullet("Authors", meta.authors.join(", ")),
      bullet("Year", meta.year),
      bullet("Venue", meta.venue),
      bullet("DOI", meta.doi),
      bullet("URL", meta.url),
      bullet("Item Key", meta.itemKey),
      bullet("Citation Key", meta.citationKey),
      "",
      "## Abstract",
      "",
      meta.abstractNote || "_No abstract available._",
      "",
      "## Tags",
      "",
      renderList(meta.tags, "_No tags._"),
      "",
      "## Attachments",
      "",
      renderList(meta.attachments.map(attachment => attachment.label), "_No attachments._")
    ].join("\n");
  }

  return {
    renderPaperCardMarkdown,
    renderPaperMarkdown: renderPaperCardMarkdown
  };
});
