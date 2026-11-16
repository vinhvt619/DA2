import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { createProductionServer } from "../scripts/serve-production-server.mjs";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const qaFixturesDir = path.join(rootDir, "test/fixtures/cv-ocr");

function buildMinimalValidPdfBuffer(label = "RabbitCV Candidate") {
  const safeText = String(label).replace(/[()\\]/g, "");
  const streamContent = `BT /F1 18 Tf 72 720 Td (${safeText}) Tj ET\n`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "latin1")} >>\nstream\n${streamContent}endstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const JOB_1 = {
  _id: "job-1",
  title: "Frontend Engineer",
  company: "RabbitTech",
  location: "Hà Nội",
  salary: "25 - 35 triệu",
  type: "Full-time",
  status: "Active",
  expiryDate: "2099-12-31T00:00:00.000Z",
  createdAt: "2026-11-01T08:00:00.000Z",
  description: ["Xây dựng giao diện React."],
  requirements: ["Thành thạo React và TanStack Query."],
  benefits: ["Bảo hiểm đầy đủ."],
  tags: ["React", "Frontend"],
  applicants: 5,
  views: 120,
};

const JOB_2 = {
  _id: "job-2",
  title: "Backend NodeJS Engineer",
  company: "RabbitTech",
  location: "Hà Nội",
  salary: "30 - 45 triệu",
  type: "Full-time",
  status: "Active",
  expiryDate: "2099-12-31T00:00:00.000Z",
  createdAt: "2026-11-02T08:00:00.000Z",
  description: ["Phát triển REST API."],
  requirements: ["Thành thạo NodeJS."],
  benefits: ["Thưởng quý."],
  tags: ["React", "NodeJS"],
  applicants: 2,
  views: 80,
};

const CANDIDATE_1 = {
  _id: "candidate-1",
  username: "candidate1",
  fullName: "Nguyễn Văn Ứng Viên",
  email: "candidate1@example.test",
  role: "employee",
};

const CANDIDATE_2 = {
  _id: "candidate-2",
  username: "candidate2",
  fullName: "Trần Thị Ứng Viên Hai",
  email: "candidate2@example.test",
  role: "employee",
};

const RESUMES_1 = [
  {
    _id: "cv-1",
    title: "CV React Senior",
    selectedTemplate: "modern",
    updatedAt: "2026-11-10T10:00:00.000Z",
  },
  {
    _id: "cv-2",
    title: "CV Fullstack",
    selectedTemplate: "classic",
    updatedAt: "2026-11-08T10:00:00.000Z",
  },
];

