import { expect, test } from "@playwright/test";

const company = { _id: "company", username: "company", fullName: "Doanh nghiệp kiểm thử", role: "company", email: "company@example.test" };
const initialApplication = { _id: "app", fullName: "Ứng viên kiểm thử", email: "candidate@example.test", resumeId: "cv", jobId: { _id: "job", title: "Frontend Developer" }, status: "Pending", createdAt: "2026-10-01" };

async function installMocks(page, initialStatus = "Pending", fail = false) {
  let application = { ...initialApplication, status: initialStatus };
  let writes = 0;
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    let body = {};
    let status = 200;
    if (pathname === "/api/me") body = { user: company };
    else if (pathname === "/api/jobs/my") body = [{ _id: "job", title: "Frontend Developer", status: "Active" }];
    else if (pathname === "/api/jobs/applications") body = [application];
    else if (pathname === "/api/jobs/applications/app") {
      writes += 1;
      if (fail) { status = 500; body = { message: "Không thể cập nhật trạng thái hồ sơ." }; }
      else { application = { ...application, status: request.postDataJSON().status }; body = { application }; }
    } else if (pathname.endsWith("/unread-count")) body = { count: 0 };
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return { writes: () => writes };
}

test("rejecting requires confirmation and permanently disables the status selector after reload", async ({ page }, testInfo) => {
  const mocks = await installMocks(page);
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await page.getByRole("button", { name: "Chờ duyệt", exact: true }).click();
  await page.getByRole("option", { name: "Đã từ chối", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("không thể chuyển sang trạng thái khác");
  expect(mocks.writes()).toBe(0);
  await confirm.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chờ duyệt", exact: true })).toBeEnabled();
  expect(mocks.writes()).toBe(0);
  await page.getByRole("button", { name: "Chờ duyệt", exact: true }).click();
  await page.getByRole("option", { name: "Đã từ chối", exact: true }).click();
  await confirm.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đã từ chối", exact: true })).toBeDisabled();
  expect(mocks.writes()).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("application-rejected.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đã từ chối", exact: true })).toBeDisabled();
});

test("a failed rejection keeps the previous status available", async ({ page }) => {
  await installMocks(page, "Pending", true);
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await page.getByRole("button", { name: "Chờ duyệt", exact: true }).click();
  await page.getByRole("option", { name: "Đã từ chối", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByText("Không thể cập nhật trạng thái hồ sơ.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chờ duyệt", exact: true })).toBeEnabled();
});
