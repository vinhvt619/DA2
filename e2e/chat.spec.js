import { expect, test } from "@playwright/test";

test("chat header only shows information and sending messages still works", async ({ page }, testInfo) => {
  const user = { _id: "candidate", username: "candidate", fullName: "Ứng viên kiểm thử", role: "employee" };
  const company = { _id: "company", username: "company", fullName: "Doanh nghiệp kiểm thử", role: "company" };
  const room = "private_candidate_company";
  let sent;
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    let body = {};
    if (pathname === "/api/me") body = { user };
    else if (pathname === "/api/chat/threads") body = [{ room, lastMessage: "Chào bạn", partner: { id: company._id, name: company.fullName, role: company.role }, lastMessageAt: "2026-10-02T01:00:00Z" }];
    else if (pathname === "/api/chat/users") body = [company];
    else if (pathname === "/api/user/profile/company") body = { user: company };
    else if (pathname === "/api/messages" && request.method() === "GET") body = [];
    else if (pathname === "/api/messages" && request.method() === "POST") {
      sent = request.postDataJSON();
      body = { ...sent, _id: "sent-message", createdAt: "2026-10-02T01:01:00Z" };
    } else if (pathname.endsWith("/unread-count")) body = { unreadCount: 0, count: 0 };
    else if (pathname === "/api/saved-jobs" || pathname === "/api/resumes") body = [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/Message");
  const info = page.getByRole("button", { name: "Thông tin cuộc trò chuyện", exact: true });
  await expect(info).toBeVisible();
  expect(await page.locator("input, textarea, select").evaluateAll((fields) => fields.filter((field) => !field.id && !field.name).map((field) => field.outerHTML))).toEqual([]);
  await expect(info.locator("..").getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /gọi thoại|gọi video|video call/i })).toHaveCount(0);
  const input = page.getByPlaceholder("Nhập tin nhắn...", { exact: true });
  await input.fill("Tin nhắn kiểm thử sau khi bỏ nút gọi");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  expect(sent).toMatchObject({ content: "Tin nhắn kiểm thử sau khi bỏ nút gọi", room });
  await expect(page.getByText(sent.content, { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("chat-without-call-buttons.png"), fullPage: true });
});

test("header and news controls have form identifiers and search still works", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) }));
  await page.goto("/News");
  await expect(page.getByRole("heading", { name: "Tin tức & Cẩm nang nghề nghiệp" })).toBeVisible();
  expect(await page.locator("input, textarea, select").evaluateAll((fields) => fields.filter((field) => !field.id && !field.name).map((field) => field.outerHTML))).toEqual([]);
  await page.getByPlaceholder("Tìm bài viết...").fill("khong-co-bai-viet-kiem-thu");
  await expect(page.getByText("0 bài viết", { exact: true })).toBeVisible();
});