async function installApplicationMocks(
  page,
  {
    initialUser = CANDIDATE_1,
    initialResumes = RESUMES_1,
    initialApplications = [],
    onApply = null,
    onApplyFile = null,
  } = {},
) {
  let currentUser = initialUser;
  let resumes = [...initialResumes];
  let applications = [...initialApplications];

  const counts = {
    resumesGet: 0,
    applicationsMineGet: 0,
    applyPost: 0,
    applyFilePost: 0,
  };
  const applyPayloads = [];
  const applyFilePayloads = [];

  let customResumesHandler = null;

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (pathname === "/api/me") {
      if (!currentUser) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Chưa đăng nhập" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: currentUser }),
      });
      return;
    }

    if (pathname === "/api/logout" && method === "POST") {
      currentUser = null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    if (pathname === "/api/login" && method === "POST") {
      const body = request.postDataJSON();
      if (body?.username === CANDIDATE_2.username) {
        currentUser = CANDIDATE_2;
        applications = [];
      } else {
        currentUser = CANDIDATE_1;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: currentUser }),
      });
      return;
    }

    if (pathname === "/api/jobs") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [JOB_1, JOB_2],
          meta: { page: 1, limit: 8, total: 2, totalPages: 1 },
        }),
      });
      return;
    }

    if (pathname === "/api/jobs/job-1") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(JOB_1),
      });
      return;
    }

    if (pathname === "/api/jobs/job-2") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(JOB_2),
      });
      return;
    }

    if (pathname === "/api/saved-jobs") {
      await route.fulfill({
        status: currentUser ? 200 : 401,
        contentType: "application/json",
        body: JSON.stringify(currentUser ? [] : { message: "Unauthorized" }),
      });
      return;
    }

    if (pathname === "/api/resumes") {
      counts.resumesGet += 1;
      if (customResumesHandler) {
        const customRes = await customResumesHandler(currentUser, counts.resumesGet);
        await route.fulfill({
          status: customRes.status ?? 200,
          contentType: "application/json",
          body: JSON.stringify(customRes.body),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(resumes),
      });
      return;
    }

    if (pathname === "/api/jobs/applications/mine") {
      counts.applicationsMineGet += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(applications),
      });
      return;
    }

    if (pathname === "/api/jobs/apply" && method === "POST") {
      counts.applyPost += 1;
      const body = request.postDataJSON();
      applyPayloads.push(body);
      if (onApply) {
        const result = await onApply(body, counts.applyPost, { applications });
        const returnedApp = result?.body?.application;
        const returnedId =
          typeof returnedApp?._id === "string" ? returnedApp._id.trim() : "";
        const returnedJobId =
          typeof returnedApp?.jobId === "string"
            ? returnedApp.jobId
            : typeof returnedApp?.jobId?._id === "string"
              ? returnedApp.jobId._id
              : "";
        if (
          result?.status >= 200 &&
          result?.status < 300 &&
          returnedId &&
          (!returnedJobId || returnedJobId === body.jobId)
        ) {
          applications = [
            {
              _id: returnedId,
              jobId: body.jobId === "job-2" ? JOB_2 : JOB_1,
              status: returnedApp.status || "Pending",
              coverLetter: body.coverLetter || "",
              createdAt: returnedApp.createdAt || "2026-11-12T08:00:00.000Z",
            },
            ...applications,
          ];
        }
        await route
          .fulfill({
            status: result.status,
            contentType: "application/json",
            body: JSON.stringify(result.body),
          })
          .catch(() => {});
        return;
      }

      const newAppId = `app-lib-${counts.applyPost}`;
      const createdAt = "2026-11-12T08:00:00.000Z";
      applications = [
        {
          _id: newAppId,
          jobId: JOB_1,
          resumeId: body.resumeId,
          status: "Pending",
          coverLetter: body.coverLetter || "",
          createdAt,
        },
        ...applications,
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Nộp hồ sơ thành công",
          application: { _id: newAppId, jobId: body.jobId, status: "Pending", createdAt },
        }),
      });
      return;
    }

    if (pathname === "/api/jobs/apply-file" && method === "POST") {
      counts.applyFilePost += 1;
      const body = request.postDataJSON();
      applyFilePayloads.push(body);
      if (onApplyFile) {
        const result = await onApplyFile(body, counts.applyFilePost);
        await route
          .fulfill({
            status: result.status,
            contentType: "application/json",
            body: JSON.stringify(result.body),
          })
          .catch(() => {});
        return;
      }

      const newAppId = `app-pdf-${counts.applyFilePost}`;
      const createdAt = "2026-11-12T08:30:00.000Z";
      applications = [
        {
          _id: newAppId,
          jobId: JOB_1,
          resumeType: "uploaded_file",
          fileName: body.fileName,
          status: "Pending",
          coverLetter: body.coverLetter || "",
          createdAt,
        },
        ...applications,
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Nộp hồ sơ thành công",
          application: { _id: newAppId, jobId: body.jobId, status: "Pending", createdAt },
        }),
      });
      return;
    }

    if (pathname.endsWith("/unread-count")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  return {
    counts: () => ({ ...counts }),
    applyPayloads: () => [...applyPayloads],
    applyFilePayloads: () => [...applyFilePayloads],
    setUser: (user) => {
      currentUser = user;
    },
    setResumes: (next) => {
      resumes = next;
    },
    setApplications: (next) => {
      applications = next;
    },
    setResumesHandler: (handler) => {
      customResumesHandler = handler;
    },
  };
}

