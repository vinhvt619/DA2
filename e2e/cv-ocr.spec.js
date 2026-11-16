import { expect, test } from "@playwright/test";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { buildPdfFromPages } from "../test/fixtures/cv-ocr/buildPdf.mjs";
import { createProductionServer } from "../scripts/serve-production-server.mjs";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const qaFixturesDir = path.join(rootDir, "test/fixtures/cv-ocr");

const candidateUser = {
  _id: "candidate-ocr-1",
  username: "candidate_ocr",
  fullName: "Nguyễn Minh Anh",
  email: "minhanh.nguyen@rabbitcv.test",
  role: "employee",
};

async function setupCvOcrMockApp(page, { postResumeHandler = null } = {}) {
  let createdResume = null;
  let postCount = 0;

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname === "/api/me") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: candidateUser }),
      });
      return;
    }

    if (pathname === "/api/resumes") {
      const list = createdResume ? [createdResume] : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(list),
      });
      return;
    }

    if (pathname === "/api/resume" && request.method() === "POST") {
      postCount += 1;
      if (typeof postResumeHandler === "function") {
        const handled = await postResumeHandler(route, request, postCount);
        if (handled) return;
      }
      const payload = request.postDataJSON() || {};
      createdResume = {
        _id: "cv-ocr-created-1",
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ resume: createdResume }),
      });
      return;
    }

    if (pathname.startsWith("/api/resume/")) {
      const id = pathname.replace("/api/resume/", "");
      const res = createdResume && createdResume._id === id ? createdResume : { _id: id, ...createdResume };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(res),
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

    if (pathname === "/api/saved-jobs") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
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
    getCreatedResume: () => createdResume,
    getPostCount: () => postCount,
  };
}

