const test = require("node:test");
const assert = require("node:assert/strict");

const MinerUProtocol = require("../src/shared/mineru-protocol.js");

test("upload request uses raw PUT body without custom headers", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const options = MinerUProtocol.buildUploadRequestOptions(bytes);

  assert.equal(options.method, "PUT");
  assert.equal(options.body, bytes);
  assert.equal("headers" in options, false);
});

test("stage error includes host, status, batch and trace", () => {
  const message = MinerUProtocol.formatStageError("MinerU file upload failed", {
    status: 403,
    host: "oss-example.test",
    batchID: "batch-123",
    traceID: "trace-456",
    bodySnippet: "Signature mismatch"
  });

  assert.match(message, /status 403/);
  assert.match(message, /host oss-example\.test/);
  assert.match(message, /batch batch-123/);
  assert.match(message, /trace trace-456/);
  assert.match(message, /Signature mismatch/);
});

test("describeTaskState handles waiting-file and failed", () => {
  const waiting = MinerUProtocol.describeTaskState("waiting-file");
  const failed = MinerUProtocol.describeTaskState("failed", "bad pdf");

  assert.equal(waiting.terminal, false);
  assert.match(waiting.message, /not yet observed by MinerU/);
  assert.equal(failed.terminal, true);
  assert.equal(failed.success, false);
  assert.equal(failed.message, "bad pdf");
});