test("Luồng ứng tuyển 3 bước với RabbitCV, chống gửi đúp và đồng bộ SPA", async ({ page }) => {
  const applyGate = createDeferred();
  const mocks = await installApplicationMocks(page, {
    onApply: async (body) => {
      await applyGate.promise;
      return {
        status: 201,
        body: {
          message: "Nộp hồ sơ thành công",
          application: {
            _id: "app-confirmed-1",
            jobId: body.jobId,
            status: "Pending",
            createdAt: "2026-11-12T09:00:00.000Z",
          },
        },
      };
    },
  });

  await page.goto("/jobs/job-1");
  const applySection = page.locator("#apply-section");

  await expect(applySection).toContainText("Bước 1/3");
  await expect(applySection).toContainText("CV React Senior");
  await expect(applySection).toContainText("Mẫu hiện đại hai cột");
  await expect(applySection.locator('a[href="/resume/view/cv-1"]')).toBeVisible();

  await applySection.getByLabel("Chọn CV đã lưu").selectOption("cv-2");
  await expect(applySection).toContainText("Mẫu cổ điển tinh gọn");
  await applySection.locator('a[href="/resume/view/cv-2"]').waitFor();

  const coverLetter = "Tôi có 4 năm kinh nghiệm React và mong muốn đóng góp cho RabbitTech.";
  await applySection.getByLabel("Thư ứng tuyển (tùy chọn)").fill(coverLetter);

  // Step 1 -> Step 2 (0 POSTs)
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await expect(applySection).toContainText("Bước 2/3");
  await expect(applySection).toContainText("CV Fullstack");
  await expect(applySection).toContainText(coverLetter);
  expect(mocks.counts().applyPost).toBe(0);

  // Back -> Step 1 keeps values intact
  await applySection.getByRole("button", { name: "Quay lại" }).click();
  await expect(applySection.getByLabel("Chọn CV đã lưu")).toHaveValue("cv-2");
  await expect(applySection.getByLabel("Thư ứng tuyển (tùy chọn)")).toHaveValue(coverLetter);

  // Step 1 -> Step 2 -> Step 3 (still 0 POSTs)
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await expect(applySection).toContainText("Bước 3/3");
  expect(mocks.counts().applyPost).toBe(0);

  // Double-click Confirm -> sends strictly 1 POST
  const confirmButton = applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" });
  await confirmButton.dblclick();
  await expect(applySection).toContainText("Đang gửi hồ sơ lên máy chủ");
  expect(mocks.counts().applyPost).toBe(1);

  applyGate.resolve();

  await expect(applySection).toContainText("Nộp hồ sơ thành công");
  const payloads = mocks.applyPayloads();
  expect(payloads).toEqual([
    {
      jobId: "job-1",
      resumeId: "cv-2",
      coverLetter,
    },
  ]);

  // SPA navigate to /my-applications without reload -> new application is synced immediately
  await applySection.getByRole("link", { name: "Xem hồ sơ đã nộp" }).click();
  await expect(page).toHaveURL(/\/my-applications$/);
  await expect(page.getByText("Frontend Engineer")).toBeVisible();

  // Navigate to UserDashboard via SPA links -> synced count & recent application appear
  await page.locator('a[href="/SettingAndPrivate"]').first().click();
  await expect(page).toHaveURL(/\/SettingAndPrivate$/);
  await page.getByRole("button", { name: "Tổng quan" }).click();
  await expect(page).toHaveURL(/\/UserDashboard$/);
  await expect(page.getByText("Frontend Engineer")).toBeVisible();
  await page.getByRole("link", { name: "Xem tất cả" }).click();
  await expect(page).toHaveURL(/\/my-applications$/);

  // Navigate back to job detail via SPA -> shows applied state; reload also retains applied state
  await page.getByRole("button", { name: "Xem công việc" }).first().click();
  await expect(page).toHaveURL(/\/jobs\/job-1$/);
  await expect(applySection).toContainText("Đã ứng tuyển vị trí này");
  await page.reload();
  await expect(page.locator("#apply-section")).toContainText("Đã ứng tuyển vị trí này");
});

