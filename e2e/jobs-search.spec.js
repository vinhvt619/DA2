import { expect, test } from "@playwright/test";
import { parseComparableVndSalary } from "../shared/jobQueryPolicy.js";

const testJobs = [
  {
    _id: "job-1",
    id: "job-1",
    title: "Senior React Developer",
    company: "FPT Software",
    location: "Hà Nội",
    type: "Full-time",
    salary: "30 - 50 triệu",
    tags: ["React", "TypeScript"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-03-01T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-2",
    id: "job-2",
    title: "Frontend Vue.js Engineer",
    company: "Viettel Solutions",
    location: "Hà Nội",
    type: "Full-time",
    salary: "25 - 35 triệu",
    tags: ["Vue", "JavaScript"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-28T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-3",
    id: "job-3",
    title: "Backend Node.js Developer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "35 - 45 triệu",
    tags: ["Node.js", "Express"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-27T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-4",
    id: "job-4",
    title: "UI/UX Product Designer",
    company: "MoMo Fintech",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "20 - 30 triệu",
    tags: ["Figma", "UI/UX"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-26T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-5",
    id: "job-5",
    title: "Digital Marketing Lead",
    company: "Shopee Vietnam",
    location: "Hà Nội",
    type: "Full-time",
    salary: "22 - 28 triệu",
    tags: ["SEO", "Marketing"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-25T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-6",
    id: "job-6",
    title: "Junior Java Programmer",
    company: "Enclave Da Nang",
    location: "Đà Nẵng",
    type: "Intern",
    salary: "8 - 12 triệu",
    tags: ["Java", "Spring"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-24T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-7",
    id: "job-7",
    title: "DevOps Cloud Engineer",
    company: "VinFast Tech",
    location: "Hải Phòng",
    type: "Remote",
    salary: "40 - 60 triệu",
    tags: ["AWS", "Docker"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-23T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-8",
    id: "job-8",
    title: "Content Creator Intern",
    company: "Tiki E-commerce",
    location: "TP. Hồ Chí Minh",
    type: "Intern",
    salary: "5 - 7 triệu",
    tags: ["Content", "Social"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-22T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-9",
    id: "job-9",
    title: "Senior Graphic Designer",
    company: "KMS Technology",
    location: "Đà Nẵng",
    type: "Full-time",
    salary: "18 - 25 triệu",
    tags: ["Photoshop", "Illustrator"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-21T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-10",
    id: "job-10",
    title: "Golang Backend Developer",
    company: "VNPay Solutions",
    location: "Hà Nội",
    type: "Full-time",
    salary: "30 - 40 triệu",
    tags: ["Go", "Microservices"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-20T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-11",
    id: "job-11",
    title: "Part-time SEO Specialist",
    company: "TopCV Vietnam",
    location: "Hà Nội",
    type: "Part-time",
    salary: "10 - 15 triệu",
    tags: ["SEO", "Google"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-19T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-12",
    id: "job-12",
    title: "QA Automation Tester",
    company: "NashTech Global",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "20 - 28 triệu",
    tags: ["Playwright", "Cypress"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-18T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-13",
    id: "job-13",
    title: "Brand Designer Specialist",
    company: "Lazada Vietnam",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "22 - 30 triệu",
    tags: ["Branding", "Design"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-17T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-14",
    id: "job-14",
    title: "Mobile Flutter Developer",
    company: "BAP Software",
    location: "Đà Nẵng",
    type: "Full-time",
    salary: "25 - 35 triệu",
    tags: ["Flutter", "Dart"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-16T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-15",
    id: "job-15",
    title: "Remote React Native Dev",
    company: "One Mount Group",
    location: "Hà Nội",
    type: "Remote",
    salary: "35 - 50 triệu",
    tags: ["React Native", "Mobile"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-15T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-16",
    id: "job-16",
    title: "Data Analyst Associate",
    company: "Sendo Technology",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "18 - 24 triệu",
    tags: ["SQL", "Python"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-14T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-17",
    id: "job-17",
    title: "Social Media Intern",
    company: "VCCorp Media",
    location: "Hà Nội",
    type: "Intern",
    salary: "4 - 6 triệu",
    tags: ["Marketing", "Social"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-13T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-18",
    id: "job-18",
    title: "Product Owner Banking",
    company: "Techcombank",
    location: "Hà Nội",
    type: "Full-time",
    salary: "45 - 60 triệu",
    tags: ["Agile", "Scrum"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-12T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-19",
    id: "job-19",
    title: "3D Motion Designer",
    company: "Gameloft Vietnam",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "28 - 38 triệu",
    tags: ["Blender", "After Effects"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-11T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
  {
    _id: "job-20",
    id: "job-20",
    title: "Fullstack Python Engineer",
    company: "Amanotes Gaming",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "30 - 42 triệu",
    tags: ["Python", "FastAPI"],
    status: "Active",
    approvalStatus: "Approved",
    isAdminHidden: false,
    deletedAt: null,
    createdAt: "2026-02-10T10:00:00Z",
    expiryDate: "2099-01-01T00:00:00Z",
  },
];

const respond = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  });

function setupMockApi(page, customState = {}) {
  const state = {
    jobs: [...testJobs],
    receivedRequests: [],
    fail: false,
    delayMs: 0,
    ...customState,
  };

  const routePromise = page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname === "/api/me") {
      return respond(route, {
        user: {
          _id: "candidate-1",
          role: "employee",
          username: "candidate1",
          fullName: "Nguyễn Văn A",
          email: "candidate1@example.test",
        },
      });
    }

    if (pathname === "/api/saved-jobs" || pathname === "/api/notifications") {
      return respond(route, []);
    }

    if (pathname.endsWith("/unread-count")) {
      return respond(route, { count: 0 });
    }

    if (pathname === "/api/resumes") {
      return respond(route, []);
    }

    if (pathname === "/api/jobs") {
      const searchParams = url.searchParams;
      state.receivedRequests.push({
        url: request.url(),
        params: Object.fromEntries(searchParams.entries()),
      });

      if (state.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, state.delayMs));
      }

      if (state.fail) {
        return respond(route, { message: "Internal Server Error" }, 500);
      }

      const keyword = (searchParams.get("keyword") || searchParams.get("q") || "").trim().toLowerCase();
      const location = (searchParams.get("location") || "").trim().toLowerCase();
      const category = (searchParams.get("category") || "").trim().toLowerCase();
      const workTypesRaw = searchParams.get("workTypes") || "";
      const workTypes = workTypesRaw
        ? workTypesRaw.split(",").map((wt) => wt.trim().toLowerCase()).filter(Boolean)
        : [];
      const sort = searchParams.get("sort") || "newest";
      const pageNum = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.max(1, parseInt(searchParams.get("limit") || "8", 10));

      let filtered = [...state.jobs];

      // Keyword filter
      if (keyword) {
        filtered = filtered.filter((j) => {
          const title = (j.title || "").toLowerCase();
          const company = (j.company || "").toLowerCase();
          const tags = (j.tags || []).map((t) => t.toLowerCase()).join(" ");
          return title.includes(keyword) || company.includes(keyword) || tags.includes(keyword);
        });
      }

      // Location filter
      if (location) {
        filtered = filtered.filter((j) => {
          const loc = (j.location || "").toLowerCase();
          if (location === "ho chi minh") return loc.includes("hồ chí minh") || loc.includes("hcm");
          if (location === "ha noi") return loc.includes("hà nội");
          if (location === "da nang") return loc.includes("đà nẵng");
          if (location === "hai phong") return loc.includes("hải phòng");
          return loc.includes(location);
        });
      }

      // Category filter
      if (category) {
        filtered = filtered.filter((j) => {
          const text = `${j.title} ${(j.tags || []).join(" ")}`.toLowerCase();
          if (category === "it") {
            return ["react", "vue", "node", "java", "devops", "go", "qa", "flutter", "python", "agile"].some((k) => text.includes(k));
          }
          if (category === "design") {
            return ["designer", "design", "figma", "photoshop", "ui/ux", "3d", "motion"].some((k) => text.includes(k));
          }
          if (category === "marketing") {
            return ["marketing", "content", "seo", "social"].some((k) => text.includes(k));
          }
          return true;
        });
      }

      // Work type filter
      if (workTypes.length > 0) {
        filtered = filtered.filter((j) => {
          const type = (j.type || "").toLowerCase();
          return workTypes.some((wt) => type.includes(wt) || wt.includes(type));
        });
      }

      // Sorting
      if (sort === "salary") {
        filtered.sort((a, b) => {
          const sa = parseComparableVndSalary(a.salary);
          const sb = parseComparableVndSalary(b.salary);
          if (sa.isComparable !== sb.isComparable) {
            return sb.isComparable ? 1 : -1;
          }
          if (sb.vndMax !== sa.vndMax) {
            return sb.vndMax - sa.vndMax;
          }
          const timeDiff = (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0);
          if (timeDiff !== 0) {
            return timeDiff;
          }
          return String(b._id || "").localeCompare(String(a._id || ""));
        });
      } else if (sort === "newest") {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (pageNum - 1) * limit;
      const paginatedData = filtered.slice(startIndex, startIndex + limit);

      return respond(route, {
        data: paginatedData,
        meta: {
          page: pageNum,
          limit,
          total,
          totalPages,
        },
      });
    }

    return respond(route, {});
  });

  return { state, routePromise };
}

test.describe("Public Jobs Search, Filter, Sort and Pagination E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/socket.io/**", (route) => route.abort());
  });

  test("TC-01 Server pagination across multiple pages and pagination controls", async ({ page }) => {
    const { state } = setupMockApi(page);

    await page.goto("/AllJobs");

    // Page 1 displays first 8 jobs
    const pageIndicator = page.locator("span").filter({ hasText: "Trang" }).filter({ hasText: "công việc" });
    await expect(pageIndicator).toContainText("Trang 1 / 3");
    await expect(page.getByText("Senior React Developer")).toBeVisible();
    await expect(page.getByText("Content Creator Intern")).toBeVisible();

    // Previous button is disabled on page 1
    const prevBtn = page.getByRole("button", { name: "Trang trước" });
    await expect(prevBtn).toBeDisabled();

    // Next button is enabled
    const nextBtn = page.getByRole("button", { name: "Trang sau" });
    await expect(nextBtn).toBeEnabled();

    // Click Page 2 button
    const page2Btn = page.getByRole("button", { name: "2", exact: true });
    await page2Btn.click();

    // URL updates to ?page=2
    await expect(page).toHaveURL(/page=2/);
    await expect(pageIndicator).toContainText("Trang 2 / 3");
    await expect(page.getByText("Senior Graphic Designer")).toBeVisible();
    await expect(page.getByText("Data Analyst Associate")).toBeVisible();

    // Previous button is now enabled
    await expect(prevBtn).toBeEnabled();

    // Advance to Page 3 via Next button
    await nextBtn.click();
    await expect(page).toHaveURL(/page=3/);
    await expect(pageIndicator).toContainText("Trang 3 / 3");
    await expect(page.getByText("Social Media Intern")).toBeVisible();
    await expect(page.getByText("Fullstack Python Engineer")).toBeVisible();

    // On final page, Next button is disabled
    await expect(nextBtn).toBeDisabled();

    // Verify server requests included proper page parameter
    const pageReqs = state.receivedRequests.filter((r) => r.url.includes("/api/jobs"));
    expect(pageReqs.some((r) => r.params.page === "2")).toBe(true);
    expect(pageReqs.some((r) => r.params.page === "3")).toBe(true);
  });

  test("TC-02 Combined filters and sorting synchronize to URL search params and query server", async ({ page }) => {
    const { state } = setupMockApi(page);

    await page.goto("/AllJobs");

    // Search keyword "React"
    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await searchInput.fill("React");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    await expect(page).toHaveURL(/keyword=React/);

    // Ensure filters panel is open
    const filterBtn = page.getByRole("button", { name: /Bộ lọc/ });
    if ((await filterBtn.getAttribute("aria-expanded")) !== "true") {
      await filterBtn.click();
    }

    // Select Location "ha noi"
    const locationSelect = page.getByRole("combobox", { name: "Địa điểm" });
    await expect(locationSelect).toBeVisible();
    await locationSelect.selectOption("ha noi");
    await expect(page).toHaveURL(/location=ha\+noi|location=ha%20noi/);

    // Select Category "it"
    const categorySelect = page.getByRole("combobox", { name: "Ngành nghề" });
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption("it");
    await expect(page).toHaveURL(/category=it/);

    // Sort by Salary
    const sortSelect = page.getByRole("combobox", { name: "Sắp xếp việc làm" });
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption("salary");
    await expect(page).toHaveURL(/sort=salary/);

    // Result should show Senior React Developer
    await expect(page.getByText("Senior React Developer")).toBeVisible();

    // Verify last API request contained all filter criteria
    const lastJobReq = state.receivedRequests[state.receivedRequests.length - 1];
    expect(lastJobReq.params.keyword).toBe("React");
    expect(lastJobReq.params.location).toBe("ha noi");
    expect(lastJobReq.params.category).toBe("it");
    expect(lastJobReq.params.sort).toBe("salary");
  });

  test("TC-03 Direct load from URL and page reload restore filter and page state", async ({ page }) => {
    setupMockApi(page);

    // Directly load URL with query params
    await page.goto("/AllJobs?keyword=Designer&location=ho+chi+minh&sort=salary&page=1");

    // Verify input fields are populated from URL
    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await expect(searchInput).toHaveValue("Designer");

    // Verify filtered result rendered
    await expect(page.getByText("UI/UX Product Designer")).toBeVisible();
    await expect(page.getByText("Brand Designer Specialist")).toBeVisible();

    // Reload page
    await page.reload();

    // State is preserved after reload
    await expect(searchInput).toHaveValue("Designer");
    await expect(page.getByText("UI/UX Product Designer")).toBeVisible();
    await expect(page).toHaveURL(/keyword=Designer/);
    await expect(page).toHaveURL(/location=ho\+chi\+minh|location=ho%20chi%20minh/);
  });

  test("TC-04 Browser Back and Forward navigation restores search and page state", async ({ page }) => {
    setupMockApi(page);

    await page.goto("/AllJobs");
    const pageIndicator = page.locator("span").filter({ hasText: "Trang" }).filter({ hasText: "công việc" });
    await expect(pageIndicator).toContainText("Trang 1 / 3");

    // Navigate to page 2
    await page.getByRole("button", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Senior Graphic Designer")).toBeVisible();

    // Click browser Back button
    await page.goBack();
    await expect(page).toHaveURL(/\/AllJobs($|\?)/);
    await expect(page.getByText("Senior React Developer")).toBeVisible();

    // Click browser Forward button
    await page.goForward();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Senior Graphic Designer")).toBeVisible();
  });

  test("TC-05 Jobs page search form navigates to AllJobs with preserved search params", async ({ page }) => {
    setupMockApi(page);

    await page.goto("/Jobs");

    // Fill search keyword in Jobs page
    const keywordInput = page.getByPlaceholder("Tên công việc hoặc công ty").first();
    await keywordInput.fill("Frontend");

    // Open filter on Jobs page
    await page.getByRole("button", { name: /Bộ lọc/ }).first().click();

    // Select location Hà Nội
    const locationSelect = page.locator("select").first();
    await locationSelect.selectOption("ha noi");

    // Submit search form
    await page.getByRole("button", { name: "Tìm kiếm" }).first().click();

    // Should navigate to /AllJobs with search params
    await expect(page).toHaveURL(/\/AllJobs\?/);
    await expect(page).toHaveURL(/keyword=Frontend/);
    await expect(page).toHaveURL(/location=ha\+noi|location=ha%20noi/);

    // On AllJobs, keyword input should reflect the submitted keyword
    const allJobsInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await expect(allJobsInput).toHaveValue("Frontend");
    await expect(page.getByText("Frontend Vue.js Engineer")).toBeVisible();
  });

  test("TC-06 Out-of-order response protection settles cleanly on latest query", async ({ page }) => {
    await page.route("**/api/jobs*", async (route) => {
      const url = new URL(route.request().url());
      const kw = url.searchParams.get("keyword") || "";

      if (kw === "SlowQuery") {
        // Slow response takes 400ms
        await new Promise((resolve) => setTimeout(resolve, 400));
        return respond(route, {
          data: [
            {
              _id: "slow-1",
              id: "slow-1",
              title: "Obsolete Slow Job",
              company: "Slow Corp",
              location: "Hà Nội",
              type: "Full-time",
              salary: "10 triệu",
              tags: [],
              status: "Active",
              approvalStatus: "Approved",
              createdAt: "2026-01-01T00:00:00Z",
            },
          ],
          meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
        });
      }

      if (kw === "FastQuery") {
        return respond(route, {
          data: [
            {
              _id: "fast-1",
              id: "fast-1",
              title: "Current Fast Job",
              company: "Fast Corp",
              location: "Hà Nội",
              type: "Full-time",
              salary: "50 triệu",
              tags: [],
              status: "Active",
              approvalStatus: "Approved",
              createdAt: "2026-01-02T00:00:00Z",
            },
          ],
          meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
        });
      }

      return respond(route, { data: testJobs.slice(0, 8), meta: { page: 1, limit: 8, total: 20, totalPages: 3 } });
    });

    await page.route("**/api/me", (route) =>
      respond(route, { user: { _id: "u1", role: "employee" } })
    );
    await page.route("**/api/saved-jobs", (route) => respond(route, []));
    await page.route("**/api/notifications*", (route) => respond(route, []));

    await page.goto("/AllJobs");

    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");

    // Trigger SlowQuery first
    await searchInput.fill("SlowQuery");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    // Immediately trigger FastQuery
    await searchInput.fill("FastQuery");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    // Fast query job must appear
    await expect(page.getByText("Current Fast Job")).toBeVisible();

    // Wait until slow query would have finished
    await page.waitForTimeout(500);

    // Fast query must remain visible, Slow query must never overwrite
    await expect(page.getByText("Current Fast Job")).toBeVisible();
    await expect(page.getByText("Obsolete Slow Job")).toHaveCount(0);
  });

  test("TC-07 Empty results state and error retry state recover cleanly", async ({ page }) => {
    const { state } = setupMockApi(page);

    await page.goto("/AllJobs");
    await expect(page.getByText("Senior React Developer")).toBeVisible();

    // Search for nonexistent job
    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await searchInput.fill("NonExistentJob12345");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    // Verify empty state display
    await expect(page.getByText("Chưa tìm thấy công việc phù hợp")).toBeVisible();
    await expect(page.getByText("Thử thay đổi từ khóa, địa điểm hoặc bộ lọc.")).toBeVisible();

    // Click "Xóa bộ lọc"
    await page.getByRole("button", { name: "Xóa bộ lọc" }).first().click();

    // Recovers all jobs
    await expect(page.getByText("Senior React Developer")).toBeVisible();
    await expect(page.getByPlaceholder("Tên công việc hoặc công ty")).toHaveValue("");

    // Simulate 500 API failure
    state.fail = true;

    // Trigger refetch by changing sort
    const sortSelect = page.locator("select").last();
    await sortSelect.selectOption("salary");

    // Error alert displayed
    await expect(page.getByRole("alert")).toContainText("Không thể tải danh sách việc làm.");

    // Fix error and click "Thử lại"
    state.fail = false;
    await page.getByRole("button", { name: "Thử lại" }).click();

    // Recovers to normal job listing
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Senior React Developer")).toBeVisible();
  });

  test("TC-08 Literal C++ keyword search preserves plus signs across URL encoding and reload", async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/me") {
        return respond(route, { user: { _id: "u1", role: "employee" } });
      }
      if (url.pathname === "/api/saved-jobs" || url.pathname === "/api/notifications") {
        return respond(route, []);
      }
      if (url.pathname === "/api/jobs") {
        const kw = (url.searchParams.get("keyword") || "").trim().toLowerCase();
        const jobs = [
          {
            _id: "cpp-1",
            id: "cpp-1",
            title: "C++ Systems Engineer",
            company: "Systems Corp",
            location: "Hà Nội",
            type: "Full-time",
            salary: "35 triệu",
            tags: ["C++"],
            status: "Active",
            approvalStatus: "Approved",
            createdAt: "2026-03-01T00:00:00Z",
          },
          {
            _id: "c-1",
            id: "c-1",
            title: "C Embedded Engineer",
            company: "Embedded Co",
            location: "Hà Nội",
            type: "Full-time",
            salary: "25 triệu",
            tags: ["C"],
            status: "Active",
            approvalStatus: "Approved",
            createdAt: "2026-02-28T00:00:00Z",
          },
        ];
        const filtered = kw
          ? jobs.filter(
              (job) =>
                job.title.toLowerCase().includes(kw) ||
                job.tags.some((t) => t.toLowerCase().includes(kw)),
            )
          : jobs;
        return respond(route, {
          data: filtered,
          meta: { page: 1, limit: 8, total: filtered.length, totalPages: 1 },
        });
      }
      return respond(route, {});
    });

    await page.goto("/AllJobs");
    await expect(page.getByText("C++ Systems Engineer")).toBeVisible();
    await expect(page.getByText("C Embedded Engineer")).toBeVisible();

    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await searchInput.fill("C++");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    await expect(page).toHaveURL(/keyword=C%2B%2B/);
    await expect(page.getByText("C++ Systems Engineer")).toBeVisible();
    await expect(page.getByText("C Embedded Engineer")).toHaveCount(0);

    await page.reload();
    await expect(searchInput).toHaveValue("C++");
    await expect(page).toHaveURL(/keyword=C%2B%2B/);
    await expect(page.getByText("C++ Systems Engineer")).toBeVisible();
    await expect(page.getByText("C Embedded Engineer")).toHaveCount(0);
  });

  test("TC-09 Filter transitions suppress stale cards and stale counts while API response is pending", async ({ page }) => {
    let releaseReactRequest;
    const reactDeferred = new Promise((resolve) => {
      releaseReactRequest = resolve;
    });

    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/me") {
        return respond(route, { user: { _id: "u1", role: "employee" } });
      }
      if (url.pathname === "/api/saved-jobs" || url.pathname === "/api/notifications") {
        return respond(route, []);
      }
      if (url.pathname === "/api/jobs") {
        const kw = url.searchParams.get("keyword") || "";
        if (kw === "React") {
          await reactDeferred;
          return respond(route, {
            data: [
              {
                _id: "react-1",
                id: "react-1",
                title: "Senior React Role",
                company: "React Studio",
                location: "Hà Nội",
                type: "Full-time",
                salary: "40 triệu",
                tags: ["React"],
                status: "Active",
                approvalStatus: "Approved",
                createdAt: "2026-03-02T00:00:00Z",
              },
            ],
            meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
          });
        }
        return respond(route, {
          data: [
            {
              _id: "old-1",
              id: "old-1",
              title: "Old Designer Role",
              company: "Design House",
              location: "Hà Nội",
              type: "Full-time",
              salary: "20 triệu",
              tags: ["Figma"],
              status: "Active",
              approvalStatus: "Approved",
              createdAt: "2026-03-01T00:00:00Z",
            },
          ],
          meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
        });
      }
      return respond(route, {});
    });

    await page.goto("/AllJobs");
    await expect(page.getByText("Old Designer Role")).toBeVisible();
    await expect(page.getByText("1 cơ hội việc làm khả dụng")).toBeVisible();

    const searchInput = page.getByPlaceholder("Tên công việc hoặc công ty");
    await searchInput.fill("React");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    await expect(page).toHaveURL(/keyword=React/);
    await expect(page.getByText("Đang tải danh sách việc làm...")).toBeVisible();
    await expect(page.getByText("Old Designer Role")).toHaveCount(0);
    await expect(page.getByText("1 cơ hội việc làm khả dụng")).toHaveCount(0);

    releaseReactRequest();
    await expect(page.getByText("Senior React Role")).toBeVisible();
    await expect(page.getByText("Old Designer Role")).toHaveCount(0);
  });

  test("TC-10 Pending pagination avoids clamping against cached totalPages=1 and out-of-range replaces history cleanly", async ({ page }) => {
    let failPage2 = true;
    let releaseDeferredPage2 = null;
    const deferredPage2 = new Promise((resolve) => {
      releaseDeferredPage2 = resolve;
    });
    let holdPage2 = false;

    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/me") {
        return respond(route, { user: { _id: "u1", role: "employee" } });
      }
      if (url.pathname === "/api/saved-jobs" || url.pathname === "/api/notifications") {
        return respond(route, []);
      }
      if (url.pathname === "/api/jobs") {
        const p = url.searchParams.get("page") || "1";
        if (p === "2") {
          if (failPage2) {
            return respond(route, { message: "Temporary error" }, 500);
          }
          if (holdPage2) {
            await deferredPage2;
          }
          return respond(route, {
            data: [
              {
                _id: "react-p2",
                id: "react-p2",
                title: "React Page 2 Job",
                company: "React Co",
                location: "Hà Nội",
                type: "Full-time",
                salary: "30 triệu",
                tags: ["React"],
                status: "Active",
                approvalStatus: "Approved",
                createdAt: "2026-03-01T00:00:00Z",
              },
            ],
            meta: { page: 2, limit: 8, total: 10, totalPages: 2 },
          });
        }
        if (p === "99") {
          return respond(route, {
            data: [],
            meta: { page: 99, limit: 8, total: 10, totalPages: 2 },
          });
        }
        return respond(route, {
          data: [
            {
              _id: "react-p1",
              id: "react-p1",
              title: "React Page 1 Job",
              company: "React Co",
              location: "Hà Nội",
              type: "Full-time",
              salary: "25 triệu",
              tags: ["React"],
              status: "Active",
              approvalStatus: "Approved",
              createdAt: "2026-03-02T00:00:00Z",
            },
          ],
          meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
        });
      }
      return respond(route, {});
    });

    // Part A: Failed page 2 leaves no error clamp; submitting search caches totalPages: 1 for page 1;
    // navigating back to page 2 while pending keeps page=2 intact instead of clamping against placeholder totalPages: 1.
    await page.goto("/AllJobs?keyword=React&page=2");
    await expect(page.getByRole("alert")).toContainText("Không thể tải danh sách việc làm.");
    await page.getByRole("button", { name: "Tìm kiếm" }).click();
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByText("React Page 1 Job")).toBeVisible();

    failPage2 = false;
    holdPage2 = true;
    await page.goBack();
    await expect(page).toHaveURL(/keyword=React&page=2/);
    await expect(page.getByText("Đang tải trang 2...")).toBeVisible();
    await page.waitForTimeout(150);
    await expect(page).toHaveURL(/keyword=React&page=2/);

    releaseDeferredPage2();
    holdPage2 = false;
    await expect(page.getByText("React Page 2 Job")).toBeVisible();
    await expect(page).toHaveURL(/page=2/);

    // Part B: Direct visit to out-of-range page 99 replaces history cleanly so goBack returns to /Jobs
    await page.goto("/Jobs");
    await expect(page.getByText("React Page 1 Job").first()).toBeVisible();
    await page.goto("/AllJobs?keyword=React&page=99");
    await expect(page).toHaveURL(/keyword=React&page=2/);
    await expect(page.getByText("React Page 2 Job")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/Jobs$/);
  });

  test("TC-11 Invalid shared URL renders honest recoverable alert without calling /api/jobs", async ({ page }) => {
    const { state } = setupMockApi(page);

    await page.goto("/AllJobs?location=unknown");

    await expect(page.getByRole("alert")).toContainText("Tham số tìm kiếm trong đường dẫn không hợp lệ");
    await expect(page.getByText("0 cơ hội việc làm khả dụng")).toHaveCount(0);
    await expect(page.getByText("Senior React Developer")).toHaveCount(0);
    expect(state.receivedRequests.filter((r) => r.url.includes("/api/jobs")).length).toBe(0);

    await page.getByRole("button", { name: "Đặt lại bộ lọc mặc định" }).click();
    await expect(page).toHaveURL(/\/AllJobs$/);
    await expect(page.getByText("Senior React Developer")).toBeVisible();
  });
});
