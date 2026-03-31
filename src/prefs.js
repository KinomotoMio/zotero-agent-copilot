(function() {
  var DEFAULTS = {
    workspaceBasePath: "~/Documents/Zotero Agent Copilot",
    claudeExecutablePath: "claude",
    codexExecutablePath: "codex",
    defaultAgent: "claude",
    terminalApp: "Terminal",
    mineruApiToken: "",
    mineruApiBaseUrl: "https://mineru.net/api/v4"
  };

  function prefName(key) {
    return ZoteroAgentCopilot.Constants.PREF_BRANCH + key;
  }

  function readStringPref(key) {
    let name = prefName(key);
    try {
      let value = Services.prefs.getStringPref(name, "");
      if (value !== "") {
        return value;
      }
    }
    catch (error) {
      ZoteroAgentCopilot.Log.debug(`string pref read failed for ${name}: ${error}`);
    }
    return Zotero.Prefs.get(name, true);
  }

  function writeStringPref(key, value) {
    let name = prefName(key);
    let nextValue = String(value ?? "");
    Services.prefs.setStringPref(name, nextValue);
    Zotero.Prefs.set(name, nextValue, true);
    return nextValue;
  }

  var prefs = {
    DEFAULTS,

    init() {
      ZoteroAgentCopilot.Log.debug("preferences ready");
    },

    get(key) {
      return readStringPref(key);
    },

    set(key, value) {
      return writeStringPref(key, value);
    },

    getAll() {
      return {
        workspaceBasePath: this.get("workspaceBasePath") || DEFAULTS.workspaceBasePath,
        claudeExecutablePath: this.get("claudeExecutablePath") || DEFAULTS.claudeExecutablePath,
        codexExecutablePath: this.get("codexExecutablePath") || DEFAULTS.codexExecutablePath,
        defaultAgent: this.get("defaultAgent") || DEFAULTS.defaultAgent,
        terminalApp: this.get("terminalApp") || DEFAULTS.terminalApp,
        mineruApiToken: this.get("mineruApiToken") || DEFAULTS.mineruApiToken,
        mineruApiBaseUrl: this.get("mineruApiBaseUrl") || DEFAULTS.mineruApiBaseUrl
      };
    },

    reset() {
      for (let [key, value] of Object.entries(DEFAULTS)) {
        this.set(key, value);
      }
      return this.getAll();
    }
  };

  ZoteroAgentCopilot.Prefs = prefs;
})();