test.describe("BL-07B Mô-đun OCR & Nhập CV từ PDF", () => {
  test.describe.configure({ mode: "serial" });

  test("Hiển thị nút 'Nhập CV từ PDF', mở hộp thoại và xác thực giới hạn tệp", async ({ page }) => {
    await setupCvOcrMockApp(page);
    await page.goto("/ResumeSelection");

    const importBtn = page.getByRole("button", { name: "Nhập CV từ PDF" });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Hộp thoại Radix Dialog
    await expect(page.getByRole("heading", { name: "Nhập CV từ tệp PDF (Trích xuất văn bản & OCR)" })).toBeVisible();
    await expect(
      page.getByText("Chỉ nhận tệp PDF (.pdf) • Dung lượng tối đa 5 MB • Tối đa 3 trang A4."),
    ).toBeVisible();

    // Thử tải lên tệp không phải PDF (ví dụ .docx hoặc file quá lớn)
    const fileInput = page.getByLabel("Chọn tệp PDF CV");
    await fileInput.setInputFiles({
      name: "invalid_document.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("dummy-docx-content"),
    });

    // Báo lỗi định dạng
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/Chỉ hỗ trợ tệp định dạng PDF/i)).toBeVisible();

    // Bấm nút Chọn tệp PDF khác để reset
    const chooseOtherBtn = page.getByRole("button", { name: "Chọn tệp PDF khác" });
    await expect(chooseOtherBtn).toBeVisible();
    await chooseOtherBtn.click();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("OCR ảnh quét giữ các mục CV độc lập và xuất PDF có thể tìm kiếm", async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 900, height: 1273 });
    await page.setContent(`
      <style>
        body { margin: 0; font: 23px/1.4 Arial, sans-serif; color: black; background: white; }
        main { width: 900px; height: 1273px; box-sizing: border-box; padding: 58px; }
        h1 { font-size: 35px; margin: 0; }
        h2 { font-size: 25px; margin: 24px 0 4px; }
        p { margin: 0; }
      </style>
      <main>
        <h1>Alex Morgan</h1>
        <p>Software Developer</p>
        <h2>SUMMARY</h2>
        <p>My goal is to build products that<br>help teams work together.</p>
        <p style="margin-top: 24px">Mentoring is also important to me.</p>
        <h2>PROJECTS</h2>
        <p><strong>Garden Planner</strong><br>Built a schedule for planting<br>and tracking garden tasks.</p>
        <p style="margin-top: 12px"><strong>Shop Portal</strong><br>Built a checkout flow.</p>
        <h2>COURSES</h2>
        <p>Web Development<br>Database Design</p>
        <h2>TECHNICAL SKILLS</h2>
        <p>Frontend: React; JavaScript<br>Backend: Express; MongoDB</p>
        <h2>PERSONAL INTERESTS</h2>
        <p>Reading; Running<br>2020 - 2026<br>Viet Nam</p>
      </main>
    `);
    const pngBuffer = await page.locator("main").screenshot();
    const pdfBuffer = buildPdfFromPages([{ type: "image", pngBuffer }]);
    let printHtml;
    await page.exposeFunction("captureImportedResumePrint", (html) => { printHtml = html; });
    await page.addInitScript(() => {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof HTMLIFrameElement && node.id === "printWindow") {
              node.addEventListener("load", () => {
                node.contentWindow.print = () =>
                  window.captureImportedResumePrint(node.contentDocument.documentElement.outerHTML);
              });
            }
          }
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    const mockState = await setupCvOcrMockApp(page);
    await page.goto("/ResumeSelection");
    await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();
    await page.getByLabel("Chọn tệp PDF CV").setInputFiles({
      name: "sectioned-scan.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    await expect(page.locator('[data-ocr-page-source="ocr"]')).toBeVisible({ timeout: 40_000 });
    await expect(page.getByLabel("Giới thiệu bản thân")).toHaveValue(
      "My goal is to build products that help teams work together.\nMentoring is also important to me.",
    );
    const groupedSkills = page.getByRole("heading", { name: "Kỹ năng theo nhóm" }).locator("..");
    await expect(groupedSkills.getByText("Frontend", { exact: true })).toBeVisible();
    await expect(groupedSkills.getByText("Backend", { exact: true })).toBeVisible();
    await expect(page.getByText(/Dự án \(2\).*Sở thích \(2\).*Mục tùy chỉnh \(2\)/)).toBeVisible();
    await page.getByRole("button", { name: "Xác nhận và Tạo CV" }).click();
    await expect.poll(() => mockState.getPostCount()).toBe(1);
    const saved = mockState.getCreatedResume();
    expect(saved.project.map(({ title, description }) => [title, description])).toEqual([
      ["Garden Planner", "<p>Built a schedule for planting and tracking garden tasks.</p>"],
      ["Shop Portal", "<p>Built a checkout flow.</p>"],
    ]);
    expect(saved.skill).toEqual([]);
    expect(saved.hobby.map(({ title }) => title)).toEqual(["Reading", "Running"]);
    expect(saved.customSections[0].title).toBe("Kỹ năng");
    expect(saved.customSections[0].items.map(({ title, description }) => [title, description])).toEqual([
      ["Frontend", "<p>React, JavaScript</p>"],
      ["Backend", "<p>Express, MongoDB</p>"],
    ]);
    expect(saved.customSections[1].title).toBe("Khóa học");
    expect(saved.customSections[1].items.map(({ title }) => title)).toEqual(["Web Development", "Database Design"]);
    await page.waitForURL(/\/resume\/cv-ocr-created-1/);
    await page.getByRole("button", { name: "Nội dung", exact: true }).click();
    await page.getByRole("button", { name: "Đưa Backend lên" }).click({ timeout: 10_000 });
    await page.getByRole("button", { name: "Nội dung", exact: true }).click();
    const skillsOnCv = page.locator('[data-custom-section="ocr-skill-groups"]').first();
    await expect(skillsOnCv.getByText("Frontend", { exact: true })).toBeVisible();
    await expect(skillsOnCv.getByText("React, JavaScript", { exact: true })).toBeVisible();
    await expect(skillsOnCv.getByRole("heading", { level: 4 })).toHaveText(["Backend", "Frontend"]);

    await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
    await expect.poll(() => Boolean(printHtml)).toBe(true);
    const printPage = await context.newPage();
    let pdfTask;
    try {
      await printPage.goto(new URL("/", page.url()).href);
      await printPage.setContent(printHtml);
      const bytes = await printPage.pdf({
        format: "A4",
        printBackground: true,
        path: testInfo.outputPath("ocr-import-searchable.pdf"),
      });
      pdfTask = getDocument({ data: new Uint8Array(bytes) });
      const pdf = await pdfTask.promise;
      expect(pdf.numPages).toBe(1);
      const content = await (await pdf.getPage(1)).getTextContent();
      const text = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ");
      expect(text).toContain("Alex Morgan");
      expect(text).toContain("Built a schedule for planting and tracking garden tasks.");
      expect(text).toContain("Express, MongoDB");
      expect(text).toContain("Database Design");
    } finally {
      await pdfTask?.destroy();
      await printPage.close();
    }
  });

  test("Nhập CV trực tiếp từ tệp PDF có text layer (Tier 1), đối chiếu văn bản, chỉnh sửa và tạo CV mới", async ({ page }) => {
    test.setTimeout(60_000);
    let mockDuplicateOnce = true;
    const testPdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");

    const mockState = await setupCvOcrMockApp(page, {
      postResumeHandler: async (route, request, _count) => {
        const payload = request.postDataJSON() || {};
        if (mockDuplicateOnce && payload.title === "CV - Nguyễn Minh Anh Trùng") {
          mockDuplicateOnce = false;
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ message: "Tên CV đã tồn tại trong tài khoản của bạn." }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/ResumeSelection");
    await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();

    const fileInput = page.getByLabel("Chọn tệp PDF CV");
    await fileInput.setInputFiles(testPdfPath);

    // Kiểm tra trạng thái preview và nguồn trích xuất
    const textBadge = page.locator('[data-ocr-page-source="text"]');
    await expect(textBadge).toBeVisible({ timeout: 30_000 });
    await expect(textBadge).toContainText("Trang 1: Văn bản gốc (PDF)");

    // Khung đối chiếu văn bản gốc trích xuất
    const rawTextArea = page.locator('textarea[data-ocr-raw-text="true"]');
    await expect(rawTextArea).toBeVisible();
    const rawVal = await rawTextArea.inputValue();
    expect(rawVal).toContain("Nguyễn Minh Anh");
    expect(rawVal).toContain("minhanh.nguyen@rabbitcv.test");

    // Các trường đã tự động phân mục
    const titleInput = page.getByLabel("Tên CV");
    const nameInput = page.getByLabel("Họ và tên");
    const emailInput = page.getByLabel("Email");
    const phoneInput = page.getByLabel("Số điện thoại");

    await expect(nameInput).toHaveValue("Nguyễn Minh Anh");
    await expect(emailInput).toHaveValue("minhanh.nguyen@rabbitcv.test");
    await expect(phoneInput).toHaveValue("0912345678");

    // Kịch bản lỗi 400 DUPLICATE_RESUME_TITLE: Đổi tên thành tên bị trùng
    await titleInput.fill("CV - Nguyễn Minh Anh Trùng");
    await emailInput.fill("minhanh.edited@rabbitcv.test");

    const confirmBtn = page.getByRole("button", { name: "Xác nhận và Tạo CV" });
    await confirmBtn.click();

    // Thông báo lỗi xuất hiện nhưng modal không đóng và giữ nguyên dữ liệu đã chỉnh sửa
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator("#ocr-confirm-form").getByText("Tên CV đã tồn tại trong tài khoản của bạn.")).toBeVisible();
    await expect(emailInput).toHaveValue("minhanh.edited@rabbitcv.test");

    // Sửa lại tên hợp lệ và xác nhận
    await titleInput.fill("CV - Kỹ Sư Trưởng Nguyễn Minh Anh");
    await confirmBtn.click();

    // Sau khi tạo thành công, điều hướng sang /resume/:id
    await page.waitForURL(/\/resume\/cv-ocr-created-1/, { timeout: 10_000 });
    expect(page.url()).toContain("/resume/cv-ocr-created-1");

    const created = mockState.getCreatedResume();
    expect(created).toBeTruthy();
    expect(created.title).toBe("CV - Kỹ Sư Trưởng Nguyễn Minh Anh");
    expect(created.personalInfo.fullName).toBe("Nguyễn Minh Anh");
    expect(created.personalInfo.email).toBe("minhanh.edited@rabbitcv.test");
    expect(created.pageCount).toBe(1);
    expect(created.pdfData).toBeUndefined();
    expect(created.fileName).toBeUndefined();
  });

  test("Nhập CV từ PDF quét ảnh hỗn hợp (Tier 2 OCR), kiểm tra huy hiệu nguồn theo trang", async ({ page }) => {
    test.setTimeout(90_000);
    const mixedPdfPath = path.join(qaFixturesDir, "mixed-cv-2pages.pdf");

    await setupCvOcrMockApp(page);
    await page.goto("/ResumeSelection");
    await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();

    const fileInput = page.getByLabel("Chọn tệp PDF CV");
    await fileInput.setInputFiles(mixedPdfPath);

    // Hỗn hợp 2 trang: Trang 1 text, Trang 2 ocr
    const textBadge = page.locator('span[data-ocr-page-source="text"]');
    const ocrBadge = page.locator('span[data-ocr-page-source="ocr"]');

    // Chờ xử lý hoàn tất (bao gồm OCR trang 2 bằng Tesseract WebAssembly)
    await expect(textBadge).toBeVisible({ timeout: 50_000 });
    await expect(ocrBadge).toBeVisible({ timeout: 50_000 });

    await expect(textBadge).toContainText("Trang 1: Văn bản gốc (PDF)");
    await expect(ocrBadge).toContainText("Trang 2: Nhận diện ảnh quét (OCR");

    // Khung đối chiếu văn bản gốc có nội dung ghép từ 2 trang
    const rawTextArea = page.locator('textarea[data-ocr-raw-text="true"]');
    const rawVal = await rawTextArea.inputValue();
    expect(rawVal).toContain("Nguyen Minh Anh");
    expect(rawVal).toContain("minhanh.nguyen@rabbitcv.test");
    expect(rawVal).toContain("AWS Certified Solutions Architect");

    // Xác nhận tạo CV 2 trang
    const confirmBtn = page.getByRole("button", { name: "Xác nhận và Tạo CV" });
    await confirmBtn.click();

    await page.waitForURL(/\/resume\/cv-ocr-created-1/, { timeout: 10_000 });
    expect(page.url()).toContain("/resume/cv-ocr-created-1");
  });

  test("BL-07B Production CSP regression: Real scan & mixed PDF OCR executes under built assets with vercel.json production CSP headers", async ({ page }) => {
    test.setTimeout(180_000);
    const prodServer = await createProductionServer({ port: 4188 });
    try {
      await setupCvOcrMockApp(page);
      await page.goto(`${prodServer.baseURL}/ResumeSelection`);

      // 1. Verify that document context enforces strict CSP: script-src 'self' without wasm-unsafe-eval
      const docWasmBlocked = await page.evaluate(async () => {
        try {
          const bytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
          await WebAssembly.compile(bytes);
          return false;
        } catch (err) {
          return Boolean(
            err && (err.name === "CompileError" || /violates|unsafe-eval|script-src/i.test(err.message)),
          );
        }
      });
      expect(docWasmBlocked).toBe(true);

      // 2. Click "Nhập CV từ PDF"
      await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();

      // 3. Upload pure scanned PDF (scan-cv-1page.pdf) that requires Tesseract OCR
      const scanPdfPath = path.join(qaFixturesDir, "scan-cv-1page.pdf");
      const fileInput = page.getByLabel("Chọn tệp PDF CV");
      await fileInput.setInputFiles(scanPdfPath);

      // Verify that OCR badge appears
      const ocrBadge = page.locator('span[data-ocr-page-source="ocr"]');
      await expect(ocrBadge).toBeVisible({ timeout: 90_000 });
      await expect(ocrBadge).toContainText("Trang 1: Nhận diện ảnh quét (OCR");

      const rawTextArea = page.locator('textarea[data-ocr-raw-text="true"]');
      await expect(rawTextArea).toBeVisible();
      const rawText = await rawTextArea.inputValue();
      expect(rawText.length).toBeGreaterThan(50);
      expect(rawText).toMatch(/Nguyen Minh Anh|Developer|Rabbit/i);

      // 4. Test mixed 2-page PDF under production CSP
      const chooseOtherBtn = page.getByRole("button", { name: "Chọn tệp PDF khác" });
      await chooseOtherBtn.click();

      const mixedPdfPath = path.join(qaFixturesDir, "mixed-cv-2pages.pdf");
      await fileInput.setInputFiles(mixedPdfPath);

      const textBadge = page.locator('span[data-ocr-page-source="text"]');
      await expect(textBadge).toBeVisible({ timeout: 90_000 });
      await expect(ocrBadge).toBeVisible({ timeout: 90_000 });
      await expect(textBadge).toContainText("Trang 1: Văn bản gốc (PDF)");
      await expect(ocrBadge).toContainText("Trang 2: Nhận diện ảnh quét (OCR");
    } finally {
      await prodServer.close();
    }
  });

  test("Chặn file quá 5MB trước khi gọi arrayBuffer và xử lý race condition đổi file chồng lấn (validA -> invalidB và slowValidA -> validB)", async ({ page }) => {
    await setupCvOcrMockApp(page);
    await page.goto("/ResumeSelection");

    // Cài đặt barrier và spy trên File.prototype.arrayBuffer
    await page.evaluate(() => {
      window.__arrayBufferCalls = [];
      window.__slowAGate = null;
      window.__slowAStarted = false;
      const orig = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = function (...args) {
        window.__arrayBufferCalls.push({ name: this.name, size: this.size });
        if (this.name === "slow-a.pdf") {
          window.__slowAStarted = true;
          return new Promise((resolve) => {
            window.__slowAGate = () => resolve(orig.apply(this, args));
          });
        }
        return orig.apply(this, args);
      };
    });

    await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();
    const fileInput = page.getByLabel("Chọn tệp PDF CV");

    // 1. Chặn file > 5MB trước khi gọi arrayBuffer
    await fileInput.setInputFiles({
      name: "huge-cv.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(5_242_881), // 5MB + 1 byte
    });

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/Dung lượng tệp vượt quá giới hạn 5 MB/i)).toBeVisible();

    // Xác nhận arrayBuffer không hề được gọi cho huge-cv.pdf
    const calls = await page.evaluate(() => window.__arrayBufferCalls);
    expect(calls.filter((c) => c.name === "huge-cv.pdf").length).toBe(0);

    // 2. Chồng lấn validA (chậm) -> invalidB (file sai định dạng .docx)
    const validPdfBytes = await fsp.readFile(path.join(qaFixturesDir, "text-cv-1page.pdf"));

    // Chọn slow-a.pdf
    await fileInput.setInputFiles({
      name: "slow-a.pdf",
      mimeType: "application/pdf",
      buffer: validPdfBytes,
    });

    // Chờ slow-a.pdf bắt đầu đi vào arrayBuffer
    await page.waitForFunction(() => window.__slowAStarted === true);

    // Trong lúc slow-a.pdf đang bị giữ tại barrier arrayBuffer, chọn file invalid-b.docx
    await fileInput.setInputFiles({
      name: "invalid-b.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("dummy docx content"),
    });

    // Thông báo lỗi của invalid-b xuất hiện
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/Chỉ nhận tệp PDF \(\.pdf\)/i)).toBeVisible();

    // Mở khóa barrier cho slow-a.pdf hoàn tất đọc buffer
    await page.evaluate(() => {
      window.__slowAGate?.();
    });

    // Đợi 500ms để đảm bảo luồng giải phóng slow-a.pdf không ghi đè lỗi của invalid-b
    await page.waitForTimeout(500);

    // Thông báo lỗi của invalid-b vẫn hiển thị, không bị bản xem trước của slow-a ghi đè
    await expect(page.getByText(/Chỉ nhận tệp PDF \(\.pdf\)/i)).toBeVisible();
    await expect(page.locator('[data-ocr-page-source="text"]')).not.toBeVisible();

    // 3. Chồng lấn slowValidA -> validB
    await page.evaluate(() => {
      window.__slowAStarted = false;
      window.__slowAGate = null;
    });

    // Chọn lại slow-a.pdf
    await fileInput.setInputFiles({
      name: "slow-a.pdf",
      mimeType: "application/pdf",
      buffer: validPdfBytes,
    });
    await page.waitForFunction(() => window.__slowAStarted === true);

    // Trong khi slow-a.pdf đang treo ở arrayBuffer, chọn fast-b.pdf
    await fileInput.setInputFiles({
      name: "fast-b.pdf",
      mimeType: "application/pdf",
      buffer: validPdfBytes,
    });

    // fast-b đọc xong và hiển thị preview bình thường
    const textBadge = page.locator('[data-ocr-page-source="text"]');
    await expect(textBadge).toBeVisible({ timeout: 30_000 });
    await expect(textBadge).toContainText("Trang 1: Văn bản gốc (PDF)");

    // Giải phóng barrier cho slow-a.pdf hoàn tất
    await page.evaluate(() => {
      window.__slowAGate?.();
    });
    await page.waitForTimeout(500);

    // Giao diện vẫn ổn định ở fast-b mà không bị lỗi hay gián đoạn
    await expect(textBadge).toBeVisible();
  });

  test("Đóng dialog hoặc SPA chuyển trang khi đang lưu CV không gây lỗi hoặc điều hướng sai trạng thái", async ({ page }) => {
    let markSaveStarted;
    let releaseSave;
    let markSaveFinished;
    const saveStartedPromise = new Promise((resolve) => {
      markSaveStarted = resolve;
    });
    const saveGatePromise = new Promise((resolve) => {
      releaseSave = resolve;
    });
    const saveFinishedPromise = new Promise((resolve) => {
      markSaveFinished = resolve;
    });

    await setupCvOcrMockApp(page, {
      postResumeHandler: async (route, _request, _count) => {
        markSaveStarted();
        try {
          await saveGatePromise;
          await route
            .fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                resume: { _id: "cv-late-1", title: "CV Trễ" },
              }),
            })
            .catch(() => {});
        } finally {
          markSaveFinished();
        }
        return true;
      },
    });

    await page.goto("/TopPage");
    await page.getByRole("link", { name: "Tạo CV" }).click();
    await page.waitForURL(/\/ResumeSelection/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Nhập CV từ PDF" }).click();

    const testPdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
    await page.getByLabel("Chọn tệp PDF CV").setInputFiles(testPdfPath);

    await expect(page.locator('[data-ocr-page-source="text"]')).toBeVisible({ timeout: 30_000 });

    // Bấm lưu CV và giữ POST /api/resume đang xử lý bằng barrier
    const confirmBtn = page.getByRole("button", { name: "Xác nhận và Tạo CV" });
    await confirmBtn.click();
    await saveStartedPromise;

    // Thực hiện chuyển trang SPA thật qua history Back của trình duyệt khi dialog đang unmount
    await page.goBack();
    await page.waitForURL(/\/TopPage/, { timeout: 10_000 });
    expect(page.url()).toContain("/TopPage");

    // Giải phóng phản hồi POST trễ sau khi trang đích đã ổn định
    releaseSave();
    await saveFinishedPromise;
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        )
    );

    // Không được điều hướng sang /resume/cv-late-1 và không bật toast trễ
    expect(page.url()).toContain("/TopPage");
    expect(page.url()).not.toContain("/resume/cv-late-1");
    await expect(page.getByText("Tạo CV từ PDF thành công!")).toHaveCount(0);
  });
});
