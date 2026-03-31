const test = require("node:test");
const assert = require("node:assert/strict");

const PaperRenderer = require("../src/shared/paper-renderer.js");

test("paper renderer outputs core metadata blocks", () => {
  const markdown = PaperRenderer.renderPaperCardMarkdown({
    title: "Paper Title",
    authors: ["Ada Lovelace", "Grace Hopper"],
    year: "2024",
    venue: "TestConf",
    doi: "10.1234/example",
    url: "https://example.com",
    itemKey: "ABCD1234",
    citationKey: "lovelace2024",
    abstractNote: "Example abstract.",
    tags: ["ai", "zotero"],
    attachments: [{ label: "Paper PDF (application/pdf)" }]
  });

  assert.match(markdown, /^# Paper Title/m);
  assert.match(markdown, /## Abstract/);
  assert.match(markdown, /Paper PDF/);
});
