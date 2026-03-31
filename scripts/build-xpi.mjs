import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const outDir = path.join(repoRoot, "dist");
const outFile = path.join(outDir, `zotero-agent-copilot-${manifest.version}.xpi`);
const includePaths = [
  "manifest.json",
  "bootstrap.js",
  "prefs.js",
  "preferences.xhtml",
  "preferences.js",
  "locale",
  "src"
];

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outFile)) {
  fs.rmSync(outFile);
}

const result = spawnSync("zip", ["-qr", outFile, ...includePaths], {
  cwd: repoRoot,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Built ${outFile}`);
