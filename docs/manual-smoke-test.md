# Manual Smoke Test

## Install and menu

1. Build the XPI with `npm run build`.
2. Install it in Zotero 8.
3. Right-click a single regular library item.
4. Confirm the `Agent Copilot` submenu appears.

## Refresh paper card

1. Click `Refresh Paper Card`.
2. Confirm the library workspace root is created under the configured base path.
3. Confirm `papers/<itemKey>/paper-card.md` and `papers/<itemKey>/meta.json` exist.
4. Confirm a managed child note appears under the item.

## Convert PDF to Markdown

1. Configure a valid MinerU API token.
2. Use `Convert PDF to Markdown > Chinese` on an item with a local PDF attachment.
3. Confirm `papers/<itemKey>/<pdf-stem>.md` is created.
4. Confirm `papers/<itemKey>/source/<original-pdf-name>.pdf` is created.
5. Confirm `papers/<itemKey>/mineru/result.zip`, `papers/<itemKey>/mineru/manifest.json`, and `papers/<itemKey>/mineru/raw/` exist.
6. Repeat with `English` and confirm `meta.json` records `lastMineruLanguage: "en"`.

## Open workspace

1. Click `Open AI Workspace`.
2. Confirm Finder opens the item paper directory.

## Launch agents

1. Configure valid Claude and Codex executable paths.
2. Click `Launch Claude Code` and `Launch Codex`.
3. Confirm the terminal opens in the library workspace root.
4. Confirm `CURRENT_ITEM.md` points to the selected paper and includes `paper-card.md`.
5. If Markdown has been generated, confirm `CURRENT_ITEM.md` also points to `<pdf-stem>.md`.

## Snapshot and restore

1. Put a test file inside `papers/<itemKey>/workspace/`.
2. Click `Save Workspace Snapshot`.
3. Confirm one managed child attachment exists and is updated on subsequent saves.
4. Delete the local `papers/<itemKey>/` directory.
5. Click `Restore Workspace`.
6. Confirm the paper subtree, MinerU outputs, and workspace contents are recreated locally.
7. Confirm `source/<original-pdf-name>.pdf` is restored from the Zotero PDF attachment rather than the snapshot zip.
