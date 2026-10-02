import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { assertDevPortsAvailable, startDevServices, waitForBackendHealth } from "../scripts/devStartup.mjs";

async function reservePort(t) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "0.0.0.0", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return server.address().port;
}

test("occupied frontend port prevents either service from starting", async (t) => {
  const port = await reservePort(t);
  const events = [];
  await assert.rejects(startDevServices({
    start: (script) => events.push(script),
    checkPorts: () => assertDevPortsAvailable({ frontendPort: port }),
    waitForBackend: async () => events.push("healthy"),
  }), new RegExp(`Frontend: cổng ${port}.*Ctrl\\+C`));
  assert.deepEqual(events, []);
});

test("occupied backend port is rejected before an old health endpoint can be reused", async (t) => {
  const backendPort = await reservePort(t);
  const frontend = createServer();
  await new Promise((resolve) => frontend.listen(0, "0.0.0.0", resolve));
  const frontendPort = frontend.address().port;
  await new Promise((resolve) => frontend.close(resolve));
  const events = [];
  await assert.rejects(startDevServices({
    start: (script) => events.push(script),
    checkPorts: () => assertDevPortsAvailable({ frontendPort, backendPort }),
    waitForBackend: async () => events.push("healthy"),
  }), new RegExp(`Backend: cổng ${backendPort}`));
  assert.deepEqual(events, []);
});

test("port checks and ready notification precede the appropriate processes", async () => {
  const events = [];
  await startDevServices({
    checkPorts: async () => events.push("ports-free"),
    start: (script) => events.push(script),
    waitForBackend: async () => events.push("healthy"),
    onBackendReady: () => events.push("ready"),
  });
  assert.deepEqual(events, ["ports-free", "start", "healthy", "ready", "dev"]);
});

test("frontend only starts after backend health succeeds", async () => {
  const events = [];
  await startDevServices({ start: (script) => events.push(script), waitForBackend: async () => events.push("healthy") });
  assert.deepEqual(events, ["start", "healthy", "dev"]);
});

test("backend failure never starts frontend", async () => {
  const events = [];
  await assert.rejects(startDevServices({ start: (script) => events.push(script), waitForBackend: async () => { throw new Error("unavailable"); } }), /unavailable/);
  assert.deepEqual(events, ["start"]);
});

test("stopping during startup prevents frontend from opening", async () => {
  const events = [];
  let stopping = false;
  await startDevServices({ start: (script) => events.push(script), waitForBackend: async () => { stopping = true; }, isStopping: () => stopping });
  assert.deepEqual(events, ["start"]);
});

test("health retries connection refusal and unready database before allowing startup", async () => {
  let time = 0;
  let attempts = 0;
  await waitForBackendHealth({ url: "http://127.0.0.1:5000/api/health", timeoutMs: 100, intervalMs: 10,
    now: () => time, sleepImpl: async (duration) => { time += duration; },
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("ECONNREFUSED");
      return { ok: attempts > 2, json: async () => ({ ok: attempts > 3 }) };
    },
  });
  assert.equal(attempts, 4);
});

test("unhealthy backend times out with an actionable error", async () => {
  let time = 0;
  let attempts = 0;
  await assert.rejects(waitForBackendHealth({ url: "http://127.0.0.1:5000/api/health", timeoutMs: 30, intervalMs: 10,
    now: () => time, sleepImpl: async (duration) => { time += duration; },
    fetchImpl: async () => { attempts += 1; return { ok: false }; },
  }), /Backend chưa sẵn sàng.*MongoDB/);
  assert.equal(attempts, 3);
});

test("backend no longer uses deprecated Mongoose new option", async () => {
  for (const file of ["../server/server.js", "../server/services/applicationStatusService.js"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\bnew:\s*(?:true|false)/);
    assert.match(source, /returnDocument:\s*['"]after['"]/);
  }
});

test("chat header no longer contains call or video actions", async () => {
  const source = await readFile(new URL("../src/Components/ChatBox.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /PhoneIcon|VideoCameraIcon/);
  assert.match(source, /InformationCircleIcon/);
});
