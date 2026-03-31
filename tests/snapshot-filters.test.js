const test = require("node:test");
const assert = require("node:assert/strict");

const SnapshotFilters = require("../src/shared/snapshot-filters.js");

test("snapshot filter excludes known cache directories", () => {
  assert.equal(SnapshotFilters.shouldIncludePath("/tmp/node_modules", true), false);
  assert.equal(SnapshotFilters.shouldIncludePath("/tmp/.git", true), false);
});

test("snapshot filter excludes temp-ish files and keeps useful files", () => {
  assert.equal(SnapshotFilters.shouldIncludePath("/tmp/debug.log", false), false);
  assert.equal(SnapshotFilters.shouldIncludePath("/tmp/workspace/notes.md", false), true);
});