async function expectCanvasHasRenderedContent(container) {
  const canvas = container.locator('canvas[data-pdf-rendered="true"]').first();
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const metrics = await canvas.evaluate((el) => {
    const ctx = el.getContext("2d");
    if (!ctx || el.width <= 0 || el.height <= 0) {
      return { width: el.width, height: el.height, hasInkPixels: false };
    }
    const sampleHeight = Math.min(el.height, 450);
    const sampleWidth = Math.min(el.width, 650);
    const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let nonWhite = 0;
    for (let i = 0; i < data.length; i += 16) {
      if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) {
        nonWhite += 1;
        if (nonWhite >= 10) break;
      }
    }
    return {
      width: el.width,
      height: el.height,
      hasInkPixels: nonWhite >= 10,
    };
  });
  expect(metrics.width).toBeGreaterThan(300);
  expect(metrics.height).toBeGreaterThan(300);
  expect(metrics.hasInkPixels).toBe(true);
}

test("Tải tệp PDF cục bộ trên mobile: chặn PDF hỏng có header đúng, race thay tệp, preview bytes và gửi 1 lần", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.__blobCreated = 0;
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (obj) => {
      window.__blobCreated += 1;
      return origCreate(obj);
    };
    window.__slowAStarted = false;
    window.__slowAGate = null;
    const origArrayBuffer = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function (...args) {
      if (this.name === "slow-a.pdf") {
        window.__slowAStarted = true;
        return new Promise((resolve) => {
          window.__slowAGate = () => resolve(origArrayBuffer.apply(this, args));
        });
      }
      return origArrayBuffer.apply(this, args);
    };
  });

  const mocks = await installApplicationMocks(page);
  await page.goto("/jobs/job-1");
  const applySection = page.locator("#apply-section");

  await applySection.getByRole("radio", { name: "Tải PDF từ máy" }).click();
  const fileInput = page.locator('input[type="file"]');

  // Invalid extension/type
  await fileInput.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello world"),
  });
  await expect(applySection.getByRole("alert")).toContainText("PDF");
  expect(mocks.counts().applyFilePost).toBe(0);

  // Oversized PDF (> 5 MB)
  const oversized = Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.alloc(5 * 1024 * 1024 + 64, 0x20),
  ]);
  await fileInput.setInputFiles({
    name: "too-big.pdf",
    mimeType: "application/pdf",
    buffer: oversized,
  });
  await expect(applySection.getByRole("alert")).toContainText("5 MB");
  expect(mocks.counts().applyFilePost).toBe(0);

  // Corrupted non-PDF bytes inside .pdf extension
  await fileInput.setInputFiles({
    name: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("NOT_A_REAL_PDF_DOCUMENT"),
  });
  await expect(applySection.getByRole("alert")).toContainText("PDF");

  // Broken PDF with valid %PDF-1.7 header but no object tree/pages -> blocked at Step 1, 0 POSTs
  await fileInput.setInputFiles({
    name: "broken.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nNo PDF object tree or pages\n"),
  });
  await expect(applySection.getByRole("alert")).toContainText(/hỏng|không có trang hợp lệ/i, {
    timeout: 20_000,
  });
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await expect(applySection).toContainText("Bước 1/3");
  expect(mocks.counts().applyFilePost).toBe(0);

  // Recover cleanly by selecting valid PDF #1
  await fileInput.setInputFiles({
    name: "cv-first.pdf",
    mimeType: "application/pdf",
    buffer: buildMinimalValidPdfBuffer("Resume V1"),
  });
  await expect(applySection).toContainText("cv-first.pdf", { timeout: 20_000 });
  await expectCanvasHasRenderedContent(applySection.getByTestId("uploaded-pdf-preview"));

  // Hide preview, then upload broken.pdf -> still blocked regardless of hidden preview!
  await applySection.getByRole("button", { name: "Ẩn bản xem trước PDF" }).click();
  await expect(applySection.getByTestId("uploaded-pdf-preview")).toHaveCount(0);
  await fileInput.setInputFiles({
    name: "broken-hidden-preview.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nNo PDF object tree or pages\n"),
  });
  await expect(applySection.getByRole("alert")).toContainText(/hỏng|không có trang hợp lệ/i, {
    timeout: 20_000,
  });
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await expect(applySection).toContainText("Bước 1/3");
  expect(mocks.counts().applyFilePost).toBe(0);

  // Replace slow-reading valid File A with invalid File B before A resolves -> A never overrides B's error
  await fileInput.setInputFiles({
    name: "slow-a.pdf",
    mimeType: "application/pdf",
    buffer: buildMinimalValidPdfBuffer("Slow Resume A"),
  });
  await page.waitForFunction(() => window.__slowAStarted === true);
  await fileInput.setInputFiles({
    name: "invalid-b.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from("not-a-pdf"),
  });
  await expect(applySection.getByRole("alert")).toContainText("PDF");
  await page.evaluate(() => window.__slowAGate?.());
  await page.waitForTimeout(200);
  await expect(applySection.getByRole("alert")).toContainText("PDF");
  await expect(applySection).not.toContainText("slow-a.pdf");
  expect(mocks.counts().applyFilePost).toBe(0);

  // Recover with valid PDF #2 and verify preview + bytes stay intact across steps
  const expectedSecondBytes = buildMinimalValidPdfBuffer("Resume V2");
  await fileInput.setInputFiles({
    name: "cv-second.pdf",
    mimeType: "application/pdf",
    buffer: expectedSecondBytes,
  });
  await expect(applySection).toContainText("cv-second.pdf", { timeout: 20_000 });
  await expectCanvasHasRenderedContent(applySection.getByTestId("uploaded-pdf-preview"));

  // Mobile layout has no horizontal overflow
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasOverflow).toBe(false);

  // Step 1 -> Step 2 -> Step 1 -> Step 2 keeps preview canvas working and bytes non-detached
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await expectCanvasHasRenderedContent(applySection.getByTestId("review-pdf-preview"));
  await applySection.getByRole("button", { name: "Quay lại" }).click();
  await expect(applySection).toContainText("cv-second.pdf");
  await expectCanvasHasRenderedContent(applySection.getByTestId("uploaded-pdf-preview"));

  // Confirm submit -> 1 POST /api/jobs/apply-file with intact PDF bytes, 0 Blob URLs created
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
  await expect(applySection).toContainText("Nộp hồ sơ thành công");

  expect(mocks.counts().applyFilePost).toBe(1);
  const filePayloads = mocks.applyFilePayloads();
  expect(filePayloads[0].fileName).toBe("cv-second.pdf");
  expect(filePayloads[0].fileData.startsWith("data:application/pdf;base64,JVBERi0")).toBe(true);
  const submittedBase64 = filePayloads[0].fileData.split(";base64,")[1];
  expect(Buffer.from(submittedBase64, "base64").equals(expectedSecondBytes)).toBe(true);
  expect(await page.evaluate(() => window.__blobCreated)).toBe(0);
});

