import { expect, test } from "@playwright/test";

test("Nhận thông báo thời gian thực qua Socket", async ({ page }) => {
  const user = { _id: "507f1f77bcf86cd799439012", username: "candidate", fullName: "Ứng viên kiểm thử", role: "employee" };
  let records = [];
  let socket;
  await page.routeWebSocket("**/socket.io/**", (ws) => {
    socket = ws;
    ws.send('0{"sid":"notification-test","upgrades":[],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}');
    ws.onMessage((message) => {
      if (String(message).startsWith("40")) ws.send('40{"sid":"notification-test"}');
      if (message === "2") ws.send("3");
    });
  });
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    let body = {};
    if (pathname === "/api/me") body = { user };
    else if (pathname === "/api/socket-ticket") body = { token: "mock-ticket" };
    else if (pathname === "/api/notifications/unread-count") body = { count: records.filter((r) => !r.isRead).length };
    else if (pathname === "/api/notifications") body = { notifications: records, totalPages: 1, currentPage: 1 };
    else if (pathname === "/api/notifications/mark-all-read") { records = records.map((r) => ({ ...r, isRead: true })); body = { modifiedCount: records.length }; }
    else if (pathname === "/api/chat/unread-count") body = { unreadCount: 0 };
    else if (pathname === "/api/saved-jobs") body = [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/notifications");
  await expect.poll(() => Boolean(socket)).toBe(true);
  const bell = page.getByRole("button", { name: "Thông báo", exact: true });
  await expect(bell).toBeVisible();
  const notification = { _id: "507f1f77bcf86cd799439011", recipient: user._id, title: "Đã nhận lời mời phỏng vấn", message: "Hồ sơ của bạn được mời phỏng vấn", isRead: false, createdAt: new Date().toISOString(), link: "/UserDashboard" };
  records = [notification];
  socket.send(`42${JSON.stringify(["newNotification", notification])}`);
  await expect(bell).toHaveText("1", { timeout: 5000 });
  await expect(page.getByText(notification.title, { exact: true }).first()).toBeVisible();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(1);
  // Duplicate delivery must not create another toast or increment the badge.
  socket.send(`42${JSON.stringify(["newNotification", notification])}`);
  await expect(bell).toHaveText("1");
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(1);
  // A disconnected client reconciles from REST when its socket reconnects.
  const previousSocket = socket;
  records = [{ ...notification, _id: "507f1f77bcf86cd799439014", title: "Thông báo khi mất kết nối" }, ...records];
  previousSocket.close();
  await expect.poll(() => socket !== previousSocket, { timeout: 10000 }).toBe(true);
  await expect(bell).toHaveText("2", { timeout: 5000 });
  await expect(page.getByText("Thông báo khi mất kết nối", { exact: true })).toBeVisible();
  await bell.click();
  await expect(bell).toHaveText("");
});
