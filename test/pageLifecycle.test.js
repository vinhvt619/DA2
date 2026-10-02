import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmrPageLifecycle, adaptViteClientForBfcache, viteHmrBfcache } from "../scripts/viteHmrBfcache.mjs";
import { bindSocketPageLifecycle } from "../src/utils/socketPageLifecycle.js";

function transition(target, type, persisted = true) {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", { value: persisted });
  target.dispatchEvent(event);
}

test("BFCache and freeze close HMR once and reconnect without treating old sockets as server failures", async () => {
  const window = new EventTarget();
  const document = new EventTarget();
  const events = [];
  const oldSocket = {};
  const lifecycle = createHmrPageLifecycle({ window, document,
    disconnect: () => events.push("disconnect"), reconnect: () => events.push("connect"), onError: assert.fail,
  });
  lifecycle.rememberSocket(oldSocket);
  transition(window, "pagehide");
  transition(document, "freeze");
  assert.equal(lifecycle.ignoresDisconnect(oldSocket), true);
  assert.equal(lifecycle.ignoresDisconnect({}), false);
  transition(document, "resume");
  transition(window, "pageshow");
  await Promise.resolve();
  assert.deepEqual(events, ["disconnect", "connect"]);
  const newSocket = {};
  lifecycle.rememberSocket(newSocket);
  assert.equal(lifecycle.ignoresDisconnect(newSocket), false);
  lifecycle.dispose();
  transition(window, "pagehide");
  assert.deepEqual(events, ["disconnect", "connect"]);
});

test("ordinary navigation does not turn genuine HMR disconnects into BFCache restores", () => {
  const window = new EventTarget();
  const document = new EventTarget();
  const lifecycle = createHmrPageLifecycle({ window, document, disconnect: assert.fail, reconnect: assert.fail, onError: assert.fail });
  const socket = {};
  lifecycle.rememberSocket(socket);
  transition(window, "pagehide", false);
  transition(window, "pageshow", false);
  assert.equal(lifecycle.ignoresDisconnect(socket), false);
  lifecycle.dispose();
});

test("Socket.IO page lifecycle suspends and restores once, including freeze/resume", () => {
  const target = new EventTarget();
  const documentTarget = new EventTarget();
  const events = [];
  const dispose = bindSocketPageLifecycle({ target, documentTarget, onSuspend: () => events.push("disconnect"), onRestore: () => events.push("connect") });
  transition(target, "pagehide");
  transition(documentTarget, "freeze");
  transition(documentTarget, "resume");
  transition(target, "pageshow");
  assert.deepEqual(events, ["disconnect", "connect"]);
  dispose();
  transition(documentTarget, "freeze");
  assert.deepEqual(events, ["disconnect", "connect"]);
});

test("the Vite dev adapter matches the installed client and preserves its reload path", async () => {
  const code = await readFile(new URL("../node_modules/vite/dist/client/client.mjs", import.meta.url), "utf8");
  const adapted = adaptViteClientForBfcache(code);
  assert.match(adapted, /rabbitcvHmrLifecycle\.ignoresDisconnect/);
  assert.match(adapted, /server connection lost\. Polling for restart/);
  assert.match(adapted, /rabbitcvHmrRevision !== payload.data\) location.reload/);
  assert.equal(viteHmrBfcache().apply, "serve");
  assert.equal(viteHmrBfcache().transform("unchanged", "/src/main.jsx"), undefined);
  assert.throws(() => adaptViteClientForBfcache("unknown Vite client"), /Vite client changed/);
});
