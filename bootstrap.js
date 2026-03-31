var ZoteroAgentCopilot;

function install() {}

async function startup({ id, version, rootURI }) {
  Zotero.PreferencePanes.register({
    pluginID: id,
    src: rootURI + "preferences.xhtml",
    scripts: [rootURI + "preferences.js"]
  });

  Services.scriptloader.loadSubScript(rootURI + "src/plugin.js");
  await ZoteroAgentCopilot.init({ id, version, rootURI });
  ZoteroAgentCopilot.addToAllWindows();
}

function onMainWindowLoad({ window }) {
  ZoteroAgentCopilot?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  ZoteroAgentCopilot?.removeFromWindow(window);
}

function shutdown() {
  ZoteroAgentCopilot?.shutdown();
  ZoteroAgentCopilot = undefined;
}

function uninstall() {}
