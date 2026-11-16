import { expect, test } from "@playwright/test";

const company = { _id: "company", username: "company", fullName: "Doanh nghiệp kiểm thử", role: "company", email: "company@example.test" };
const candidate = { _id: "cand-1", username: "candidate", fullName: "Ứng viên kiểm thử", role: "employee", email: "candidate@example.test" };
const initialApplication = {
  _id: "app",
  fullName: "Ứng viên kiểm thử",
  email: "candidate@example.test",
  candidateId: "cand-1",
  resumeId: "cv",
  jobId: { _id: "job", title: "Frontend Developer", company: "Công ty Kiểm thử", status: "Active" },
  jobSnapshot: { title: "Frontend Developer", company: "Công ty Kiểm thử" },
  status: "Pending",
  statusHistory: [{ status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" }],
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-01T08:00:00.000Z",
};

async function installMocks(page, initialStatus = "Pending", fail = false) {
  let application = {
    ...initialApplication,
    status: initialStatus,
    statusHistory: [{ status: initialStatus, timestamp: "2026-10-01T08:00:00.000Z" }],
  };
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
      if (fail) {
        status = 500;
        body = { message: "Không thể cập nhật trạng thái hồ sơ." };
      } else {
        const nextStatus = request.postDataJSON().status;
        const ts = `2026-10-0${writes + 1}T09:00:00.000Z`;
        application = {
          ...application,
          status: nextStatus,
          updatedAt: ts,
          statusHistory: [...application.statusHistory, { status: nextStatus, timestamp: ts }],
        };
        body = { application };
      }
    } else if (pathname.endsWith("/unread-count")) body = { count: 0 };
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return { writes: () => writes };
}

test("Xác nhận từ chối và khóa trạng thái hồ sơ", async ({ page }, testInfo) => {
  const mocks = await installMocks(page);
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await page.getByRole("button", { name: "Chờ xử lý", exact: true }).click();
  await page.getByRole("option", { name: "Từ chối", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("không thể chuyển sang trạng thái khác");
  expect(mocks.writes()).toBe(0);
  await confirm.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chờ xử lý", exact: true })).toBeEnabled();
  expect(mocks.writes()).toBe(0);
  await page.getByRole("button", { name: "Chờ xử lý", exact: true }).click();
  await page.getByRole("option", { name: "Từ chối", exact: true }).click();
  await confirm.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("button", { name: "Từ chối", exact: true })).toBeDisabled();
  expect(mocks.writes()).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("application-rejected.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await expect(page.getByRole("button", { name: "Từ chối", exact: true })).toBeDisabled();
});

test("Giữ nguyên trạng thái và timeline khi cập nhật thất bại", async ({ page }) => {
  await installMocks(page, "Pending", true);
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();
  await page.getByRole("button", { name: "Chờ xử lý", exact: true }).click();
  await page.getByRole("option", { name: "Từ chối", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByText("Không thể cập nhật trạng thái hồ sơ.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chờ xử lý", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Xem tiến trình", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const milestones = dialog.getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(milestones).toHaveCount(1);
  await expect(milestones.first()).toContainText("Chờ xử lý");
});

test("Chỉ cho phép chuyển trạng thái tuần tự theo từng bước hợp lệ", async ({ page }) => {
  const mocks = await installMocks(page, "Pending", false);
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Duyệt ứng viên", exact: true }).click();

  // From Pending, only Reviewing and Rejected are offered as next steps
  await page.getByRole("button", { name: "Chờ xử lý", exact: true }).click();
  await expect(page.getByRole("option", { name: "Đang xem xét", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Từ chối", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Phỏng vấn", exact: true })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "Đã đề nghị", exact: true })).toHaveCount(0);

  // Advance Pending -> Reviewing -> Interview -> Offered -> Accepted
  await page.getByRole("option", { name: "Đang xem xét", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đang xem xét", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Đang xem xét", exact: true }).click();
  await expect(page.getByRole("option", { name: "Chờ xử lý", exact: true })).toHaveCount(0);
  await page.getByRole("option", { name: "Phỏng vấn", exact: true }).click();
  await expect(page.getByRole("button", { name: "Phỏng vấn", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Phỏng vấn", exact: true }).click();
  await page.getByRole("option", { name: "Đã đề nghị", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đã đề nghị", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Đã đề nghị", exact: true }).click();
  await page.getByRole("option", { name: "Đã nhận", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đã nhận", exact: true })).toBeVisible();
  expect(mocks.writes()).toBe(4);

  await page.getByRole("button", { name: "Xem tiến trình", exact: true }).click();
  const milestones = page.getByRole("dialog").getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(milestones).toHaveCount(5);
  await expect(milestones.nth(0)).toContainText("Chờ xử lý");
  await expect(milestones.nth(4)).toContainText("Đã nhận");
});

test("Đồng bộ tiến trình hai vai trò, xử lý xung đột 409 và kiểm tra mobile/bàn phím", async ({ page }) => {
  let actor = company;
  let forceConflictOnNextPut = false;
  let sharedApps = [
    {
      _id: "app-shared",
      fullName: "Ứng viên Hai Vai Trò",
      email: "cand@example.test",
      candidateId: "cand-1",
      resumeId: "cv-1",
      jobId: { _id: "job-1", title: "Senior React Developer", company: "RabbitTech", status: "Active" },
      jobSnapshot: { title: "Senior React Developer", company: "RabbitTech" },
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" }],
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    },
  ];

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());
    if (pathname === "/api/me") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: actor }) });
    }
    if (pathname === "/api/jobs/my") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ _id: "job-1", title: "Senior React Developer", status: "Active" }]),
      });
    }
    if (pathname === "/api/jobs/applications") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sharedApps) });
    }
    if (pathname === "/api/jobs/applications/mine") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sharedApps) });
    }
    if (pathname === "/api/jobs/applications/app-shared" && req.method() === "PUT") {
      if (forceConflictOnNextPut) {
        forceConflictOnNextPut = false;
        // Another session moved the application to Offered meanwhile
        sharedApps = sharedApps.map((item) => ({
          ...item,
          status: "Offered",
          updatedAt: "2026-10-04T10:15:00.000Z",
          statusHistory: [...item.statusHistory, { status: "Offered", timestamp: "2026-10-04T10:15:00.000Z" }],
        }));
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ code: "INVALID_APPLICATION_STATUS_TRANSITION", message: "Trạng thái hồ sơ vừa thay đổi." }),
        });
      }
      const nextStatus = req.postDataJSON().status;
      const stepIndex = sharedApps[0].statusHistory.length + 1;
      const ts = `2026-10-0${stepIndex}T09:30:00.000Z`;
      sharedApps = sharedApps.map((item) => ({
        ...item,
        status: nextStatus,
        updatedAt: ts,
        statusHistory: [...item.statusHistory, { status: nextStatus, timestamp: ts }],
      }));
      // Simulate real backend PUT returning unpopulated jobId string
      const putApplication = { ...sharedApps[0], jobId: "job-1" };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ application: putApplication }) });
    }
    if (pathname.endsWith("/unread-count")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) });
    }
    if (pathname === "/api/resumes" || pathname === "/api/saved-jobs") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  // 1. Company advances Pending -> Reviewing -> Interview and keeps populated job title
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/CompanyDashboard");
  await page.getByRole("button", { name: "Xem tất cả", exact: true }).first().click();

  await page.getByRole("button", { name: "Chờ xử lý", exact: true }).click();
  await page.getByRole("option", { name: "Đang xem xét", exact: true }).click();
  await expect(page.getByText("Ứng tuyển: Senior React Developer")).toBeVisible();

  await page.getByRole("button", { name: "Đang xem xét", exact: true }).click();
  await page.getByRole("option", { name: "Phỏng vấn", exact: true }).click();
  await expect(page.getByText("Ứng tuyển: Senior React Developer")).toBeVisible();

  // Check mobile overflow & keyboard open/Escape/focus restoration
  const companyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(companyOverflow).toBe(false);

  const timelineBtn = page.getByRole("button", { name: "Xem tiến trình", exact: true });
  await timelineBtn.focus();
  await page.keyboard.press("Enter");
  const companyDialog = page.getByRole("dialog");
  await expect(companyDialog).toBeVisible();
  const companySteps = companyDialog.getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(companySteps).toHaveCount(3);
  await expect(companySteps.nth(0)).toContainText("Chờ xử lý");
  await expect(companySteps.nth(1)).toContainText("Đang xem xét");
  await expect(companySteps.nth(2)).toContainText("Phỏng vấn");
  await expect(companyDialog).not.toContainText("Chưa có mốc thời gian");

  await page.keyboard.press("Escape");
  await expect(companyDialog).toBeHidden();
  await expect(timelineBtn).toBeFocused();

  // 2. 409 conflict refetches real server state without writing fake local milestone
  forceConflictOnNextPut = true;
  await page.getByRole("button", { name: "Phỏng vấn", exact: true }).click();
  await page.getByRole("option", { name: "Từ chối", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByText("Trạng thái hồ sơ vừa thay đổi.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã đề nghị", exact: true })).toBeVisible();

  // 3. Switch to candidate account: UserDashboard and MyApplications reflect exact shared state
  actor = candidate;
  await page.goto("/UserDashboard");
  await expect(page.getByText("Senior React Developer")).toBeVisible();
  await expect(page.getByText("Đã đề nghị", { exact: true })).toBeVisible();

  await page.goto("/my-applications");
  await page.reload();
  const candidateOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(candidateOverflow).toBe(false);

  await expect(page.getByText("Senior React Developer")).toBeVisible();
  await expect(page.getByText("Đã đề nghị", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xem tiến trình", exact: true }).click();
  const candidateDialog = page.getByRole("dialog");
  await expect(candidateDialog).toBeVisible();
  const candidateSteps = candidateDialog.getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(candidateSteps).toHaveCount(4);
  await expect(candidateSteps.nth(3)).toContainText("Đã đề nghị");
  await expect(candidateDialog.getByRole("link", { name: "Xem CV đã nộp" })).toHaveAttribute("href", "/resume/view/application/app-shared");
  await expect(candidateDialog.getByRole("link", { name: "Xem công việc" })).toHaveAttribute("href", "/jobs/job-1");
});

