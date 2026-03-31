# Zotero Agent Copilot

[中文](README.md)

Research rarely suffers from a shortage of ideas. What it lacks is a stable place to let them settle.

This Zotero 8 plugin creates a local workspace for each item in your library, keeping the converted Markdown of your PDF, your notes, and whatever the Agent produces all in one place. You launch Claude Code or Codex from here; everything made stays where it was made. Snapshot it, carry it to another machine, restore it without fuss.

What you do with the output is up to you — Obsidian, Notion, a plain folder. The plugin doesn't care.

> Current version supports macOS only.
>
> **Heads up:** This plugin is in very early stages. If you notice any issues with Zotero cloud sync after installation, uninstalling the plugin or temporarily disabling sync is the safest first step. Feel free to [open an issue](../../issues) to report what you saw.

---

## Installation

Download the latest `.xpi` from the [Releases](../../releases) page. In Zotero 8, open **Tools → Plugins**, click the gear icon, and choose **Install Add-on From File**.

To build from source:

```bash
git clone https://github.com/KinomotoMio/zotero-agent-copilot.git
cd zotero-agent-copilot
npm run build
npm test
```

---

## Configuration

Open **Tools → Plugins → Zotero Agent Copilot → Preferences**.

Two things to pay attention to: PDF conversion requires a [MinerU](https://mineru.net) API token — sign up there, a free tier is available. For Claude and Codex, the defaults (`claude` / `codex`) work fine if they're already on your PATH.

| Setting | Default |
|---|---|
| Workspace base path | `~/Documents/Zotero Agent Copilot` |
| Claude executable | `claude` |
| Codex executable | `codex` |
| Default agent | `claude` |
| Terminal app | `Terminal` (iTerm also supported) |
| MinerU API token | — |
| MinerU API base URL | `https://mineru.net/api/v4` |

---

## Usage

Right-click any item and look for the **Agent Copilot** submenu:

| Menu item | What it does |
|---|---|
| Refresh Paper Card | Regenerates the summary note and syncs it back to Zotero |
| Convert PDF to Markdown → Chinese / English | Sends the PDF to MinerU; saves the result to the workspace |
| Open AI Workspace | Opens this item's local directory in Finder |
| Launch Claude Code / Codex | Saves a snapshot, then opens the Agent in a terminal |
| Save Workspace Snapshot | Packages workspace into a ZIP and attaches it to the item |
| Restore Workspace | Extracts the latest snapshot back to your local files |

---

## Directory Layout

```
~/Documents/Zotero Agent Copilot/
  library-<libraryID>-<slug>/
    CURRENT_ITEM.md             ← Current item summary, read by the Agent on launch
    papers/
      <itemKey>/
        paper-card.md           ← The note synced back to Zotero
        <pdf-stem>.md           ← Full-text Markdown from MinerU
        source/
          <original>.pdf        ← Local copy of the PDF
        mineru/                 ← Raw conversion output
        workspace/              ← Agent working area, included in snapshots
```

All items in a library share this root directory, giving the Agent full context across your reading list.

---

## Known Limitations

Terminal launch relies on AppleScript, so only macOS is supported for now.

`workspace/` is not synced automatically — it's only packaged when you manually save a snapshot. Zotero handles syncing the paper card note and snapshot ZIP; the local directory tree stays on your machine.

`CURRENT_ITEM` points to one item at a time. Cross-item coordination is something we want to tackle next.

---

## What's Next

**Cross-item linking** — letting the Agent move fluidly across multiple papers, not just the one in focus.

**Skills and MCP support** — shipping the workspace with a set of ready-to-use tools: web search, citation comparison, structured synthesis. If you've built a good AI-assisted reading workflow around useful skills or MCP servers, contributing it here would help a lot of people.

**Windows / Linux** — replacing the AppleScript launch layer.

**More Agents** — anything that runs on the command line should be able to plug in.

**Migration to TypeScript** — the codebase is currently plain JavaScript. TypeScript is friendlier for AI-assisted development: type information gives Agents a much clearer picture of the code when reading and modifying it.

---

AI-assisted research shouldn't require a computer science degree. Whether you work in history, literature, sociology, or the sciences — if you have good workflow ideas, come build with us. Open an issue, start a conversation, send a PR. The goal is simple: make this genuinely useful for anyone doing serious reading and thinking.

---

## License

[MIT](LICENSE)