test("Xem trước và nộp CV PDF thật dưới CSP production không vi phạm connect-src", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const prodServer = await createProductionServer({ port: 4189 });
  const runtimeErrors = [];
  const cspViolations = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      msg.type() === "error" &&
      /content security policy|connect-src|refused to/i.test(text) &&
      // Ignore pre-existing realtime SocketContext :5000/socket.io noise unrelated to PDF/blob CSP
      !/(?:https?|wss?):\/\/(?:127\.0\.0\.1|localhost):5000\/socket\.io\//i.test(text)
    ) {
      cspViolations.push(text);
    }
  });

  try {
    const mocks = await installApplicationMocks(page);
    const response = await page.goto(`${prodServer.baseURL}/jobs/job-1`);
    const cspHeader = response?.headers()?.["content-security-policy"] || "";
    expect(cspHeader).toContain("connect-src 'self'");

    const applySection = page.locator("#apply-section");
    await applySection.getByRole("radio", { name: "Tải PDF từ máy" }).click();
    const fileInput = page.locator('input[type="file"]');

    // Broken header-only PDF rejected cleanly under production build too
    await fileInput.setInputFiles({
      name: "broken-prod.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nNo PDF object tree or pages\n"),
    });
    await expect(applySection.getByRole("alert")).toContainText(/hỏng|không có trang hợp lệ/i, {
      timeout: 20_000,
    });
    expect(mocks.counts().applyFilePost).toBe(0);

    // Real CV PDF renders canvas under Step 1 & Step 2 without connect-src blob errors, then submits 1 POST
    const realPdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
    await fileInput.setInputFiles(realPdfPath);
    await expect(applySection).toContainText("text-cv-1page.pdf", { timeout: 20_000 });
    await expectCanvasHasRenderedContent(applySection.getByTestId("uploaded-pdf-preview"));

    // Toggle preview hide/show + switch steps to ensure worker transfer never detaches buffer
    await applySection.getByRole("button", { name: "Ẩn bản xem trước PDF" }).click();
    await applySection.getByRole("button", { name: "Xem trước PDF" }).click();
    await expectCanvasHasRenderedContent(applySection.getByTestId("uploaded-pdf-preview"));

    await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
    await expectCanvasHasRenderedContent(applySection.getByTestId("review-pdf-preview"));

    await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
    await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
    await expect(applySection).toContainText("Nộp hồ sơ thành công");

    expect(mocks.counts().applyFilePost).toBe(1);
    expect(mocks.applyFilePayloads()[0].fileName).toBe("text-cv-1page.pdf");
    expect(cspViolations).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  } finally {
    await prodServer.close();
  }
});