test("Hiển thị trung thực từ chối sớm không suy diễn bước và hồ sơ cũ mất tin tuyển dụng", async ({ page }) => {
  const apps = [
    {
      _id: "app-early-reject",
      jobId: { _id: "job-1", title: "QA Engineer", company: "AlphaCo", status: "Active" },
      jobSnapshot: { title: "QA Engineer", company: "AlphaCo" },
      status: "Rejected",
      statusHistory: [
        { status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" },
        { status: "Rejected", timestamp: "2026-10-01T15:30:00.000Z" },
      ],
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T15:30:00.000Z",
    },
    {
      _id: "app-legacy-deleted",
      jobId: null,
      jobSnapshot: { title: "Legacy Architect", company: "OldCorp" },
      status: "Interview",
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-12T10:45:00.000Z",
    },
  ];

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/me") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: candidate }) });
    }
    if (pathname === "/api/jobs/applications/mine") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(apps) });
    }
    if (pathname.endsWith("/unread-count")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 0 }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.goto("/my-applications");
  const timelineButtons = page.getByRole("button", { name: "Xem tiến trình", exact: true });
  await expect(timelineButtons).toHaveCount(2);

  // Early rejection: ONLY Chờ xử lý and Từ chối, never fabricated Phỏng vấn
  await timelineButtons.nth(0).click();
  const rejectDialog = page.getByRole("dialog");
  await expect(rejectDialog).toBeVisible();
  const rejectSteps = rejectDialog.getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(rejectSteps).toHaveCount(2);
  await expect(rejectSteps.nth(0)).toContainText("Chờ xử lý");
  await expect(rejectSteps.nth(1)).toContainText("Từ chối");
  await expect(rejectDialog).not.toContainText("Phỏng vấn");
  await expect(rejectDialog).not.toContainText("Đang xem xét");
  await page.keyboard.press("Escape");

  // Legacy deleted-job application: snapshot title, honest missing intermediate history, updatedAt NOT copied onto Interview step
  await expect(page.getByText("Legacy Architect")).toBeVisible();
  await expect(page.getByText("Tin đã bị xoá nhưng lịch sử ứng tuyển vẫn được giữ lại.")).toBeVisible();
  await expect(page.getByText("Chỉ xem lịch sử")).toBeVisible();
  await timelineButtons.nth(1).click();
  const legacyDialog = page.getByRole("dialog");
  await expect(legacyDialog).toBeVisible();
  await expect(legacyDialog).toContainText("Tin đã bị xoá · Giữ snapshot công việc");
  await expect(legacyDialog).toContainText("Hồ sơ cũ chưa có đầy đủ mốc thời gian");
  const legacySteps = legacyDialog.getByRole("list", { name: "Các mốc trạng thái hồ sơ" }).getByRole("listitem");
  await expect(legacySteps).toHaveCount(2);
  await expect(legacySteps.nth(0)).toContainText("Chờ xử lý");
  await expect(legacySteps.nth(1)).toContainText("Phỏng vấn");
  await expect(legacySteps.nth(1)).toContainText("Chưa có mốc thời gian");
  await expect(legacyDialog).not.toContainText("Đang xem xét");
});
