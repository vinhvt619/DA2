import { expect, test } from "@playwright/test";

const sampleTitle = "Senior React Developer";
const newJob = () => ({
  _id: "job-visibility-e2e", title: sampleTitle, company: "FPT Software",
  location: "Hà Nội", type: "Full-time", salary: "30-50 triệu", tags: ["React"],
  status: "Active", approvalStatus: 'Approved', isAdminHidden: false, deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z", expiryDate: "2099-01-01T00:00:00Z",
});
const respond = (route, body, status = 200) => route.fulfill({
  status, contentType: "application/json", headers: { "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

async function mockApi(page, state, role = "employee") {
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const job = state.job;
    if (pathname === "/api/me") return respond(route, { user: {
      _id: `visibility-${role}`, role, username: `visibility-${role}`,
      fullName: "Kiểm thử hiển thị tin", email: "visibility@example.test",
    } });
    if (pathname === "/api/jobs") {
      if (state.fail) return respond(route, { message: "API unavailable" }, 500);
      // Also exercise a stale backend response containing an admin-hidden Active job.
      const jobs = state.returnUnavailable ? [job]
        : job.status === "Active" && !job.isAdminHidden && !job.deletedAt ? [job] : [];
      return respond(route, jobs);
    }
    if (pathname === "/api/admin/jobs") return respond(route, { jobs: job.deletedAt ? [] : [{
      ...job, company: { name: job.company }, status: job.isAdminHidden ? "closed" : "active",
    }] });
    if (pathname === `/api/admin/jobs/${job._id}/hide` && request.method() === "PUT") {
      job.isAdminHidden = true;
      job.status = "Expired";
      return respond(route, { message: "Hidden" });
    }
    if (pathname === `/api/admin/jobs/${job._id}/unhide` && request.method() === "PUT") {
      job.isAdminHidden = false;
      job.status = "Active";
      return respond(route, { message: "Restored" });
    }
    if (pathname === `/api/admin/jobs/${job._id}` && request.method() === "DELETE") {
      job.status = "Deleted";
      job.deletedAt = new Date().toISOString();
      return respond(route, { message: "Deleted" });
    }
    if (pathname.startsWith("/api/jobs/")) return respond(route, { message: "Not found" }, 410);
    if (pathname.endsWith("unread-count")) return respond(route, { count: 0 });
    if (["/api/resumes", "/api/saved-jobs", "/api/notifications"].includes(pathname)) return respond(route, []);
    return respond(route, {});
  });
}

async function refocus(page) {
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
}

test("Đồng bộ ẩn/hiện/xóa tin tuyển dụng", async ({ page, browser }) => {
  const path = "/Jobs";
  const state = { job: newJob() };
  await mockApi(page, state);
  await page.goto(path);
  await expect(page.getByText(sampleTitle, { exact: true }).first()).toBeVisible();
  const adminContext = await browser.newContext();
  try {
    const admin = await adminContext.newPage();
    await mockApi(admin, state, "admin");
    await admin.goto(new URL("/admin/jobs", page.url()).href);
    await admin.getByTitle("Ẩn tin tuyển dụng (đóng tuyển)").click();
    await expect(admin.getByTitle("Hiện lại tin tuyển dụng")).toBeVisible();
    await refocus(page);
    await expect(page.getByText(sampleTitle, { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href^="/jobs/"]')).toHaveCount(0);
    await admin.getByTitle("Hiện lại tin tuyển dụng").click();
    await expect(admin.getByTitle("Ẩn tin tuyển dụng (đóng tuyển)")).toBeVisible();
    await refocus(page);
    await expect(page.getByText(sampleTitle, { exact: true }).first()).toBeVisible();
    await admin.getByTitle("Xóa tin tuyển dụng").click();
    await admin.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(admin.getByText(sampleTitle, { exact: true })).toHaveCount(0);
    await refocus(page);
    await expect(page.getByText(sampleTitle, { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href^="/jobs/"]')).toHaveCount(0);
  } finally { await adminContext.close(); }
});

test("Tự động cập nhật danh sách việc làm qua polling", async ({ page }) => {
  const state = { job: newJob() };
  await page.clock.install();
  await mockApi(page, state);
  await page.goto("/AllJobs");
  await expect(page.getByText(sampleTitle, { exact: true })).toBeVisible();
  state.job.status = "Deleted";
  state.job.deletedAt = new Date().toISOString();
  await page.clock.fastForward(15_100);
  await expect(page.getByText(sampleTitle, { exact: true })).toHaveCount(0);
});

test("Báo lỗi khi tin tuyển dụng bị gỡ", async ({ page }) => {
  await mockApi(page, { job: newJob() });
  await page.goto("/jobs/fe-react-senior");
  await expect(page.getByText("Không tìm thấy tin tuyển dụng", { exact: true })).toBeVisible();
  await expect(page.getByText(sampleTitle, { exact: true })).toHaveCount(0);
});
