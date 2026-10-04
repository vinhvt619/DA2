import { expect, test } from "@playwright/test";

const users = {
  candidate: {
    _id: "e2e-candidate",
    username: "candidate.e2e",
    fullName: "Ứng viên E2E",
    email: "candidate@example.test",
    role: "employee",
  },
  company: {
    _id: "e2e-company",
    username: "company.e2e",
    fullName: "Doanh nghiệp E2E",
    email: "company@example.test",
    role: "company",
  },
  admin: {
    _id: "e2e-admin",
    username: "admin.e2e",
    fullName: "Quản trị viên E2E",
    email: "admin@example.test",
    role: "admin",
  },
};

const userByUsername = new Map(
  Object.values(users).map((user) => [user.username, user]),
);

const respondJson = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

for (const contact of ["candidate@example.test", "0912345678"]) {
  test(`Đổi mật khẩu yêu cầu email/số điện thoại khớp tài khoản (${contact.includes("@") ? "email" : "phone"})`, async ({ page }, testInfo) => {
    await installApiMocks(page, { currentUser: users.candidate });
    const requests = [];
    await page.route("**/api/user/password", (route) => {
      const payload = route.request().postDataJSON();
      requests.push(payload);
      return payload.contact === contact
        ? respondJson(route, { message: "Đổi mật khẩu thành công." })
        : respondJson(route, { message: "Email hoặc số điện thoại không khớp với tài khoản của bạn." }, 400);
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/SettingAndPrivate");
    const form = page.getByRole("form", { name: "Thay đổi mật khẩu" });
    await form.getByLabel("Mật khẩu hiện tại", { exact: true }).click();
    await form.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("old-password");
    await form.getByLabel("Mật khẩu mới", { exact: true }).fill("new-password");
    await form.getByLabel("Nhập lại mật khẩu mới", { exact: true }).fill("new-password");
    await form.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    expect(requests).toHaveLength(0);
    const input = form.getByLabel("Email hoặc số điện thoại xác nhận");
    await input.fill("wrong@example.test");
    await form.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    await expect(page.getByText("Email hoặc số điện thoại không khớp với tài khoản của bạn.", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Mật khẩu mới", { exact: true })).toHaveValue("new-password");
    await input.fill(contact);
    await form.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    await expect(page.getByText("Đổi mật khẩu thành công.", { exact: true })).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(form.getByLabel("Mật khẩu hiện tại", { exact: true })).toHaveValue("");
    expect(requests[1]).toEqual({ contact, oldPassword: "old-password", newPassword: "new-password" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("password-change-mobile.png"), fullPage: true });
  });
}

async function installApiMocks(page, { currentUser = null } = {}) {
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname === "/api/me") {
      return currentUser
        ? respondJson(route, { user: currentUser })
        : respondJson(route, { message: "Vui lòng đăng nhập" }, 401);
    }

    if (pathname === "/api/login" && request.method() === "POST") {
      const payload = request.postDataJSON();
      const user = userByUsername.get(payload.username);
      if (!user || payload.password !== "password123") {
        return respondJson(
          route,
          { message: "Tài khoản hoặc mật khẩu không chính xác." },
          400,
        );
      }

      return respondJson(route, { message: "Đăng nhập thành công", user });
    }

    if (
      pathname === "/api/saved-jobs" ||
      pathname === "/api/jobs/my" ||
      pathname === "/api/jobs/applications"
    ) {
      return respondJson(route, []);
    }

    if (
      pathname === "/api/chat/unread-count" ||
      pathname === "/api/notifications/unread-count"
    ) {
      return respondJson(route, { count: 0 });
    }

    if (pathname === "/api/admin/stats") {
      return respondJson(route, {
        stats: {
          totalUsers: 3,
          totalCompanies: 1,
          totalEmployees: 1,
          totalJobs: 0,
          totalApplications: 0,
        },
        users: [],
      });
    }

    return respondJson(route, {});
  });
}

test("Hiển thị trang chủ chào mừng", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Chào mừng bạn đến với RabbitCV/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo CV ngay" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem việc làm" })).toBeVisible();
});

test("Kiểm tra form đăng nhập trống", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByText("Vui lòng nhập tên đăng nhập.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập mật khẩu.")).toBeVisible();
});

for (const scenario of [
  {
    name: "Ứng viên",
    user: users.candidate,
    destination: /\/MainMenu$/,
    marker: /Khám phá các tính năng của RabbitCV/i,
  },
  {
    name: "Doanh nghiệp",
    user: users.company,
    destination: /\/CompanyDashboard$/,
    marker: /Chào mừng trở lại, Doanh nghiệp E2E/i,
  },
  {
    name: "Quản trị viên",
    user: users.admin,
    destination: /\/admin$/,
    marker: /Tổng người dùng/i,
  },
]) {
  test(`Đăng nhập vai trò ${scenario.name}`, async ({ page }) => {
    await installApiMocks(page);
    await page.goto("/login");

    await page.getByLabel("Tên đăng nhập").fill(scenario.user.username);
    await page
      .getByRole("textbox", { name: "Mật khẩu", exact: true })
      .fill("password123");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page).toHaveURL(scenario.destination);
    await expect(page.getByText(scenario.marker).first()).toBeVisible();
  });
}

test("Chặn ứng viên vào trang quản trị", async ({ page }) => {
  await installApiMocks(page, { currentUser: users.candidate });
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/MainMenu$/);
  await expect(
    page.getByRole("heading", { name: /Khám phá các tính năng của RabbitCV/i }),
  ).toBeVisible();
});
