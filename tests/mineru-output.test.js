const test = require("node:test");
const assert = require("node:assert/strict");

const MinerUOutput = require("../src/shared/mineru-output.js");

test("finds full markdown inside nested MinerU output", () => {
  const index = MinerUOutput.buildArtifactIndex([
    "assets/img-1.png",
    "results/example_model.json",
    "results/full.md"
  ]);

  assert.equal(index.fullMarkdownPath, "results/full.md");
});

test("indexes structured MinerU artifacts", () => {
  const index = MinerUOutput.buildArtifactIndex([
    "example_content_list.json",
    "example_middle.json",
    "nested/example_model.json",
    "nested/example_layout.pdf",
    "nested/example_span.pdf"
  ]);

  assert.deepEqual(index.contentListPaths, ["example_content_list.json"]);
  assert.deepEqual(index.middlePaths, ["example_middle.json"]);
  assert.deepEqual(index.modelPaths, ["nested/example_model.json"]);
  assert.deepEqual(index.layoutPdfPaths, ["nested/example_layout.pdf"]);
  assert.deepEqual(index.spanPdfPaths, ["nested/example_span.pdf"]);
});
