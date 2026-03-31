const test = require("node:test");
const assert = require("node:assert/strict");

const MarkdownNote = require("../src/shared/markdown-note.js");

test("renderManagedNote preserves markdown through round trip", () => {
  const markdown = "# Title\n\n- one\n- two";
  const noteHtml = MarkdownNote.renderManagedNote(markdown);
  assert.equal(MarkdownNote.extractManagedMarkdown(noteHtml), markdown);
});

test("extractManagedMarkdown ignores unrelated note html", () => {
  assert.equal(MarkdownNote.extractManagedMarkdown("<p>Hello</p>"), null);
});

test("extractManagedMarkdown accepts legacy marker during migration", () => {
  const noteHtml = '<pre data-agent-copilot-role="paper-md"><code>legacy</code></pre>';
  assert.equal(MarkdownNote.extractManagedMarkdown(noteHtml), "legacy");
});
