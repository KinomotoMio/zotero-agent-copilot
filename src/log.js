(function() {
  var log = {
    debug(message) {
      Zotero.debug(`[Zotero Agent Copilot] ${message}`);
    },

    info(message) {
      this.debug(message);
      Services.prompt.alert(
        Zotero.getMainWindow(),
        "Zotero Agent Copilot",
        message
      );
    },

    error(error) {
      Zotero.logError(error);
      let message = error?.message || String(error);
      Services.prompt.alert(
        Zotero.getMainWindow(),
        "Zotero Agent Copilot Error",
        message
      );
    }
  };

  ZoteroAgentCopilot.Log = log;
})();
