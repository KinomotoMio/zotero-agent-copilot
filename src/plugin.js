(function() {
  if (globalThis.ZoteroAgentCopilot) {
    return;
  }

  var SCRIPT_PATHS = [
    "src/constants.js",
    "src/log.js",
    "src/io.js",
    "src/shared/path-model.js",
    "src/shared/markdown-note.js",
    "src/shared/snapshot-filters.js",
    "src/shared/paper-renderer.js",
    "src/shared/mineru-output.js",
    "src/shared/mineru-protocol.js",
    "src/prefs.js",
    "src/zotero/item-service.js",
    "src/zotero/note-service.js",
    "src/zotero/attachment-service.js",
    "src/workspace/root-service.js",
    "src/workspace/paper-service.js",
    "src/workspace/mineru-service.js",
    "src/workspace/snapshot-service.js",
    "src/workspace/launch-service.js",
    "src/menu.js"
  ];

  var agent = {
    id: null,
    version: null,
    rootURI: null,
    initialized: false,
    _scriptsLoaded: false,

    async init({ id, version, rootURI }) {
      if (this.initialized) {
        return;
      }
      this.id = id;
      this.version = version;
      this.rootURI = rootURI;
      this._loadScripts();
      this.Log.debug(`starting ${version}`);
      this.Prefs.init();
      await this.Menu.register();
      this.initialized = true;
    },

    _loadScripts() {
      if (this._scriptsLoaded) {
        return;
      }
      for (let scriptPath of SCRIPT_PATHS) {
        Services.scriptloader.loadSubScript(this.rootURI + scriptPath);
      }
      this._scriptsLoaded = true;
    },

    addToWindow(window) {
      if (!window?.ZoteroPane) {
        return;
      }
      window.MozXULElement?.insertFTLIfNeeded("zotero-agent-copilot.ftl");
      this.Menu.addToWindow(window);
    },

    addToAllWindows() {
      for (let window of Zotero.getMainWindows()) {
        this.addToWindow(window);
      }
    },

    removeFromWindow(window) {
      this.Menu.removeFromWindow(window);
    },

    async executeAction(action, window, itemFromContext) {
      try {
        let item = itemFromContext || this.ItemService.getSelectedRegularItem(window);
        switch (action) {
          case this.Constants.ACTIONS.REFRESH_PAPER:
            await this.PaperService.refreshItemWorkspace(item);
            this.Log.info("Refreshed paper-card.md and synced note.");
            break;
          case this.Constants.ACTIONS.CONVERT_MARKDOWN_CHINESE:
            await this.MinerUService.convertItemPdfToMarkdown(item, "ch");
            this.Log.info("Converted the selected PDF to Markdown with MinerU (Chinese).");
            break;
          case this.Constants.ACTIONS.CONVERT_MARKDOWN_ENGLISH:
            await this.MinerUService.convertItemPdfToMarkdown(item, "en");
            this.Log.info("Converted the selected PDF to Markdown with MinerU (English).");
            break;
          case this.Constants.ACTIONS.OPEN_WORKSPACE:
            await this.PaperService.openItemWorkspace(item);
            break;
          case this.Constants.ACTIONS.LAUNCH_CLAUDE:
            await this.LaunchService.launchAgent(item, this.Constants.AGENTS.CLAUDE);
            break;
          case this.Constants.ACTIONS.LAUNCH_CODEX:
            await this.LaunchService.launchAgent(item, this.Constants.AGENTS.CODEX);
            break;
          case this.Constants.ACTIONS.SAVE_SNAPSHOT:
            await this.SnapshotService.saveSnapshotForItem(item);
            this.Log.info("Saved workspace snapshot to Zotero.");
            break;
          case this.Constants.ACTIONS.RESTORE_SNAPSHOT:
            await this.SnapshotService.restoreSnapshotForItem(item);
            this.Log.info("Restored workspace from Zotero snapshot.");
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      }
      catch (error) {
        this.Log.error(error);
        throw error;
      }
    },

    shutdown() {
      this.Menu.unregister();
      for (let window of Zotero.getMainWindows()) {
        this.removeFromWindow(window);
      }
      this.Log.debug("shutdown complete");
    }
  };

  globalThis.ZoteroAgentCopilot = agent;
})();
