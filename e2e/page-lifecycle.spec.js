import { expect, test } from "@playwright/test";

test.use({ launchOptions: { ignoreDefaultArgs: ["--disable-back-forward-cache"] } });

test("restoring the real browser BFCache retains entered text and reconnects HMR without F5", async ({ page }) => {
  let documentRequests = 0;
  let connectedMessages = 0;
  page.on("console", (message) => {
    if (message.text() === "[vite] connected.") connectedMessages += 1;
  });
  page.on("request", (request) => {
    if (request.isNavigationRequest() && new URL(request.url()).pathname === "/News") documentRequests += 1;
  });
  await page.goto("/News");
  await expect(page.getByPlaceholder("Tìm bài viết...")).toBeVisible();
  await expect.poll(() => connectedMessages).toBe(1);
  await page.evaluate(async () => {
    const { createHotContext } = await import("/@vite/client");
    window.rabbitcvLifecycleTest = { restored: false, events: [], connections: 0 };
    createHotContext("/__rabbitcv_lifecycle_test__").on("rabbitcv:hmr-revision", () => { window.rabbitcvLifecycleTest.connections += 1; });
    window.addEventListener("pageshow", (event) => { window.rabbitcvLifecycleTest.restored = event.persisted; window.rabbitcvLifecycleTest.events.push(`pageshow:${event.persisted}`); });
    window.addEventListener("pagehide", (event) => window.rabbitcvLifecycleTest.events.push(`pagehide:${event.persisted}`));
    document.addEventListener("freeze", () => window.rabbitcvLifecycleTest.events.push("freeze"));
    document.addEventListener("resume", () => window.rabbitcvLifecycleTest.events.push("resume"));
  });
  await page.getByPlaceholder("Tìm bài viết...").fill("Ban nhap can giu nguyen");
  const beforeRestore = await page.evaluate(() => window.rabbitcvLifecycleTest.connections);
  await page.goto("/RabbitCV.png");
  await page.goBack({ waitUntil: "commit" });
  await expect.poll(() => page.evaluate(() => window.rabbitcvLifecycleTest?.restored)).toBe(true);
  await expect(page.getByPlaceholder("Tìm bài viết...")).toHaveValue("Ban nhap can giu nguyen");
  await expect.poll(() => page.evaluate(() => window.rabbitcvLifecycleTest.connections)).toBeGreaterThan(beforeRestore);
  expect(documentRequests).toBe(1);
});
