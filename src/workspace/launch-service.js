(function() {
  var Constants = ZoteroAgentCopilot.Constants;
  var IO = ZoteroAgentCopilot.IO;

  function getExecutablePath(agentType) {
    let prefs = ZoteroAgentCopilot.Prefs.getAll();
    if (agentType === Constants.AGENTS.CLAUDE) {
      return prefs.claudeExecutablePath;
    }
    if (agentType === Constants.AGENTS.CODEX) {
      return prefs.codexExecutablePath;
    }
    throw new Error(`Unsupported agent type: ${agentType}`);
  }

  function buildAgentCommand(agentType, context) {
    let executablePath = getExecutablePath(agentType);
    let currentItemEnv = [
      `export ZOTERO_AGENT_CURRENT_ITEM=${IO.shellQuote(context.relativePaperDir)}`,
      `export ZOTERO_AGENT_WORKSPACE_DIR=${IO.shellQuote(context.relativeWorkspaceDir)}`,
      `cd ${IO.shellQuote(context.libraryRoot)}`,
      `exec ${IO.shellQuote(executablePath)}`
    ];
    return currentItemEnv.join("; ");
  }

  function buildAppleScript(command, terminalApp) {
    let name = String(terminalApp || "Terminal");
    if (/iterm/i.test(name)) {
      return [
        'tell application "iTerm"',
        "activate",
        "create window with default profile",
        `tell current session of current window to write text ${JSON.stringify(command)}`,
        "end tell"
      ];
    }
    return [
      'tell application "Terminal"',
      "activate",
      `do script ${JSON.stringify(command)}`,
      "end tell"
    ];
  }

  function runAppleScript(lines) {
    let args = [];
    for (let line of lines) {
      args.push("-e", line);
    }
    let exitCode = IO.runProcess("/usr/bin/osascript", args, true);
    if (exitCode !== 0) {
      throw new Error(`osascript exited with status ${exitCode}`);
    }
  }

  async function launchAgent(item, agentType) {
    let prepared = await ZoteroAgentCopilot.PaperService.refreshItemWorkspace(item);
    await ZoteroAgentCopilot.SnapshotService.saveSnapshotForItem(item, prepared);
    let command = buildAgentCommand(agentType, prepared.context);
    let prefs = ZoteroAgentCopilot.Prefs.getAll();
    runAppleScript(buildAppleScript(command, prefs.terminalApp));
    return prepared.context;
  }

  ZoteroAgentCopilot.LaunchService = {
    buildAgentCommand,
    launchAgent
  };
})();
