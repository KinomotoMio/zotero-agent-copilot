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
  var BRANCH = "extensions.zotero-agent-copilot.";

  function prefName(key) {
    return BRANCH + key;
  }

  function get(key) {
    let value = Zotero.Prefs.get(prefName(key), true);
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
    return Zotero.Prefs.get(prefName(key), true);
  }

  function set(key, value) {
    let nextValue = String(value ?? "");
    Zotero.Prefs.set(prefName(key), nextValue, true);
    return nextValue;
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function hasFormElements() {
    return Boolean(
      getElement("workspaceBasePath") &&
      getElement("claudeExecutablePath") &&
      getElement("codexExecutablePath") &&
      getElement("defaultAgent") &&
      getElement("terminalApp") &&
      getElement("mineruApiToken") &&
      getElement("mineruApiBaseUrl") &&
      getElement("saveButton") &&
      getElement("resetButton")
    );
  }

  function readForm() {
    return {
      workspaceBasePath: getElement("workspaceBasePath").value.trim(),
      claudeExecutablePath: getElement("claudeExecutablePath").value.trim(),
      codexExecutablePath: getElement("codexExecutablePath").value.trim(),
      defaultAgent: getElement("defaultAgent").value,
      terminalApp: getElement("terminalApp").value.trim(),
      mineruApiToken: getElement("mineruApiToken").value.trim(),
      mineruApiBaseUrl: getElement("mineruApiBaseUrl").value.trim()
    };
  }

  function writeForm(values) {
    for (let [key, value] of Object.entries(values)) {
      let element = getElement(key);
      if (element) {
        element.value = value;
      }
    }
  }

  function loadValues() {
    writeForm({
      workspaceBasePath: get("workspaceBasePath") || DEFAULTS.workspaceBasePath,
      claudeExecutablePath: get("claudeExecutablePath") || DEFAULTS.claudeExecutablePath,
      codexExecutablePath: get("codexExecutablePath") || DEFAULTS.codexExecutablePath,
      defaultAgent: get("defaultAgent") || DEFAULTS.defaultAgent,
      terminalApp: get("terminalApp") || DEFAULTS.terminalApp,
      mineruApiToken: get("mineruApiToken") || DEFAULTS.mineruApiToken,
      mineruApiBaseUrl: get("mineruApiBaseUrl") || DEFAULTS.mineruApiBaseUrl
    });
  }

  function saveValues() {
    let values = readForm();
    for (let [key, value] of Object.entries(values)) {
      set(key, value || DEFAULTS[key]);
    }
    loadValues();
    let savedToken = get("mineruApiToken");
    Services.prompt.alert(
      window,
      "Zotero Agent Copilot",
      savedToken ? "Preferences saved." : "Preferences saved, but MinerU API Token is still empty."
    );
  }

  function resetDefaults() {
    for (let [key, value] of Object.entries(DEFAULTS)) {
      set(key, value);
    }
    loadValues();
    Services.prompt.alert(window, "Zotero Agent Copilot", "Defaults restored.");
  }

  function bindForm() {
    if (bindForm.bound || !hasFormElements()) {
      return;
    }
    bindForm.bound = true;
    loadValues();

    getElement("saveButton").addEventListener("click", saveValues);
    getElement("resetButton").addEventListener("click", resetDefaults);
  }

  function scheduleBind(attempt) {
    if (bindForm.bound) {
      return;
    }
    if (hasFormElements()) {
      bindForm();
      return;
    }
    if (attempt >= 20) {
      return;
    }
    window.setTimeout(() => {
      scheduleBind(attempt + 1);
    }, 50);
  }

  scheduleBind(0);
  window.addEventListener("load", () => {
    scheduleBind(0);
    if (hasFormElements()) {
      loadValues();
    }
  }, { once: true });
})();