test("Chặn khách, company và admin gọi API ứng tuyển hoặc tải CV riêng tư", async ({ page }) => {
  // Guest sees login CTA and makes zero private fetches
  const guestMocks = await installApplicationMocks(page, { initialUser: null });
  await page.goto("/jobs/job-1");
  await expect(page.locator("#apply-section").getByRole("link", { name: "Đăng nhập để ứng tuyển" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(guestMocks.counts().resumesGet).toBe(0);
  expect(guestMocks.counts().applicationsMineGet).toBe(0);

  // Company account does not trigger /api/resumes or /api/jobs/applications/mine
  guestMocks.setUser({
    _id: "company-1",
    username: "comp",
    fullName: "Company User",
    role: "company",
  });
  await page.goto("/jobs/job-1");
  await expect(page).toHaveURL(/\/CompanyDashboard/);
  expect(guestMocks.counts().resumesGet).toBe(0);
  expect(guestMocks.counts().applicationsMineGet).toBe(0);

  // Admin account does not trigger /api/resumes or /api/jobs/applications/mine
  guestMocks.setUser({
    _id: "admin-1",
    username: "admin",
    fullName: "Admin User",
    role: "admin",
  });
  await page.goto("/jobs/job-1");
  await expect(page).toHaveURL(/\/admin/);
  expect(guestMocks.counts().resumesGet).toBe(0);
  expect(guestMocks.counts().applicationsMineGet).toBe(0);
});

test("Giữ nguyên dữ liệu khi gặp lỗi 500, receipt sai lệch, 409 khác biệt và xử lý ALREADY_APPLIED / 410 trung thực", async ({
  page,
}) => {
  let attempt = 0;
  const mocks = await installApplicationMocks(page, {
    onApply: async () => {
      attempt += 1;
      if (attempt === 1) {
        return {
          status: 500,
          body: { message: "Máy chủ bận tạm thời." },
        };
      }
      if (attempt === 2) {
        // Ambiguous 200 without confirmed application._id must not show success
        return {
          status: 200,
          body: { ok: true },
        };
      }
      if (attempt === 3) {
        // Non-string application._id must not confirm submission
        return {
          status: 201,
          body: { application: { _id: 12345, jobId: "job-1" } },
        };
      }
      if (attempt === 4) {
        // Mismatched jobId in receipt must not confirm submission
        return {
          status: 201,
          body: { application: { _id: "app-wrong-job", jobId: "job-other" } },
        };
      }
      if (attempt === 5) {
        // Unrelated HTTP 409 conflict must NOT be mapped to ALREADY_APPLIED
        return {
          status: 409,
          body: {
            code: "UNRELATED_CONFLICT",
            message: "Hồ sơ đang được cập nhật ở phiên khác, vui lòng thử lại.",
          },
        };
      }
      if (attempt === 6) {
        return {
          status: 409,
          body: {
            code: "ALREADY_APPLIED",
            message: "Bạn đã ứng tuyển công việc này trước đó.",
          },
        };
      }
      return {
        status: 410,
        body: { message: "Tin tuyển dụng đã hết hạn hoặc đã đóng." },
      };
    },
  });

  await page.goto("/jobs/job-1");
  const applySection = page.locator("#apply-section");
  const coverLetter = "Giữ nguyên nội dung thư khi gặp lỗi.";
  await applySection.getByLabel("Thư ứng tuyển (tùy chọn)").fill(coverLetter);

  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();

  // Attempt 1 -> 500 preserves data and does not auto-retry
  await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
  await expect(applySection.getByRole("alert")).toContainText("Máy chủ bận tạm thời.");
  expect(mocks.counts().applyPost).toBe(1);

  // Attempt 2 -> Ambiguous 200 is not marked as success
  await applySection.getByRole("button", { name: "Thử gửi lại" }).click();
  await expect(applySection.getByRole("alert")).toContainText("chưa thể xác nhận hồ sơ đã được lưu");

  // Attempt 3 -> Numeric _id is rejected as ambiguous
  await applySection.getByRole("button", { name: "Thử gửi lại" }).click();
  await expect(applySection.getByRole("alert")).toContainText("chưa thể xác nhận hồ sơ đã được lưu");

  // Attempt 4 -> Mismatched jobId in receipt is rejected as ambiguous
  await applySection.getByRole("button", { name: "Thử gửi lại" }).click();
  await expect(applySection.getByRole("alert")).toContainText("chưa thể xác nhận hồ sơ đã được lưu");

  // Attempt 5 -> Unrelated 409 preserves inputs & allows manual retry
  await applySection.getByRole("button", { name: "Thử gửi lại" }).click();
  await expect(applySection.getByRole("alert")).toContainText("cập nhật ở phiên khác");
  await expect(applySection).not.toContainText("Đã ứng tuyển vị trí này");
  await applySection.getByRole("button", { name: "Quay lại" }).click();
  await expect(applySection).toContainText(coverLetter);

  // Attempt 6 -> 409 ALREADY_APPLIED shows duplicate banner without assuming Pending status or date when record missing
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
  await expect(applySection).toContainText("Đã ứng tuyển vị trí này");
  await expect(applySection).not.toContainText("Chờ xử lý");
  await expect(applySection).not.toContainText("Thời điểm gửi");
  await expect(applySection.getByRole("link", { name: "Xem hồ sơ đã nộp" })).toBeVisible();

  // Navigate to job-2 and hit 410 on Attempt 7 -> closes form honestly
  await page.goto("/jobs/job-2");
  await page.locator("#apply-section").getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await page.locator("#apply-section").getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await page.locator("#apply-section").getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
  await expect(page.locator("#apply-section")).toContainText("hết hạn hoặc đã đóng");
});

test("Hủy tác vụ cũ khi chuyển tin, không mở khóa POST phiên mới, cô lập savedResumes và giữ snapshot tin đã xoá", async ({
  page,
}) => {
  const slowJob1Post = createDeferred();
  const slowJob2Post = createDeferred();
  const mocks = await installApplicationMocks(page, {
    initialApplications: [
      {
        _id: "app-snapshot-user1",
        jobId: null,
        jobSnapshot: {
          jobId: "deleted-job-99",
          title: "Kỹ sư hệ thống cũ",
          company: "Công ty Snapshot Alpha",
          location: "Đà Nẵng",
        },
        status: "Pending",
        createdAt: "2026-10-10T08:00:00.000Z",
      },
    ],
    onApply: async (body) => {
      if (body.jobId === "job-1") {
        await slowJob1Post.promise;
        return {
          status: 201,
          body: {
            application: {
              _id: "app-late-job1",
              jobId: "job-1",
              status: "Pending",
            },
          },
        };
      }
      await slowJob2Post.promise;
      return {
        status: 201,
        body: {
          application: {
            _id: "app-job2-confirmed",
            jobId: "job-2",
            status: "Pending",
          },
        },
      };
    },
  });

  // Deleted job snapshot renders properly on both UserDashboard and MyApplications
  await page.goto("/UserDashboard");
  await expect(page.getByText("Kỹ sư hệ thống cũ")).toBeVisible();
  await expect(page.getByText(/Công ty Snapshot Alpha/)).toBeVisible();

  await page.getByRole("link", { name: "Xem tất cả" }).click();
  await expect(page).toHaveURL(/\/my-applications$/);
  await expect(page.getByText("Kỹ sư hệ thống cũ")).toBeVisible();
  await expect(page.getByText("Công ty Snapshot Alpha")).toBeVisible();

  // Start slow POST on job-1 then click similar job-2 while POST #1 is still pending
  await page.goto("/jobs/job-1");
  const applySection = page.locator("#apply-section");
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();

  await page.getByRole("button", { name: /Backend NodeJS Engineer/ }).click();
  await expect(page).toHaveURL(/\/jobs\/job-2$/);
  await expect(applySection).toContainText("Bước 1/3");

  // Start POST #2 on job-2, then settle late job-1 POST -> must NOT unlock POST #2 while POST #2 is pending
  await applySection.getByRole("button", { name: "Tiếp tục kiểm tra" }).click();
  await applySection.getByRole("button", { name: "Tiếp tục xác nhận" }).click();
  await applySection.getByRole("button", { name: "Xác nhận gửi hồ sơ" }).click();
  await expect.poll(() => mocks.counts().applyPost).toBe(2);

  slowJob1Post.resolve();
  await page.waitForTimeout(100);
  // Attempt synthetic form submit while job-2 POST is still in flight -> still blocked
  await applySection.locator("form").evaluate((form) => form.requestSubmit());
  expect(mocks.counts().applyPost).toBe(2);

  slowJob2Post.resolve();
  await expect(applySection).toContainText("Nộp hồ sơ thành công");

  // Account switch in the same SPA session: logout candidate-1 -> login candidate-2 clears prior cache
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Tên đăng nhập").fill(CANDIDATE_2.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Secret123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/MainMenu$/);

  // Scoped savedResumes barrier: stale sessionStorage candidate-1 + slow /api/resumes for candidate-2
  const resumesGateB = createDeferred();
  mocks.setResumesHandler(async () => {
    await resumesGateB.promise;
    return {
      status: 200,
      body: [
        {
          _id: "cv-b-1",
          title: "CV Riêng Của Ứng Viên 2",
          selectedTemplate: "modern",
          updatedAt: "2026-11-11T10:00:00.000Z",
        },
      ],
    };
  });
  await page.evaluate((staleUser) => {
    sessionStorage.setItem("rabbitcv_current_user", JSON.stringify(staleUser));
  }, CANDIDATE_1);
  await page.goto("/jobs/job-1");
  await expect(page.locator("#apply-section")).not.toContainText("CV React Senior");
  resumesGateB.resolve();
  await expect(page.locator("#apply-section")).toContainText("CV Riêng Của Ứng Viên 2");

  // Verify candidate-1's deleted snapshot never leaks into candidate-2's dashboard/applications
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await page.getByRole("menuitem", { name: "Cài đặt" }).click();
  await expect(page).toHaveURL(/\/SettingAndPrivate$/);
  await page.getByRole("button", { name: "Tổng quan" }).click();
  await expect(page).toHaveURL(/\/UserDashboard$/);
  await expect(page.getByText("Kỹ sư hệ thống cũ")).toHaveCount(0);
  await expect(page.getByText("Bạn chưa ứng tuyển công việc nào.")).toBeVisible();

  await page.getByRole("link", { name: "Xem tất cả" }).click();
  await expect(page).toHaveURL(/\/my-applications$/);
  await expect(page.getByText("Kỹ sư hệ thống cũ")).toHaveCount(0);
  await expect(page.getByText("Chưa có hồ sơ trong mục này")).toBeVisible();
});
