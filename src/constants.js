(function() {
  var constants = {
    PREF_BRANCH: "extensions.zotero-agent-copilot.",
    NOTE_TITLE: "Agent Copilot: paper-card.md",
    SNAPSHOT_ATTACHMENT_TITLE: "Agent Copilot: Workspace Snapshot",
    WORKSPACE_VERSION: 2,
    NOTE_MARKER: "data-agent-copilot-role=\"paper-card-md\"",
    LEGACY_NOTE_MARKER: "data-agent-copilot-role=\"paper-md\"",
    LIBRARY_META_DIR: ".zotero-agent",
    LIBRARY_META_FILE: "library.json",
    CURRENT_ITEM_FILE: "current-item.json",
    CURRENT_ITEM_MARKDOWN: "CURRENT_ITEM.md",
    SNAPSHOT_MANIFEST_FILE: "snapshot-manifest.json",
    PAPER_CARD_FILE: "paper-card.md",
    LEGACY_PAPER_FILE: "paper.md",
    META_FILE: "meta.json",
    SOURCE_DIR: "source",
    MINERU_DIR: "mineru",
    MINERU_RAW_DIR: "raw",
    MINERU_ZIP_FILE: "result.zip",
    MINERU_MANIFEST_FILE: "manifest.json",
    ACTIONS: {
      REFRESH_PAPER: "refresh-paper",
      CONVERT_MARKDOWN_CHINESE: "convert-markdown-chinese",
      CONVERT_MARKDOWN_ENGLISH: "convert-markdown-english",
      OPEN_WORKSPACE: "open-workspace",
      LAUNCH_CLAUDE: "launch-claude",
      LAUNCH_CODEX: "launch-codex",
      SAVE_SNAPSHOT: "save-snapshot",
      RESTORE_SNAPSHOT: "restore-snapshot"
    },
    AGENTS: {
      CLAUDE: "claude",
      CODEX: "codex"
    }
  };

  ZoteroAgentCopilot.Constants = constants;
})();
