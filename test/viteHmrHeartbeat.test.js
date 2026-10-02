import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { viteHmrHeartbeat } from "../scripts/viteHmrHeartbeat.mjs";

test("HMR uses server-side pings even without browser timer activity", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const httpServer = new EventEmitter();
  let pings = 0;
  const open = { readyState: 1, ping: () => { pings += 1; } };
  const closed = { readyState: 3, ping: () => { throw new Error("closed client must not be pinged"); } };
  const plugin = viteHmrHeartbeat();
  assert.equal(plugin.apply, "serve");
  plugin.configureServer({ ws: { clients: new Set([{ socket: open }, { socket: closed }]) }, httpServer });
  t.mock.timers.tick(30_000);
  assert.equal(pings, 3);
  httpServer.emit("close");
  t.mock.timers.tick(30_000);
  assert.equal(pings, 3);
});

test("a real HMR WebSocket answers server pings without browser-side keepalive messages", { timeout: 5_000 }, async (t) => {
  const cacheDir = await mkdtemp(join(tmpdir(), "rabbitcv-hmr-test-"));
  t.after(() => rm(cacheDir, { recursive: true, force: true }));
  const server = await createServer({
    configFile: false,
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: "silent",
    plugins: [viteHmrHeartbeat(50)],
    server: { host: "127.0.0.1", port: 0, hmr: { path: "/__vite_hmr" } },
  });
  let socket;
  t.after(async () => {
    socket?.close();
    await server.close();
  });
  await server.listen();
  const pongs = new Promise((resolve) => {
    server.ws.on("connection", (client) => {
      let count = 0;
      client.on("pong", () => {
        if (++count === 2) resolve();
      });
    });
  });
  socket = new WebSocket(`ws://127.0.0.1:${server.httpServer.address().port}/__vite_hmr`, "vite-hmr");
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  await pongs;
  assert.equal(socket.readyState, WebSocket.OPEN);
});
