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

test("trang chào mừng hiển thị lời giới thiệu và hành động chính", async ({
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

test("form đăng nhập hiển thị lỗi khi bỏ trống thông tin", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByText("Vui lòng nhập tên đăng nhập.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập mật khẩu.")).toBeVisible();
});

for (const scenario of [
  {
    name: "ứng viên",
    user: users.candidate,
    destination: /\/MainMenu$/,
    marker: /Khám phá các tính năng của RabbitCV/i,
  },
  {
    name: "doanh nghiệp",
    user: users.company,
    destination: /\/CompanyDashboard$/,
    marker: /Chào mừng trở lại, Doanh nghiệp E2E/i,
  },
  {
    name: "quản trị viên",
    user: users.admin,
    destination: /\/admin$/,
    marker: /Tổng người dùng/i,
  },
]) {
  test(`đăng nhập ${scenario.name} chuyển đến đúng cổng`, async ({ page }) => {
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

test("ứng viên không thể mở trực tiếp trang quản trị", async ({ page }) => {
  await installApiMocks(page, { currentUser: users.candidate });
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/MainMenu$/);
  await expect(
    page.getByRole("heading", { name: /Khám phá các tính năng của RabbitCV/i }),
  ).toBeVisible();
});
