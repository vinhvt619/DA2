import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createApiLimiter, shouldSkipLocalApiLimit } from "../server/utils/apiRateLimiter.js";

async function startApi(t, environment) {
  const app = express();
  app.use("/api", createApiLimiter(environment));
  app.get("/api/me", (request, response) => response.json({ ok: true }));
  app.get("/api/notifications/unread-count", (request, response) => response.json({ count: 0 }));
  app.post("/api/login", rateLimit({ windowMs: 60_000, limit: 2 }), (request, response) => response.json({ ok: true }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("only loopback development requests bypass the general API limit", () => {
  for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) {
    const request = { socket: { remoteAddress: address } };
    assert.equal(shouldSkipLocalApiLimit(request, "development"), true);
    assert.equal(shouldSkipLocalApiLimit(request, "production"), false);
    assert.equal(shouldSkipLocalApiLimit(request, "test"), false);
  }
  assert.equal(shouldSkipLocalApiLimit({ socket: { remoteAddress: "192.168.1.2" } }, "development"), false);
  assert.equal(shouldSkipLocalApiLimit({ ip: "127.0.0.1" }, "development"), false);
});

test("local browsing beyond 300 requests still loads account and notifications", async (t) => {
  const baseURL = await startApi(t, "development");
  for (let index = 0; index < 301; index += 1) {
    const response = await fetch(`${baseURL}/api/me`);
    assert.equal(response.status, 200);
    await response.json();
  }
  const response = await fetch(`${baseURL}/api/notifications/unread-count`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { count: 0 });
});

test("production still enforces the shared 300 request budget", async (t) => {
  const baseURL = await startApi(t, "production");
  for (let index = 0; index < 300; index += 1) {
    const response = await fetch(`${baseURL}/api/me`);
    assert.equal(response.status, 200);
    await response.json();
  }
  const response = await fetch(`${baseURL}/api/notifications/unread-count`);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.match((await response.json()).message, /Qua nhieu yeu cau/);
});

test("bypassing the local general limit does not bypass endpoint limits", async (t) => {
  const baseURL = await startApi(t, "development");
  for (let index = 0; index < 2; index += 1) {
    const response = await fetch(`${baseURL}/api/login`, { method: "POST" });
    assert.equal(response.status, 200);
    await response.json();
  }
  const response = await fetch(`${baseURL}/api/login`, { method: "POST" });
  assert.equal(response.status, 429);
  await response.text();
  assert.equal((await fetch(`${baseURL}/api/me`)).status, 200);
});
