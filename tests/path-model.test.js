const test = require("node:test");
const assert = require("node:assert/strict");

const PathModel = require("../src/shared/path-model.js");

test("libraryRootName includes id and slug", () => {
  assert.equal(
    PathModel.libraryRootName(5, "My Library & Papers"),
    "library-5-my-library-papers"
  );
});

test("paperRelativeDir uses item key", () => {
  assert.equal(PathModel.paperRelativeDir("ABCD1234"), "papers/ABCD1234");
});

test("paper path segments stay split for filesystem joins", () => {
  assert.deepEqual(PathModel.paperRelativeSegments("ABCD1234"), ["papers", "ABCD1234"]);
  assert.deepEqual(
    PathModel.paperWorkspaceRelativeSegments("ABCD1234"),
    ["papers", "ABCD1234", "workspace"]
  );
});

test("parsed markdown filename follows source pdf stem", () => {
  assert.equal(PathModel.parsedMarkdownFilename("paper-v2.pdf"), "paper-v2.md");
});
