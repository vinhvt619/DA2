import { expect, test } from "@playwright/test";

const candidate = {
  _id: "e2e-resume-candidate",
  username: "resume.e2e",
  fullName: "Nguyễn Thành Vinh",
  email: "resume@example.test",
  role: "employee",
};

const repeatedDescription =
  "Tham gia phát triển sản phẩm, xử lý dữ liệu, viết kiểm thử và phối hợp cùng nhóm để hoàn thành các chức năng đúng tiến độ.";

const resume = {
  _id: "e2e-resume",
  title: "CV kiểm tra bố cục",
  selectedTemplate: "modern",
  image: "",
  personalInfo: {
    fullName: "Nguyễn Thành Vinh",
    jobTitle: "Thực tập sinh phát triển phần mềm",
    email: "resume@example.test",
    phone: "0123 456 789",
    location: "TP. Hồ Chí Minh",
    website: "",
  },
  bio: repeatedDescription.repeat(4),
  profile: [],
  experience: Array.from({ length: 5 }, (_, index) => ({
    title: `Kinh nghiệm ${index + 1}`,
    company: "RabbitCV",
    location: "TP. Hồ Chí Minh",
    startDate: "2023-01",
    endDate: "2023-12",
    description: repeatedDescription,
  })),
  education: [{
    title: "Cử nhân Công nghệ thông tin",
    company: "Trường Đại học Bách khoa",
    location: "TP. Hồ Chí Minh",
    startDate: "2020-09",
    endDate: "2026-11",
    description: repeatedDescription,
  }],
  skill: Array.from({ length: 6 }, (_, index) => ({
    title: `Kỹ năng ${index + 1}`,
    description: repeatedDescription,
    performance: "Tốt",
  })),
  language: [{ title: "Tiếng Việt", description: "Bản ngữ" }],
  certificate: [],
  project: [],
  award: [],
  hobby: [{ title: "Đọc sách" }],
};

async function installResumeMocks(page) {
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    const body = pathname === "/api/me"
      ? { user: candidate }
      : pathname === "/api/resume/e2e-resume"
        ? resume
        : pathname.endsWith("/unread-count")
          ? { count: 0 }
          : {};

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test("CV tự co vẫn giữ cột phải bên trong khổ A4", async ({ page }) => {
  await installResumeMocks(page);
  await page.goto("/resume/e2e-resume");

  const paper = page.locator(".cv-wrapper");
  const fitContent = paper.locator(".resume-fit-content");
  const sidebar = paper.locator(".resume-two-column-grid > .col-span-4");

  await expect(sidebar).toBeVisible();
  await expect.poll(async () => fitContent.evaluate((element) => element.style.transform))
    .toMatch(/^scale\((?:0\.|1)/);

  const [paperBox, sidebarBox] = await Promise.all([
    paper.boundingBox(),
    sidebar.boundingBox(),
  ]);

  expect(paperBox).not.toBeNull();
  expect(sidebarBox).not.toBeNull();
  expect(sidebarBox.x).toBeGreaterThan(paperBox.x);
  expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(
    paperBox.x + paperBox.width + 1,
  );
});
