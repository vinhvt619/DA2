import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { RESUME_TEMPLATE_KEYS, RESUME_TEMPLATES } from "../shared/resumeTemplates.js";

const execFileAsync = promisify(execFile);

const user = { _id: "candidate", username: "candidate", fullName: "Nguyễn Minh Anh", email: "candidate@example.test", role: "employee" };
const initialResume = {
  _id: "editing-cv", title: "CV kiểm thử", selectedTemplate: "elegant", image: "",
  personalInfo: { fullName: user.fullName, jobTitle: "Frontend Developer", email: user.email },
  bio: "<p>Phát triển ứng dụng React.</p>",
  experience: [{ id: "exp", title: "Developer", company: "RabbitCV", description: "<p>Phát triển giao diện.</p>" }],
  education: [{ id: "edu", title: "Cử nhân", company: "Đại học" }],
  skill: [{ id: "skill", title: "React", description: "Hooks", performance: "Tốt" }],
  profile: [], project: [], certificate: [], award: [], language: [], hobby: [], customSections: [],
};

const pageDescription = "Phát triển giao diện React, phối hợp cùng nhóm thiết kế và backend để hoàn thiện trải nghiệm người dùng. ";
const twoPageResume = {
  ...initialResume,
  pageCount: 2,
  experience: Array.from({ length: 6 }, (_, index) => ({
    id: `exp-${index}`, title: `Developer ${index}`, company: "RabbitCV",
    description: `<p>START-${index} ${pageDescription.repeat(5)} END-${index}</p>`,
  })),
  project: [{ id: "project", title: "Dự án RabbitCV", description: `<p>${pageDescription.repeat(3)}</p>` }],
  customSections: [{ id: "last", title: "Hoạt động cộng đồng", items: [{ id: "item", title: "Điều phối viên", description: "<p>FINAL-MARKER</p>" }] }],
};

async function mockEditor(page, currentUser = user, initial = initialResume) {
  let saved = structuredClone(initial);
  let lastPayload;
  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    let body = {};
    if (pathname === "/api/me") body = { user: currentUser };
    else if (pathname === "/api/resume" && request.method() === "POST") {
      lastPayload = request.postDataJSON();
      saved = { ...lastPayload, _id: "editing-cv" };
      body = { resume: saved };
    } else if (pathname === "/api/resume/editing-cv" || pathname === "/api/resumes/view/editing-cv") body = saved;
    else if (pathname === "/api/ai/resume/fill") body = { result: { bio: "AI summary", skills: [{ title: "React", description: "Hooks", performance: "Tốt" }], experiences: [], education: [] } };
    else if (pathname.endsWith("/unread-count")) body = { count: 0 };
    else if (pathname === "/api/resumes" || pathname === "/api/saved-jobs") body = [];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return { getPayload: () => lastPayload, getSaved: () => saved };
}

test("Danh sách mẫu CV không hiển thị liên kết nguồn và giấy phép", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockEditor(page);
  await page.goto("/resume/editing-cv");
  const template = page.getByRole("button", { name: "Chọn mẫu Công nghệ hiện đại", exact: true });
  await expect(template).toBeVisible();
  await expect(page.getByRole("link", { name: /Tham khảo mẫu/ })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Debarghya Das");
  await expect(page.locator("body")).not.toContainText("Apache-2.0");
  await template.screenshot({ path: testInfo.outputPath("template-without-source.png") });
  await page.goto("/ResumeSelection");
  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "Công nghệ hiện đại", exact: true }) });
  await expect(card).toBeVisible();
  await expect(page.getByRole("link", { name: /Tham khảo mẫu/ })).toHaveCount(0);
  await expect(card).not.toContainText("Debarghya Das");
  await expect(card).not.toContainText("Apache-2.0");
  await expect(card.getByRole("button", { name: "Dùng mẫu", exact: true })).toBeVisible();
  await card.screenshot({ path: testInfo.outputPath("library-template-without-source.png") });
});

test("Tên và mô tả mẫu CV đồng bộ, đổi tên không đổi mã mẫu đã lưu", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  for (const template of RESUME_TEMPLATES) {
    const choice = page.getByRole("button", { name: `Chọn mẫu ${template.name}`, exact: true });
    await expect(choice).toBeVisible();
    await expect(choice).toContainText(template.description);
  }
  await page.getByRole("button", { name: "Chọn mẫu Công nghệ hiện đại", exact: true }).click();
  await expect(page.locator('.cv-wrapper [data-resume-template="technology"]')).toBeVisible();
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().selectedTemplate).toBe("technology");
  await page.reload();
  await expect(page.getByRole("button", { name: "Chọn mẫu Công nghệ hiện đại", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/ResumeSelection");
  for (const template of RESUME_TEMPLATES) {
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: template.name, exact: true }) });
    await expect(card).toBeVisible();
    await expect(card).toContainText(template.description);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("article").filter({ has: page.getByRole("heading", { name: "Chuyên nghiệp tương phản", exact: true }) }).screenshot({ path: testInfo.outputPath("renamed-template-mobile.png") });
  await page.goto("/TopPage");
  await expect(page.getByRole("heading", { name: "Chuyên nghiệp tương phản", exact: true })).toBeVisible();
  await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "Chuyên nghiệp tương phản", exact: true }) }).screenshot({ path: testInfo.outputPath("renamed-top-template-mobile.png") });
});

test("Đổi số trang A4, hoàn tác/làm lại và lưu/mở lại", async ({ page }, testInfo) => {
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  const onePage = page.getByRole("radio", { name: "1 trang", exact: true });
  const twoPages = page.getByRole("radio", { name: "2 trang", exact: true });
  await expect(onePage).toBeChecked();
  await twoPages.check();
  await expect(page.locator(".cv-resume-page")).toHaveCount(2);
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(onePage).toBeChecked();
  await expect(page.locator(".cv-resume-page")).toHaveCount(0);
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(twoPages).toBeChecked();
  const editor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
  await editor.fill("Tiểu sử mới trên CV hai trang.");
  await expect(page.locator('.cv-resume-page[data-cv-page="1"]')).toContainText("Tiểu sử mới trên CV hai trang.");
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().pageCount).toBe(2);
  await page.reload();
  await expect(twoPages).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(onePage).toBeVisible();
  await expect(twoPages).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cv-pages-mobile.png"), fullPage: true });
  await page.goto("/resume/view/editing-cv");
  await expect(page.locator(".cv-resume-page")).toHaveCount(2);
});

for (const template of RESUME_TEMPLATE_KEYS) {
  test(`Xuất đúng 2 trang A4 với đủ nội dung: ${template}`, async ({ page }, testInfo) => {
    await mockEditor(page, user, { ...twoPageResume, selectedTemplate: template });
    await page.goto("/resume/view/editing-cv");
    const pagination = page.locator(".cv-resume-pages");
    await expect(pagination).toHaveAttribute("data-pagination-ready", "true");
    await expect(pagination).toHaveAttribute("data-resume-overflow", "false");
    const continuation = page.locator('.cv-resume-page[data-cv-page="2"]');
    await expect(continuation.locator("header, [data-resume-static]")).toHaveCount(0);
    await expect(continuation).not.toContainText(user.fullName);
    expect(await continuation.evaluate((paper) => {
      const rect = paper.getBoundingClientRect();
      const scale = rect.width / paper.clientWidth;
      return [...paper.querySelectorAll(".cv-paged-window")].every((zone) => (zone.getBoundingClientRect().top - rect.top) / scale <= 48);
    })).toBe(true);
    await continuation.screenshot({ path: testInfo.outputPath(`${template}-continuation.png`) });
    const bytes = await page.pdf({ format: "A4", printBackground: true, path: testInfo.outputPath(`${template}-two-pages.pdf`) });
    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    expect(pdf.numPages).toBe(2);
    let text = "";
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const pdfPage = await pdf.getPage(number);
      // Chromium rounds millimetres to device pixels before PDF points.
      const viewport = pdfPage.getViewport({ scale: 1 });
      expect(Math.abs(viewport.width - 595.28)).toBeLessThan(1);
      expect(Math.abs(viewport.height - 841.89)).toBeLessThan(1);
      const pageText = (await pdfPage.getTextContent()).items.map((item) => item.str).join(" ");
      const compactText = pageText.replace(/\s+/g, "").toUpperCase();
      const compactName = user.fullName.replace(/\s+/g, "").toUpperCase();
      if (number === 1) expect(compactText).toContain(compactName);
      else {
        expect(compactText).not.toContain(compactName);
        expect(compactText).not.toContain(user.email.toUpperCase());
        expect(compactText).not.toContain("FRONTENDDEVELOPER");
      }
      text += pageText;
    }
    for (const marker of ["FINAL-MARKER", ...Array.from({ length: 6 }, (_, index) => [`START-${index}`, `END-${index}`]).flat()]) {
      expect(text.split(marker), marker).toHaveLength(2);
    }
    await task.destroy();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(pagination).toHaveAttribute("data-resume-overflow", "false");
    await page.locator('.cv-resume-page[data-cv-page="1"]').screenshot({ path: testInfo.outputPath(`${template}-two-pages-mobile.png`) });
  });
}

test("Cảnh báo và không in CV vượt quá 2 trang A4", async ({ page }) => {
  await mockEditor(page, user, {
    ...twoPageResume, selectedTemplate: "executive",
    experience: Array.from({ length: 35 }, (_, index) => ({ ...twoPageResume.experience[0], id: `long-${index}` })),
  });
  await page.goto("/resume/editing-cv");
  await expect(page.locator(".cv-resume-pages")).toHaveAttribute("data-resume-overflow", "true");
  await expect(page.getByRole("alert")).toContainText("Nội dung vượt quá 2 trang A4");
  await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Nội dung vượt quá 2 trang A4");
});

for (const location of ["editor", "library"]) {
  test(`Luồng tải PDF hai trang từ ${location}`, async ({ page, context }, testInfo) => {
    await mockEditor(page, user, { ...twoPageResume, selectedTemplate: "executive" });
    await page.route("**/api/resumes", (route) => route.fulfill({ json: [{ ...twoPageResume, selectedTemplate: "executive" }] }));
    let printedDocument;
    await page.exposeFunction("captureResumePrint", (html) => { printedDocument = html; });
    await page.addInitScript(() => {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof HTMLIFrameElement) {
              node.addEventListener("load", () => {
                node.contentWindow.print = () => window.captureResumePrint(node.contentDocument.documentElement.outerHTML);
              });
            }
          }
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto(location === "editor" ? "/resume/editing-cv" : "/ResumeSelection");
    await page.getByRole("button", { name: location === "editor" ? "Tải CV dưới dạng PDF" : "Tải PDF", exact: true }).click();
    await expect.poll(() => Boolean(printedDocument)).toBe(true);
    const printPage = await context.newPage();
    await printPage.setContent(printedDocument);
    const bytes = await printPage.pdf({ format: "A4", printBackground: true, path: testInfo.outputPath(`${location}-print-two-pages.pdf`) });
    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    expect(pdf.numPages).toBe(2);
    const secondPage = await (await pdf.getPage(2)).getTextContent();
    expect(secondPage.items.map((item) => item.str).join(" ")).toContain("FINAL-MARKER");
    await task.destroy();
    await printPage.close();
  });
}

for (const template of ["executive", "elegant", "nordic"]) {
  test(`Mô tả dài trong một mục tiếp tục sang trang sau: ${template}`, async ({ page }) => {
    const paragraphs = Array.from({ length: 12 }, (_, index) => `<p>LINE-${index} ${pageDescription.repeat(4)} ENDLINE-${index}</p>`).join("");
    await mockEditor(page, user, {
      ...twoPageResume, selectedTemplate: template, bio: "", project: [], customSections: [],
      experience: [{ id: "long-entry", title: "Developer", company: "RabbitCV", description: paragraphs }],
    });
    await page.goto("/resume/view/editing-cv");
    await expect(page.locator(".cv-resume-pages")).toHaveAttribute("data-pagination-ready", "true");
    await expect(page.locator(".cv-resume-pages")).toHaveAttribute("data-resume-overflow", "false");
    const bytes = await page.pdf({ format: "A4", printBackground: true });
    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    expect(pdf.numPages).toBe(2);
    const pages = [];
    for (let number = 1; number <= 2; number += 1) pages.push((await (await pdf.getPage(number)).getTextContent()).items.map((item) => item.str).join(" "));
    expect(pages[1]).toContain("ENDLINE-11");
    for (let index = 0; index < 12; index += 1) expect(pages.join(" ").split(`ENDLINE-${index} `)).toHaveLength(2);
    await task.destroy();
  });
}

async function addCustomSection(page, title = "Hoạt động tình nguyện") {
  await page.getByRole("button", { name: "Thêm mục tùy chỉnh", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm mục tùy chỉnh" });
  await dialog.getByLabel("Tên mục").fill(title);
  await dialog.getByRole("button", { name: "Lưu mục", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: `Thêm nội dung · ${title}`, exact: true }).click();
  const entryDialog = page.getByRole("dialog", { name: `Thêm nội dung · ${title}`, exact: true });
  await entryDialog.getByLabel("Tên nội dung", { exact: true }).fill("Hướng dẫn lập trình");
  await entryDialog.locator("[contenteditable=true]").fill("Hướng dẫn lập trình cho sinh viên.");
  await entryDialog.getByRole("button", { name: "Lưu mục", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText(title);
}

test("Sửa mục tùy chỉnh và hoàn tác/làm lại", async ({ page }) => {
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  await addCustomSection(page);
  await page.getByRole("button", { name: "Chỉnh sửa Hoạt động tình nguyện", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Chỉnh sửa mục tùy chỉnh" });
  await dialog.getByLabel("Tên mục").fill("Hoạt động cộng đồng");
  await dialog.getByRole("button", { name: "Lưu mục", exact: true }).click();
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động tình nguyện");
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động cộng đồng");
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().customSections[0]).toMatchObject({ title: "Hoạt động cộng đồng" });
  expect(mocks.getPayload().customSections[0].items[0].description).toContain("Hướng dẫn lập trình");
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động tình nguyện");
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await page.reload();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động cộng đồng");
  await expect(page.getByRole("button", { name: "Hoàn tác CV", exact: true })).toBeDisabled();
  await page.goto("/resume/view/editing-cv");
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động cộng đồng");
});

test("Kéo thả sắp xếp bố cục CV", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  await addCustomSection(page);
  await page.getByRole("button", { name: "Chỉnh bố cục CV", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Sắp xếp bố cục CV" });
  const main = dialog.locator('[data-layout-zone="main"]');
  const sidebar = dialog.locator('[data-layout-zone="sidebar"]');
  const handle = sidebar.getByRole("button", { name: "Kéo Kỹ năng", exact: true });
  const source = await handle.boundingBox();
  const target = await main.getByRole("button", { name: "Kéo Giới thiệu", exact: true }).boundingBox();
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(main.getByRole("button", { name: "Kéo Kỹ năng", exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Chuyển cột Hoạt động tình nguyện", exact: true }).click();
  await expect(sidebar.getByRole("button", { name: "Kéo Hoạt động tình nguyện", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator(".cv-wrapper aside [data-custom-section]")).toBeVisible();
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper main [data-custom-section]")).toBeVisible();
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await page.getByRole("button", { name: "Chỉnh bố cục CV", exact: true }).click();
  await main.getByRole("button", { name: "Chuyển cột Kỹ năng", exact: true }).click();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.locator(".cv-wrapper main")).toContainText("Kỹ năng");
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().layout.byTemplate.elegant.main).toContain("skill");
  expect(mocks.getPayload().layout.byTemplate.elegant.sidebar).toContain(`custom:${mocks.getPayload().customSections[0].id}`);
  await page.reload();
  await expect(page.locator(".cv-wrapper aside [data-custom-section]")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cv-layout-desktop.png"), fullPage: true });
});

test("Xóa và khôi phục mục tùy chỉnh", async ({ page }) => {
  await mockEditor(page);
  await page.goto("/resume/editing-cv");
  await addCustomSection(page);
  await page.getByRole("button", { name: "Xóa Hoạt động tình nguyện", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toHaveCount(0);
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toBeVisible();
});

test("AI điền CV và hoàn tác/làm lại", async ({ page }) => {
  const mocks = await mockEditor(page, user, { ...initialResume, bio: "", skill: [], experience: [], education: [] });
  await page.goto("/resume/editing-cv");
  await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
  const previewDialog = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
  await expect(previewDialog).toBeVisible();
  await expect(page.locator(".cv-wrapper")).not.toContainText("AI summary");
  const bioCheckbox = previewDialog.getByRole("checkbox", { name: /Giới thiệu bản thân/ });
  const reactCheckbox = previewDialog.getByRole("checkbox", { name: "Kỹ năng: React", exact: true });
  await expect(bioCheckbox).not.toBeChecked();
  await expect(reactCheckbox).not.toBeChecked();
  await bioCheckbox.check();
  await reactCheckbox.check();
  await previewDialog.getByRole("button", { name: "Áp dụng mục đã chọn", exact: true }).click();
  await expect(previewDialog).toHaveCount(0);
  await expect(page.locator(".cv-wrapper")).toContainText("AI summary");
  await expect(page.locator(".cv-wrapper")).toContainText("React");
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).not.toContainText("AI summary");
  await expect(page.locator(".cv-wrapper")).not.toContainText("React");
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).toContainText("AI summary");
  await expect(page.locator(".cv-wrapper")).toContainText("React");
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().skill).toHaveLength(1);
  expect(mocks.getPayload().skill[0]).not.toHaveProperty("performance");
  expect(mocks.getPayload().skill[0]).not.toHaveProperty("description");
});

test("Lưu CV mới và giữ lịch sử hoàn tác", async ({ page }) => {
  await mockEditor(page);
  await page.goto("/resume");
  await addCustomSection(page);
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page).toHaveURL(/\/resume\/editing-cv$/);
  await expect(page.getByRole("button", { name: "Hoàn tác CV", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section] article")).toHaveCount(0);
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toHaveCount(0);
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper [data-custom-section]")).toContainText("Hoạt động tình nguyện");
});

test("Đồng bộ editor tiểu sử khi hoàn tác", async ({ page }) => {
  await mockEditor(page);
  await page.goto("/resume/editing-cv");
  const editor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
  await expect(editor).toContainText("Phát triển ứng dụng React.");
  await editor.fill("Tiểu sử đã được thay đổi.");
  await expect(page.locator(".cv-wrapper")).toContainText("Tiểu sử đã được thay đổi.");
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(editor).toContainText("Phát triển ứng dụng React.");
  await expect(page.getByRole("button", { name: "Làm lại CV", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(editor).toContainText("Tiểu sử đã được thay đổi.");
});

test("Quản lý nhóm mục tùy chỉnh và chi tiết", async ({ page }, testInfo) => {
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  await addCustomSection(page);
  await page.getByRole("button", { name: "Thêm nội dung · Hoạt động tình nguyện", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm nội dung · Hoạt động tình nguyện", exact: true });
  await dialog.getByLabel("Tên nội dung", { exact: true }).fill("Điều phối sự kiện");
  await dialog.getByLabel("Tổ chức / Đơn vị", { exact: true }).fill("Câu lạc bộ CNTT");
  await dialog.getByLabel("Địa điểm", { exact: true }).fill("Hồ Chí Minh");
  await dialog.getByLabel("Thời gian bắt đầu", { exact: true }).fill("01/2025");
  await dialog.getByLabel("Đang diễn ra", { exact: true }).check();
  await dialog.getByLabel("Liên kết", { exact: true }).fill("https://example.org/event");
  await dialog.locator("[contenteditable=true]").fill("Tổ chức hội thảo công nghệ.");
  await dialog.getByRole("button", { name: "Thêm trường thông tin", exact: true }).click();
  await dialog.getByLabel("Tên trường 1", { exact: true }).fill("Quy mô");
  await dialog.getByLabel("Giá trị 1", { exact: true }).fill("200 người tham dự");
  await page.screenshot({ path: testInfo.outputPath("cv-custom-entry-desktop.png") });
  await dialog.getByRole("button", { name: "Lưu mục", exact: true }).click();
  const preview = page.locator(".cv-wrapper [data-custom-section]");
  await expect(preview.locator("article")).toHaveCount(2);
  await expect(preview).toContainText("Quy mô: 200 người tham dự");
  await expect(preview.getByRole("link")).toHaveAttribute("href", "https://example.org/event");
  await page.getByRole("button", { name: "Chỉnh sửa Hoạt động tình nguyện", exact: true }).click();
  const config = page.getByRole("dialog", { name: "Chỉnh sửa mục tùy chỉnh", exact: true });
  for (const checkbox of ["Tổ chức / Đơn vị", "Địa điểm", "Thời gian", "Liên kết", "Mô tả"]) await config.getByRole("checkbox", { name: checkbox, exact: true }).uncheck();
  await config.getByRole("button", { name: "Lưu mục", exact: true }).click();
  await expect(preview).toContainText("Điều phối sự kiện");
  await expect(preview).not.toContainText("Câu lạc bộ CNTT");
  await page.getByRole("button", { name: "Chỉnh sửa nội dung Điều phối sự kiện", exact: true }).click();
  const entry = page.getByRole("dialog", { name: "Chỉnh sửa · Hoạt động tình nguyện", exact: true });
  await expect(entry.getByLabel("Tên nội dung", { exact: true })).toHaveValue("Điều phối sự kiện");
  await expect(entry.getByLabel("Tổ chức / Đơn vị", { exact: true })).toHaveCount(0);
  await entry.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().customSections[0].items).toHaveLength(2);
  expect(mocks.getPayload().customSections[0].items[1]).toMatchObject({ organization: "Câu lạc bộ CNTT", endDate: "Hiện tại", details: [{ label: "Quy mô", value: "200 người tham dự" }] });
  await page.reload();
  await expect(preview.locator("article")).toHaveCount(2);
  await expect(preview).toContainText("200 người tham dự");
  await page.getByRole("button", { name: "Chỉnh sửa Hoạt động tình nguyện", exact: true }).click();
  await config.getByRole("checkbox", { name: "Tổ chức / Đơn vị", exact: true }).check();
  await config.getByRole("button", { name: "Lưu mục", exact: true }).click();
  await expect(preview).toContainText("Câu lạc bộ CNTT");
  await page.screenshot({ path: testInfo.outputPath("cv-custom-group-preview.png"), fullPage: true });
});

test("Thêm và lưu tên kỹ năng", async ({ page }) => {
  const mocks = await mockEditor(page);
  await page.goto("/resume/editing-cv");
  await page.getByText("Thêm kỹ năng", { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm kỹ năng mới", exact: true });
  await expect(dialog.getByRole("textbox")).toHaveCount(1);
  await expect(dialog.getByRole("slider")).toHaveCount(0);
  await dialog.getByLabel("Tên kỹ năng", { exact: true }).fill("TypeScript");
  await dialog.getByRole("button", { name: "Thêm mới", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).toContainText("TypeScript");
  await expect(page.locator(".cv-wrapper")).not.toContainText("Hooks");
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).not.toContainText("TypeScript");
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
  await expect(page.getByText("Lưu CV thành công!", { exact: true })).toBeVisible();
  expect(mocks.getPayload().skill.map(({ title }) => title)).toEqual(["React", "TypeScript"]);
  expect(mocks.getPayload().skill.every((item) => !Object.hasOwn(item, "description") && !Object.hasOwn(item, "performance"))).toBe(true);
});

for (const template of ["classic", "modern", "professional", "elegant", "creative", "compact"]) {
  test(`Hiển thị kỹ năng trên template ${template}`, async ({ page }) => {
    await mockEditor(page, user, { ...initialResume, selectedTemplate: template });
    await page.goto("/resume/editing-cv");
    const preview = page.locator(".cv-wrapper").first();
    await expect(preview).toContainText("React");
    await expect(preview).not.toContainText("Hooks");
    await expect(preview).not.toContainText("Tốt");
    await mockEditor(page, user, { ...initialResume, selectedTemplate: template, customSections: [{ id: "legacy", title: "Hoạt động cũ", content: "<p>Nội dung tùy chỉnh cũ.</p>" }] });
    await page.reload();
    await expect(preview.locator("[data-custom-section]")).toContainText("Nội dung tùy chỉnh cũ.");
    await expect(preview).not.toContainText("Hooks");
    await expect(preview).not.toContainText("Tốt");
  });
}


const fullGroundTruthResume = {
  _id: "editing-cv",
  title: "CV Chuẩn ATS Song Ngữ",
  selectedTemplate: "modern",
  pageCount: 1,
  image: "",
  personalInfo: {
    fullName: "Nguyễn Minh Anh",
    jobTitle: "Senior Full-Stack Engineer",
    email: "minhanh.nguyen@rabbitcv.test",
    phone: "0912345678",
    location: "Quận 1, TP. Hồ Chí Minh",
    website: "https://minhanh.dev",
  },
  profile: [
    { id: "prof-1", networkName: "GitHub: github.com/minhanh-dev", link: "https://github.com/minhanh-dev" },
  ],
  bio: "<p>Kỹ sư phần mềm với 5 năm phát triển hệ thống Web Cloud-Native và kiến trúc Microservices.</p>",
  experience: [
    {
      id: "exp-1",
      title: "Trưởng nhóm Frontend",
      company: "Công ty Cổ phần RabbitCV",
      location: "Hà Nội",
      startDate: "01/2023",
      endDate: "Hiện tại",
      description: "<ul><li>Tối ưu hóa hiệu năng ứng dụng React và hệ thống xuất PDF lớp văn bản chuẩn ATS.</li></ul>",
    },
  ],
  education: [
    {
      id: "edu-1",
      title: "Kỹ sư Công nghệ Thông tin",
      company: "Đại học Bách Khoa",
      location: "TP. Hồ Chí Minh",
      major: "Khoa học Máy tính",
      score: "GPA 3.8/4.0",
      startDate: "09/2017",
      endDate: "06/2021",
      description: "<p>Tốt nghiệp loại Giỏi chương trình kỹ sư chất lượng cao.</p>",
    },
  ],
  skill: [
    { id: "sk-1", title: "TypeScript" },
    { id: "sk-2", title: "Node.js" },
    { id: "sk-3", title: "Playwright" },
  ],
  language: [
    { id: "lang-1", title: "Tiếng Việt", description: "Bản ngữ" },
    { id: "lang-2", title: "English (IELTS 8.0)", description: "Fluent Professional" },
  ],
  certificate: [
    {
      id: "cert-1",
      title: "AWS Certified Solutions Architect",
      publisher: "Amazon Web Services",
      date: "08/2024",
      description: "<p>Chứng chỉ kiến trúc đám mây chuyên nghiệp.</p>",
    },
  ],
  project: [
    {
      id: "proj-1",
      title: "Nền tảng Tuyển dụng RabbitCV",
      date: "11/2025",
      link: "https://rabbitcv.example.com",
      description: "<p>Xây dựng hệ thống tạo CV chuẩn A4 và quản lý ứng tuyển trực tuyến.</p>",
    },
  ],
  award: [
    {
      id: "aw-1",
      title: "Giải Nhất Hackathon Công nghệ Xanh",
      awarder: "Hiệp hội Phần mềm Việt Nam",
      date: "05/2024",
      description: "<p>Sản phẩm xuất sắc nhất hạng mục AI & Web.</p>",
    },
  ],
  hobby: [
    { id: "hob-1", title: "Chạy bộ đường dài" },
    { id: "hob-2", title: "Đọc sách kiến trúc phần mềm" },
  ],
  customSections: [
    {
      id: "volunteer",
      title: "Hoạt động cộng đồng",
      items: [
        {
          id: "vol-1",
          title: "Cố vấn kỹ thuật mở",
          organization: "Vietnam Open Source",
          location: "Đà Nẵng",
          startDate: "03/2024",
          endDate: "Hiện tại",
          link: "https://opensource.vn",
          description: "<p>Hướng dẫn sinh viên thực hành kiểm thử tự động và thiết kế hệ thống.</p>",
          details: [{ label: "Số giờ đóng góp", value: "120 giờ" }],
        },
      ],
    },
  ],
};

const normalizeExtractedText = (value) =>
  String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();

async function renderPdfToPngs(pdfPath, artifactDir, prefix, expectedPages) {
  const outputPrefix = path.join(artifactDir, `${prefix}-page`);
  await execFileAsync("pdftoppm", ["-png", "-r", "150", pdfPath, outputPrefix]);
  for (let pageIdx = 1; pageIdx <= expectedPages; pageIdx += 1) {
    const pngPath = path.join(artifactDir, `${prefix}-page-${pageIdx}.png`);
    const stat = await fs.stat(pngPath);
    expect(stat.size, `${prefix} page ${pageIdx} PNG size`).toBeGreaterThan(1000);
  }
}

async function assertNoHeaderContactClipping(targetPage, contextLabel, contactSnippets = []) {
  const issues = await targetPage.evaluate(
    ({ snippets }) => {
      const root = document.querySelector(".cv-wrapper");
      if (!root) return ["Missing .cv-wrapper"];
      const problems = [];
      const rootRect = root.getBoundingClientRect();
      const aside = [...root.querySelectorAll("aside")].find((node) => !node.closest(".cv-pagination-source")) || null;
      const asideRect = aside ? aside.getBoundingClientRect() : null;

      const candidates = [...root.querySelectorAll("*")].filter(
        (el) => {
          if (!(el instanceof HTMLElement) || el.closest(".cv-pagination-source")) return false;
          const directText = [...el.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent?.trim() || "")
            .join(" ")
            .trim();
          if (!directText) return false;
          return snippets.some((snippet) => directText.includes(snippet));
        },
      );

      for (const snippet of snippets) {
        const matched = candidates.filter((el) => el.textContent?.includes(snippet));
        if (matched.length === 0) {
          problems.push(`Missing visible contact snippet: ${snippet}`);
          continue;
        }
        for (const el of matched) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            problems.push(`Zero-size contact element for: ${snippet}`);
          }
          if (style.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) {
            problems.push(`Ellipsis truncation on: ${snippet} (${el.scrollWidth} > ${el.clientWidth})`);
          }
          if (rect.right > rootRect.right + 1.5 || rect.left < rootRect.left - 1.5) {
            problems.push(`Contact element overflows .cv-wrapper for: ${snippet}`);
          }
          const columnContainer = el.closest("header, aside, [data-resume-header], .col-span-8, .col-span-4");
          if (columnContainer) {
            const colRect = columnContainer.getBoundingClientRect();
            if (rect.right > colRect.right + 1.5 || rect.left < colRect.left - 1.5) {
              problems.push(
                `Contact element overflows column container for: ${snippet} (rect.right=${Math.round(rect.right)}, col.right=${Math.round(colRect.right)})`,
              );
            }
          }
          if (
            asideRect &&
            aside &&
            !aside.contains(el) &&
            asideRect.left > rootRect.left + 80 &&
            rect.bottom > asideRect.top + 1 &&
            rect.top < asideRect.bottom - 1 &&
            rect.right > asideRect.left + 1.5
          ) {
            problems.push(
              `Header contact element overlaps sidebar for: ${snippet} (rect.right=${Math.round(rect.right)}, aside.left=${Math.round(asideRect.left)})`,
            );
          }
        }
      }
      return problems;
    },
    { snippets: contactSnippets },
  );

  expect(issues, `${contextLabel} contact geometry issues`).toEqual([]);
}

test("Xuất PDF lớp văn bản chuẩn ATS trên cả 3 entrypoint (Editor, Library, ViewResume) với đầy đủ các section", async ({ page, context }) => {
  test.setTimeout(90_000);
  const artifactDir = path.resolve(process.cwd(), "output", "pdf", "sprint1-pdf-text");
  await fs.mkdir(artifactDir, { recursive: true });

  let printedDocument = null;
  await page.exposeFunction("captureSprint1ResumePrint", (html) => {
    printedDocument = html;
  });
  await page.addInitScript(() => {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            node.addEventListener("load", () => {
              node.contentWindow.print = () =>
                window.captureSprint1ResumePrint(node.contentDocument.documentElement.outerHTML);
            });
          }
        }
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });

  const cases = [
    {
      id: "editor-compact-1page",
      entrypoint: "editor",
      url: "/resume/editing-cv",
      buttonName: "Tải CV dưới dạng PDF",
      resume: { ...fullGroundTruthResume, selectedTemplate: "compact", pageCount: 1 },
      expectedPages: 1,
    },
    {
      id: "library-modern-1page",
      entrypoint: "library",
      url: "/ResumeSelection",
      buttonName: "Tải PDF",
      resume: { ...fullGroundTruthResume, selectedTemplate: "modern", pageCount: 1 },
      expectedPages: 1,
    },
    {
      id: "viewer-elegant-2pages",
      entrypoint: "viewer",
      url: "/resume/view/editing-cv",
      buttonName: "In / Tải PDF",
      resume: {
        ...fullGroundTruthResume,
        selectedTemplate: "elegant",
        pageCount: 2,
        experience: [
          ...fullGroundTruthResume.experience,
          ...Array.from({ length: 4 }, (_, idx) => ({
            id: `exp-extra-${idx}`,
            title: `Kỹ sư Phần mềm Cấp cao ${idx + 1}`,
            company: `Tập đoàn Công nghệ Số ${idx + 1}`,
            location: "TP. Hồ Chí Minh",
            startDate: "01/2020",
            endDate: "12/2022",
            description: `<p>Phát triển kiến trúc vi dịch vụ, tối ưu cơ sở dữ liệu phân tán và bảo mật hệ thống cấp doanh nghiệp đợt ${idx + 1}.</p>`,
          })),
        ],
      },
      expectedPages: 2,
    },
  ];

  const requiredPhrases = [
    "Nguyễn Minh Anh",
    "Senior Full-Stack Engineer",
    "minhanh.nguyen@rabbitcv.test",
    "0912345678",
    "Quận 1, TP. Hồ Chí Minh",
    "minhanh.dev",
    "github.com/minhanh-dev",
    "Kỹ sư phần mềm với 5 năm phát triển hệ thống Web Cloud-Native và kiến trúc Microservices.",
    "Trưởng nhóm Frontend",
    "Công ty Cổ phần RabbitCV",
    "Tối ưu hóa hiệu năng ứng dụng React và hệ thống xuất PDF lớp văn bản chuẩn ATS.",
    "Kỹ sư Công nghệ Thông tin",
    "Đại học Bách Khoa",
    "Khoa học Máy tính",
    "GPA 3.8/4.0",
    "Tốt nghiệp loại Giỏi chương trình kỹ sư chất lượng cao.",
    "TypeScript",
    "Node.js",
    "Playwright",
    "Tiếng Việt",
    "Bản ngữ",
    "English (IELTS 8.0)",
    "Fluent Professional",
    "AWS Certified Solutions Architect",
    "Amazon Web Services",
    "Chứng chỉ kiến trúc đám mây chuyên nghiệp.",
    "Nền tảng Tuyển dụng RabbitCV",
    "Xây dựng hệ thống tạo CV chuẩn A4 và quản lý ứng tuyển trực tuyến.",
    "Giải Nhất Hackathon Công nghệ Xanh",
    "Hiệp hội Phần mềm Việt Nam",
    "Sản phẩm xuất sắc nhất hạng mục AI & Web.",
    "Chạy bộ đường dài",
    "Đọc sách kiến trúc phần mềm",
    "Hoạt động cộng đồng",
    "Cố vấn kỹ thuật mở",
    "Vietnam Open Source",
    "Hướng dẫn sinh viên thực hành kiểm thử tự động và thiết kế hệ thống.",
    "Số giờ đóng góp: 120 giờ",
  ];

  const uniqueOnceMarkers = [
    "minhanh.nguyen@rabbitcv.test",
    "0912345678",
    "Tối ưu hóa hiệu năng ứng dụng React và hệ thống xuất PDF lớp văn bản chuẩn ATS.",
    "Tốt nghiệp loại Giỏi chương trình kỹ sư chất lượng cao.",
    "Chứng chỉ kiến trúc đám mây chuyên nghiệp.",
    "Xây dựng hệ thống tạo CV chuẩn A4 và quản lý ứng tuyển trực tuyến.",
    "Sản phẩm xuất sắc nhất hạng mục AI & Web.",
    "Hướng dẫn sinh viên thực hành kiểm thử tự động và thiết kế hệ thống.",
    "Số giờ đóng góp: 120 giờ",
  ];

  const contactSnippets = [
    "minhanh.nguyen@rabbitcv.test",
    "0912345678",
    "Quận 1, TP. Hồ Chí Minh",
    "minhanh.dev",
    "github.com/minhanh-dev",
  ];

  for (const testCase of cases) {
    printedDocument = null;
    await mockEditor(page, user, testCase.resume);
    await page.route("**/api/resumes", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([testCase.resume]) }),
    );

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(testCase.url);
    await page.getByRole("button", { name: testCase.buttonName }).click();
    await expect.poll(() => Boolean(printedDocument)).toBe(true);

    const printPage = await context.newPage();
    await printPage.setViewportSize({ width: 794, height: 1123 });
    await printPage.setContent(printedDocument);
    await printPage.emulateMedia({ media: "print" });

    await assertNoHeaderContactClipping(printPage, testCase.id, contactSnippets);

    const pdfPath = path.join(artifactDir, `${testCase.id}.pdf`);
    const bytes = await printPage.pdf({
      format: "A4",
      printBackground: true,
      path: pdfPath,
    });

    await renderPdfToPngs(pdfPath, artifactDir, testCase.id, testCase.expectedPages);

    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    expect(pdf.numPages, `${testCase.id} page count`).toBe(testCase.expectedPages);

    const pageTexts = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const pdfPage = await pdf.getPage(pageNumber);
      const textContent = await pdfPage.getTextContent();
      if (testCase.id === "library-modern-1page" && pageNumber === 1) {
        const locationItems = textContent.items.filter((item) =>
          normalizeExtractedText(item.str).includes("Quận 1, TP. Hồ Chí Minh"),
        );
        expect(locationItems.length).toBeGreaterThan(0);
        for (const item of locationItems) {
          expect(item.transform[4] + item.width).toBeLessThan(395);
        }
      }
      const rawText = textContent.items.map((item) => item.str).join(" ");
      pageTexts.push(normalizeExtractedText(rawText));
    }

    const combinedText = normalizeExtractedText(pageTexts.join(" "));
    expect(combinedText.length).toBeGreaterThan(500);

    for (const phrase of requiredPhrases) {
      const normalizedPhrase = normalizeExtractedText(phrase);
      expect(combinedText.toLowerCase(), `${testCase.id} missing phrase: ${normalizedPhrase}`).toContain(normalizedPhrase.toLowerCase());
    }

    for (const marker of uniqueOnceMarkers) {
      const normalizedMarker = normalizeExtractedText(marker);
      expect(
        combinedText.split(normalizedMarker).length - 1,
        `${testCase.id} duplicate/missing marker: ${normalizedMarker}`,
      ).toBe(1);
    }

    const namePos = combinedText.toLowerCase().indexOf(normalizeExtractedText("Nguyễn Minh Anh").toLowerCase());
    const bioPos = combinedText.toLowerCase().indexOf(normalizeExtractedText("Kỹ sư phần mềm với 5 năm").toLowerCase());
    const customPos = combinedText.toLowerCase().indexOf(normalizeExtractedText("Hoạt động cộng đồng").toLowerCase());
    expect(namePos).toBeGreaterThanOrEqual(0);
    expect(bioPos).toBeGreaterThan(namePos);
    expect(customPos).toBeGreaterThan(namePos);

    if (testCase.expectedPages === 2) {
      expect(pageTexts[1]).not.toContain(normalizeExtractedText("minhanh.nguyen@rabbitcv.test"));
      expect(pageTexts[1].toLowerCase()).toContain(normalizeExtractedText("Hoạt động cộng đồng").toLowerCase());
    }

    await task.destroy();
    await printPage.close();
  }
});

test("Hiển thị đầy đủ thông tin liên hệ dài và ảnh đại diện trên các mẫu 1 cột và 2 cột khi in PDF", async ({ page }) => {
  const avatarDataUrl =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#2563eb"/><circle cx="60" cy="48" r="24" fill="#ffffff"/><rect x="28" y="80" width="64" height="28" rx="14" fill="#ffffff"/></svg>',
    );

  const longContactResumeBase = {
    ...fullGroundTruthResume,
    pageCount: 1,
    image: avatarDataUrl,
    personalInfo: {
      fullName: "Nguyễn Minh Anh",
      jobTitle: "Principal Cloud & Distributed Systems Architect",
      email: "minhanh.nguyen.architect@rabbitcv-enterprise.test",
      phone: "0912345678",
      location: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      website: "https://portfolio.minhanh-nguyen-architect.example.com/cv",
    },
    profile: [
      {
        id: "prof-long",
        networkName: "LinkedIn: linkedin.com/in/nguyen-minh-anh-cloud-architect",
        link: "https://linkedin.com/in/nguyen-minh-anh-cloud-architect",
      },
    ],
  };

  const contactSnippets = [
    "minhanh.nguyen.architect@rabbitcv-enterprise.test",
    "0912345678",
    "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "portfolio.minhanh-nguyen-architect.example.com/cv",
    "linkedin.com/in/nguyen-minh-anh-cloud-architect",
  ];

  const templateCases = [
    {
      id: "modern-legacy-2col",
      resume: { ...longContactResumeBase, selectedTemplate: "modern", customSections: [] },
      expectAvatar: true,
      maxHeaderContactRightPt: 395,
    },
    {
      id: "modern-customizable-2col",
      resume: { ...longContactResumeBase, selectedTemplate: "modern" },
      expectAvatar: true,
      maxHeaderContactRightPt: 395,
    },
    {
      id: "professional-sidebar-avatar",
      resume: { ...longContactResumeBase, selectedTemplate: "professional", customSections: [] },
      expectAvatar: true,
    },
    {
      id: "compact-1col",
      resume: { ...longContactResumeBase, selectedTemplate: "compact" },
      expectAvatar: false,
    },
  ];

  for (const item of templateCases) {
    await page.emulateMedia({ media: "screen" });
    await mockEditor(page, user, item.resume);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/resume/view/editing-cv");

    const fitPage = page.locator(".cv-wrapper [data-fit-ready]");
    await expect(fitPage, `${item.id} fitReady`).toHaveAttribute("data-fit-ready", "true");
    await expect(fitPage, `${item.id} overflow`).toHaveAttribute("data-resume-overflow", "false");

    if (item.expectAvatar) {
      const avatar = page.locator(".cv-wrapper img").first();
      await expect(avatar).toBeVisible();
    }

    await assertNoHeaderContactClipping(page, `${item.id}-screen`, contactSnippets);
    await page.emulateMedia({ media: "print" });
    await assertNoHeaderContactClipping(page, `${item.id}-print`, contactSnippets);

    const bytes = await page.pdf({ format: "A4", printBackground: true });
    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    expect(pdf.numPages, `${item.id} numPages`).toBe(1);
    const pdfPage = await pdf.getPage(1);
    const textContent = await pdfPage.getTextContent();
    const extracted = normalizeExtractedText(textContent.items.map((entry) => entry.str).join(" "));
    const compactExtracted = extracted.replace(/\s+/g, "").toLowerCase();

    for (const snippet of contactSnippets) {
      const normalizedSnippet = normalizeExtractedText(snippet).toLowerCase();
      if (normalizedSnippet.includes(" ")) {
        expect(extracted.toLowerCase(), `${item.id} PDF text snippet ${snippet}`).toContain(normalizedSnippet);
      } else {
        expect(compactExtracted, `${item.id} PDF compact snippet ${snippet}`).toContain(
          normalizedSnippet.replace(/\s+/g, ""),
        );
      }
    }

    if (item.maxHeaderContactRightPt) {
      const contactItems = textContent.items.filter((entry) => {
        const text = normalizeExtractedText(entry.str);
        return (
          text.includes("Quận 1") ||
          text.includes("minhanh.nguyen.architect") ||
          text.includes("portfolio.minhanh")
        );
      });
      expect(contactItems.length).toBeGreaterThan(0);
      for (const entry of contactItems) {
        expect(entry.transform[4] + entry.width, `${item.id} PDF item right bound: ${entry.str}`).toBeLessThan(
          item.maxHeaderContactRightPt,
        );
      }
    }

    await task.destroy();
  }
});

test("Chặn in sớm khi CV chưa sẵn sàng hoặc tràn 1 trang A4, giữ nguyên dữ liệu đã nhập và cho phép thử lại hoặc chuyển sang 2 trang", async ({ page }) => {
  let printedDocument = null;
  await page.exposeFunction("captureReadinessResumePrint", (html) => {
    printedDocument = html;
  });
  await page.addInitScript(() => {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            node.addEventListener("load", () => {
              node.contentWindow.print = () =>
                window.captureReadinessResumePrint(node.contentDocument.documentElement.outerHTML);
            });
          }
        }
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });

  // Phần 1: Ảnh đại diện tải chậm khiến CV chưa sẵn sàng (data-fit-ready="false") -> chặn in sớm, giữ dữ liệu, sau khi ảnh tải xong in thành công
  let releaseSlowAvatar;
  const slowAvatarGate = new Promise((resolve) => {
    releaseSlowAvatar = resolve;
  });
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  await page.route("**/slow-avatar.png", async (route) => {
    await slowAvatarGate;
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: onePixelPng,
    });
  });

  await mockEditor(page, user, {
    ...initialResume,
    selectedTemplate: "modern",
    pageCount: 1,
    image: "/slow-avatar.png",
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/resume/editing-cv");

  const fitPage = page.locator(".cv-wrapper [data-fit-ready]");
  await expect(fitPage).toHaveAttribute("data-fit-ready", "false");

  const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
  await bioEditor.fill("Tiểu sử cập nhật khi đang chờ tải ảnh đại diện.");
  await expect(page.locator(".cv-wrapper")).toContainText("Tiểu sử cập nhật khi đang chờ tải ảnh đại diện.");

  await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("CV chưa sẵn sàng để in. Vui lòng thử lại.", {
    timeout: 6000,
  });
  expect(printedDocument).toBeNull();
  await expect(bioEditor).toContainText("Tiểu sử cập nhật khi đang chờ tải ảnh đại diện.");

  releaseSlowAvatar();
  await expect(fitPage).toHaveAttribute("data-fit-ready", "true");
  await expect(fitPage).toHaveAttribute("data-resume-overflow", "false");

  await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
  await expect.poll(() => Boolean(printedDocument)).toBe(true);
  expect(printedDocument).toContain("Tiểu sử cập nhật khi đang chờ tải ảnh đại diện.");

  // Phần 2: Nội dung vượt quá 1 trang A4 -> hiện cảnh báo, chặn in, giữ nguyên dữ liệu, chuyển sang 2 trang thì in thành công
  printedDocument = null;
  await mockEditor(page, user, {
    ...twoPageResume,
    selectedTemplate: "elegant",
    pageCount: 1,
    experience: Array.from({ length: 7 }, (_, index) => ({
      ...twoPageResume.experience[0],
      id: `overflow-1p-${index}`,
      title: `Chuyên gia Kiến trúc Hệ thống ${index + 1}`,
    })),
  });

  await page.goto("/resume/editing-cv");
  await expect(fitPage).toHaveAttribute("data-fit-ready", "true");
  await expect(fitPage).toHaveAttribute("data-resume-overflow", "true");
  await expect(page.getByRole("alert")).toContainText(
    "Nội dung vượt quá 1 trang A4. Hãy chọn bố cục 2 trang hoặc rút gọn nội dung trước khi xuất PDF.",
  );

  const overflowBioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
  await overflowBioEditor.fill("Dữ liệu người dùng không bị mất khi tràn 1 trang.");

  await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    "Nội dung vượt quá 1 trang A4. Hãy chọn bố cục 2 trang hoặc rút gọn nội dung trước khi xuất PDF.",
  );
  expect(printedDocument).toBeNull();
  await expect(overflowBioEditor).toContainText("Dữ liệu người dùng không bị mất khi tràn 1 trang.");

  await page.getByRole("radio", { name: "2 trang", exact: true }).check();
  const pagedRoot = page.locator(".cv-resume-pages");
  await expect(pagedRoot).toHaveAttribute("data-pagination-ready", "true");
  await expect(pagedRoot).toHaveAttribute("data-resume-overflow", "false");

  await page.getByRole("button", { name: "Tải CV dưới dạng PDF", exact: true }).click();
  await expect.poll(() => Boolean(printedDocument)).toBe(true);
  expect(printedDocument).toContain("Dữ liệu người dùng không bị mất khi tràn 1 trang.");
});

function createBarrier() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function mockAutosaveEditor(
  page,
  {
    currentUser = user,
    resumes = [
      {
        ...initialResume,
        _id: "cv-1",
        title: "CV Backend Số 1",
        selectedTemplate: "modern",
        bio: "<p>Kinh nghiệm Node.js ban đầu.</p>",
      },
      {
        ...initialResume,
        _id: "cv-2",
        title: "CV Frontend Số 2",
        selectedTemplate: "classic",
        bio: "<p>Kinh nghiệm React số 2.</p>",
      },
    ],
    onPostResume = null,
    onGetMe = null,
    onAiFill = null,
    onAiReview = null,
  } = {},
) {
  let activeUser = currentUser ? structuredClone(currentUser) : null;
  const resumesMap = new Map(
    resumes.map((cv) => [cv._id, structuredClone(cv)]),
  );
  const postRequests = [];
  const aiFillRequests = [];
  const aiReviewRequests = [];
  let createdSeq = 1;

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (pathname === "/api/me") {
      if (onGetMe) {
        const handled = await onGetMe(route, activeUser);
        if (handled) return;
      }
      if (!activeUser) {
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
        body: JSON.stringify({ user: activeUser }),
      });
      return;
    }

    if (pathname === "/api/resume" && method === "POST") {
      const payload = request.postDataJSON();
      const index = postRequests.length + 1;
      postRequests.push({ payload, index });

      if (onPostResume) {
        const handled = await onPostResume({
          route,
          request,
          payload,
          index,
          resumesMap,
        });
        if (handled) return;
      }

      const assignedId = payload._id || `cv-created-${createdSeq++}`;
      const savedDoc = {
        ...structuredClone(payload),
        _id: assignedId,
        updatedAt: new Date().toISOString(),
      };
      resumesMap.set(assignedId, savedDoc);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ resume: savedDoc }),
      });
      return;
    }

    if (pathname.startsWith("/api/resume/") && method === "GET") {
      const id = pathname.slice("/api/resume/".length);
      const found = resumesMap.get(id);
      if (!found) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Không tìm thấy CV." }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
      return;
    }

    if (pathname === "/api/ai/resume/fill" && method === "POST") {
      const payload = request.postDataJSON();
      const index = aiFillRequests.length + 1;
      aiFillRequests.push({ payload, index });
      if (onAiFill) {
        const handled = await onAiFill({ route, request, payload, index });
        if (handled) return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: {} }),
      });
      return;
    }

    if (pathname === "/api/ai/resume/review" && method === "POST") {
      const payload = request.postDataJSON();
      const index = aiReviewRequests.length + 1;
      aiReviewRequests.push({ payload, index });
      if (onAiReview) {
        const handled = await onAiReview({ route, request, payload, index });
        if (handled) return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            overallScore: 80,
            summary: "Tổng quan mẫu",
            categories: {
              content: 80,
              clarity: 80,
              impact: 80,
              completeness: 80,
              ats: 80,
            },
            strengths: [],
            improvements: [],
            missingSections: [],
          },
        }),
      });
      return;
    }

    if (pathname === "/api/resumes") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([...resumesMap.values()]),
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

    if (pathname === "/api/saved-jobs" || pathname === "/api/jobs") {
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
    postRequests,
    aiFillRequests,
    aiReviewRequests,
    resumesMap,
    setUser(nextUser) {
      activeUser = nextUser ? structuredClone(nextUser) : null;
    },
  };
}

test.describe("Tự động lưu CV và bảo vệ điều hướng (BL-08)", () => {
  test("CV đã có ID: không tự lưu khi mở, tự động lưu sau ~1.2s idle, giữ con trỏ, undo/redo, bền qua reload và gỡ beforeunload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const mocks = await mockAutosaveEditor(page);

    await page.goto("/resume/cv-1");
    const titleInput = page.getByRole("textbox", { name: "Tên CV", exact: true });
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await expect(titleInput).toHaveValue("CV Backend Số 1");
    await expect(bioEditor).toContainText("Kinh nghiệm Node.js ban đầu.");

    // Không tự động POST khi vừa load/hydrate
    await page.waitForTimeout(1500);
    expect(mocks.postRequests).toHaveLength(0);
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "idle");

    // Gõ sửa bio + sửa tiêu đề và đặt con trỏ ở giữa
    await bioEditor.click();
    await bioEditor.fill("Kinh nghiệm Node.js và TypeScript chuyên sâu.");

    await titleInput.click();
    await titleInput.fill("CV Backend Updated");
    await titleInput.evaluate((el) => {
      el.focus();
      el.setSelectionRange(3, 3);
    });

    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "dirty");
    await expect(page.locator("[data-resume-save-status]")).toContainText("Chưa lưu");

    // Chờ autosave tự động lưu sau ~1.2s mà không bật toast và giữ nguyên focus + vị trí con trỏ
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });
    await expect(page.locator("[data-resume-save-status]")).toContainText(/Đã lưu lúc/);
    expect(mocks.postRequests).toHaveLength(1);
    expect(mocks.postRequests[0].payload._id).toBe("cv-1");
    expect(mocks.postRequests[0].payload.title).toBe("CV Backend Updated");
    expect(mocks.postRequests[0].payload.bio).toContain("TypeScript chuyên sâu");

    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(titleInput).toBeFocused();
    const caretPos = await titleInput.evaluate((el) => ({ start: el.selectionStart, end: el.selectionEnd }));
    expect(caretPos).toEqual({ start: 3, end: 3 });

    // Undo & Redo không bị khóa/reset bởi autosave
    const undoBtn = page.getByRole("button", { name: "Hoàn tác CV", exact: true });
    const redoBtn = page.getByRole("button", { name: "Làm lại CV", exact: true });
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await expect(titleInput).not.toHaveValue("CV Backend Updated");
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await expect(titleInput).toHaveValue("CV Backend Updated");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });

    // Reload khi đã sạch: không hiện cảnh báo beforeunload và giữ nguyên dữ liệu đã lưu trên server
    const seenDialogs = [];
    page.on("dialog", async (dialog) => {
      seenDialogs.push(dialog.type());
      await dialog.accept();
    });

    await page.reload();
    expect(seenDialogs).toEqual([]);
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Backend Updated");
    await expect(page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first()).toContainText(
      "TypeScript chuyên sâu",
    );
  });

  test("CV mới chưa có ID: không tự lưu khi gõ, chống duplicate first POST, giữ sửa đổi trong lúc tạo chậm và tự lưu sau khi cấp _id", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const firstCreateStarted = createBarrier();
    const firstCreateRelease = createBarrier();

    const mocks = await mockAutosaveEditor(page, {
      onPostResume: async ({ route, payload, index, resumesMap }) => {
        if (index === 1) {
          firstCreateStarted.resolve();
          await firstCreateRelease.promise;
          const created = { ...structuredClone(payload), _id: "cv-new-101" };
          resumesMap.set("cv-new-101", created);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ resume: created }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/TopPage");
    await page.getByRole("link", { name: "Tạo CV" }).click();
    await page.waitForURL(/\/ResumeSelection/, { timeout: 10_000 });
    await page.getByRole("button", { name: "Tạo CV mới", exact: true }).click();
    await page.waitForURL(/\/resume$/, { timeout: 10_000 });

    const titleInput = page.getByRole("textbox", { name: "Tên CV", exact: true });
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();

    await titleInput.fill("CV Khởi Tạo Lần Đầu");
    await bioEditor.click();
    await bioEditor.fill("Phiên bản đầu tiên trước khi bấm Lưu.");

    // Chờ >1.5s: CV mới chưa có _id tuyệt đối không tự gọi POST tạo bản ghi
    await page.waitForTimeout(1600);
    expect(mocks.postRequests).toHaveLength(0);
    await expect(page.locator("[data-resume-save-status]")).toContainText("Chưa lưu");

    // Bấm Lưu CV nhanh 2 lần khi POST tạo đầu tiên bị giữ in-flight
    const saveBtn = page.getByRole("button", { name: "Lưu CV", exact: true });
    await saveBtn.evaluate((el) => {
      el.click();
      el.click();
    });
    await firstCreateStarted.promise;
    const savingBtn = page.getByRole("button", { name: "Đang lưu CV", exact: true });
    await expect(savingBtn).toBeDisabled();
    await savingBtn.evaluate((el) => el.click());
    expect(mocks.postRequests).toHaveLength(1);
    expect(mocks.postRequests[0].payload._id).toBeUndefined();

    // Người dùng tiếp tục gõ sửa khi request tạo đầu tiên đang chạy
    await bioEditor.click();
    await bioEditor.fill("Phiên bản V2 được sửa ngay lúc đang tạo CV.");

    // Giải phóng POST tạo đầu tiên -> URL replace thành /resume/cv-new-101, vẫn giữ V2 và chờ autosave tiếp
    firstCreateRelease.resolve();
    await page.waitForURL(/\/resume\/cv-new-101$/, { timeout: 10_000 });
    await expect(page.locator("[data-sonner-toast]")).toContainText("Lưu CV thành công!");
    await expect(bioEditor).toContainText("Phiên bản V2 được sửa ngay lúc đang tạo CV.");

    // Sau khi đã có _id, autosave tự lưu phần V2 bằng _id mới tạo
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });
    expect(mocks.postRequests).toHaveLength(2);
    expect(mocks.postRequests[1].payload._id).toBe("cv-new-101");
    expect(mocks.postRequests[1].payload.bio).toContain("Phiên bản V2 được sửa ngay lúc đang tạo CV.");

    // Quay lại bằng browser Back phải quay thẳng về /ResumeSelection (vì /resume -> /resume/cv-new-101 dùng replace: true)
    await page.goBack();
    await page.waitForURL(/\/ResumeSelection/, { timeout: 10_000 });
  });

  test("Giữ nguyên dữ liệu người dùng và gộp sửa đổi xảy ra trong lúc request lưu trước đang chạy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const firstSaveStarted = createBarrier();
    const firstSaveRelease = createBarrier();

    const mocks = await mockAutosaveEditor(page, {
      onPostResume: async ({ route, payload, index, resumesMap }) => {
        if (index === 1) {
          firstSaveStarted.resolve();
          await firstSaveRelease.promise;
          const saved = { ...structuredClone(payload), _id: "cv-1" };
          resumesMap.set("cv-1", saved);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ resume: saved }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/resume/cv-1");
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await bioEditor.click();
    await bioEditor.fill("Nội dung Gửi Lần 1");

    await firstSaveStarted.promise;
    expect(mocks.postRequests).toHaveLength(1);
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saving");

    // Gõ tiếp 2 lần trong lúc POST #1 bị giữ
    await bioEditor.fill("Nội dung Trung Gian V2");
    await bioEditor.fill("Nội dung Mới Nhất V3");

    // Khi POST #1 (V1) trả về: không được ghi đè ngược về V1 và vẫn ở trạng thái Chưa lưu cho đến khi V3 lưu xong
    firstSaveRelease.resolve();
    await expect(bioEditor).toContainText("Nội dung Mới Nhất V3");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "dirty");

    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });
    expect(mocks.postRequests).toHaveLength(2);
    expect(mocks.postRequests[1].payload.bio).toContain("Nội dung Mới Nhất V3");
    await expect(bioEditor).toContainText("Nội dung Mới Nhất V3");
  });

  test("Phục hồi lỗi 500 tạm thời bằng nút Thử lại và chặn lặp vô hạn với DUPLICATE_RESUME_TITLE", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    let failServerWith500 = true;

    const mocks = await mockAutosaveEditor(page, {
      onPostResume: async ({ route, payload }) => {
        if (failServerWith500) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Lỗi kết nối máy chủ tạm thời." }),
          });
          return true;
        }
        if (payload.title === "CV Đã Tồn Tại") {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              code: "DUPLICATE_RESUME_TITLE",
              message: "Tên CV này đã tồn tại.",
            }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/resume/cv-1");
    const titleInput = page.getByRole("textbox", { name: "Tên CV", exact: true });
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();

    // Phần A: 500 tạm thời -> retry giới hạn -> thất bại, giữ dữ liệu, Thử lại thành công
    await bioEditor.click();
    await bioEditor.fill("Nội dung cần phục hồi lỗi 500.");

    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "failed", {
      timeout: 10_000,
    });
    const failedCountBeforeWait = mocks.postRequests.length;
    expect(failedCountBeforeWait).toBe(2); // 1 autosave + 1 bounded auto-retry

    await expect(page.locator("[data-resume-save-error][role='alert']")).toContainText("Lỗi kết nối máy chủ tạm thời.");
    await expect(bioEditor).toContainText("Nội dung cần phục hồi lỗi 500.");

    // Không tự retry lặp vô hạn khi đã failed
    await page.waitForTimeout(1500);
    expect(mocks.postRequests.length).toBe(failedCountBeforeWait);

    failServerWith500 = false;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });
    expect(mocks.postRequests).toHaveLength(3);
    await expect(page.locator("[data-resume-save-error]")).toHaveCount(0);

    // Phần B: DUPLICATE_RESUME_TITLE giữ edits, báo lỗi rõ ràng, không gửi lại cho tới khi đổi tên
    await titleInput.fill("CV Đã Tồn Tại");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "failed", {
      timeout: 6000,
    });
    await expect(page.locator("#resume-title-error")).toContainText("Tên CV này đã tồn tại");
    const reqsAtDup = mocks.postRequests.length;

    await bioEditor.fill("Sửa tiếp khi tên vẫn trùng.");
    await page.waitForTimeout(1600);
    expect(mocks.postRequests.length).toBe(reqsAtDup);
    await expect(titleInput).toHaveValue("CV Đã Tồn Tại");

    await titleInput.fill("CV Tên Mới Hợp Lệ");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saved", {
      timeout: 6000,
    });
    expect(mocks.postRequests.length).toBe(reqsAtDup + 1);
    await expect(page.locator("#resume-title-error")).toHaveCount(0);
  });

  test("Xác nhận rời trang khi request lưu đang in-flight hủy phản hồi trễ và không ảnh hưởng trang đích", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const saveStarted = createBarrier();
    const saveRelease = createBarrier();

    await mockAutosaveEditor(page, {
      onPostResume: async ({ route, payload, resumesMap }) => {
        saveStarted.resolve();
        await saveRelease.promise;
        const saved = { ...structuredClone(payload), _id: "cv-1" };
        resumesMap.set("cv-1", saved);
        await route
          .fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ resume: saved }),
          })
          .catch(() => {});
        return true;
      },
    });

    await page.goto("/ResumeSelection");
    await page.locator("article", { hasText: "CV Backend Số 1" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-1$/, { timeout: 10_000 });

    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await bioEditor.click();
    await bioEditor.fill("Sửa đổi đang gửi in-flight khi bấm rời trang.");

    await saveStarted.promise;
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "saving");

    // Bấm Thư viện trong khi request đang chạy -> hiện đúng 1 ConfirmPopUp -> Xác nhận rời
    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("CV đang được lưu.");
    await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();

    await page.waitForURL(/\/ResumeSelection/, { timeout: 10_000 });

    // Giải phóng response cũ trễ -> không redirect quay lại editor, không bật toast
    saveRelease.resolve();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        ),
    );
    expect(page.url()).toContain("/ResumeSelection");
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  });

  test("Bảo vệ điều hướng SPA & Back/Forward (ConfirmPopUp 1 lần), đổi CV sạch, cảnh báo beforeunload và không chặn redirect mất quyền", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const holdAutosave = createBarrier();
    let gateSaves = false;

    const mocks = await mockAutosaveEditor(page, {
      onPostResume: async ({ route, payload, resumesMap }) => {
        if (gateSaves) {
          await holdAutosave.promise;
        }
        const saved = { ...structuredClone(payload), _id: payload._id || "cv-1" };
        resumesMap.set(saved._id, saved);
        await route
          .fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ resume: saved }),
          })
          .catch(() => {});
        return true;
      },
    });

    // 1. Tạo lịch sử: /ResumeSelection -> /resume/cv-1 -> quay lại sạch -> /resume/cv-2 -> goBack() -> /resume/cv-1
    await page.goto("/ResumeSelection");
    await page.locator("article", { hasText: "CV Backend Số 1" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-1$/, { timeout: 10_000 });

    // Khi chưa sửa (sạch), bấm Thư viện rời ngay không cần ConfirmPopUp
    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    // Đổi sang CV khác (/resume/cv-2) -> hiển thị đúng dữ liệu CV 2
    await page.locator("article", { hasText: "CV Frontend Số 2" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-2$/, { timeout: 10_000 });
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Frontend Số 2");

    // 2. Làm bẩn CV 2 (giữ gateSaves để không race autosave), kiểm tra browser goBack -> Hủy bỏ ở lại -> giữ sửa đổi
    gateSaves = true;
    const bioEditor2 = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await bioEditor2.click();
    await bioEditor2.fill("Thay đổi chưa lưu ở CV Frontend Số 2.");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "dirty");

    await page.goBack();
    const backDialog = page.getByRole("alertdialog");
    await expect(backDialog).toHaveCount(1);
    await expect(backDialog).toContainText("CV có thay đổi chưa lưu.");
    await backDialog.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(page.url()).toContain("/resume/cv-2");
    await expect(bioEditor2).toContainText("Thay đổi chưa lưu ở CV Frontend Số 2.");

    // 3. Kiểm tra cảnh báo beforeunload thật khi trang đang bẩn (có tương tác trước đó)
    const beforeUnloadTypes = [];
    page.on("dialog", async (dialog) => {
      beforeUnloadTypes.push(dialog.type());
      await dialog.accept();
    });
    await page.reload();
    expect(beforeUnloadTypes).toContain("beforeunload");

    // Sau reload dữ liệu quay về bản sạch của cv-2; thử bấm Back sạch để về /ResumeSelection rồi Forward lại /resume/cv-2 -> chỉnh bẩn -> goForward() sau Back bị chặn bởi ConfirmPopUp
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Frontend Số 2");
    await page.goBack();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });

    // Mở cv-1 -> sửa bẩn -> goBack() xác nhận rời (1 popup) -> quay lại /ResumeSelection
    await page.locator("article", { hasText: "CV Backend Số 1" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-1$/, { timeout: 10_000 });
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Backend Số 1");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "idle");
    const bioEditor1 = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await bioEditor1.click();
    await bioEditor1.fill("Thay đổi chưa lưu ở CV Backend Số 1.");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "dirty");
    await page.goBack();
    const confirmLeaveDialog = page.getByRole("alertdialog");
    await expect(confirmLeaveDialog).toHaveCount(1);
    await confirmLeaveDialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });

    // Kiểm tra browser Forward khi đang bẩn: đi sạch vào cv-1 -> Thư viện -> goBack() về cv-1 (có lịch sử Forward) -> làm bẩn -> goForward() bị chặn 1 lần
    await page.goForward();
    await page.waitForURL(/\/resume\/cv-1$/, { timeout: 10_000 });
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Backend Số 1");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "idle");
    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });
    await page.goBack();
    await page.waitForURL(/\/resume\/cv-1$/, { timeout: 10_000 });
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Backend Số 1");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "idle");

    const bioForForward = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await bioForForward.click();
    await bioForForward.fill("Thay đổi chưa lưu trước khi bấm Forward.");
    await expect(page.locator("[data-resume-save-status]")).toHaveAttribute("data-resume-save-status", "dirty");
    await page.goForward();
    const forwardDialog = page.getByRole("alertdialog");
    await expect(forwardDialog).toHaveCount(1);
    await forwardDialog.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
    expect(page.url()).toContain("/resume/cv-1");
    await expect(bioForForward).toContainText("Thay đổi chưa lưu trước khi bấm Forward.");

    await page.goForward();
    await expect(page.getByRole("alertdialog")).toHaveCount(1);
    await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });

    // 4. Mất quyền / đổi vai trò (admin hoặc chưa đăng nhập) không bao giờ bị ConfirmPopUp giữ kẹt
    holdAutosave.resolve();
    gateSaves = false;
    mocks.setUser({ ...user, role: "admin" });
    await page.goto("/resume/cv-1");
    await page.waitForURL(/\/admin/, { timeout: 10_000 });
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    mocks.setUser(null);
    await page.goto("/resume/cv-1");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("tạo/lưu CV nhận HTTP 200 thiếu resume._id, JSON hỏng hoặc sai ID: không báo đã lưu giả, giữ dữ liệu và lưu lại thành công", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    let nextCreateMode = "missing-id";
    let wrongUpdateOnce = true;

    const mocks = await mockAutosaveEditor(page, {
      resumes: [],
      onPostResume: async ({ route, payload }) => {
        if (!payload._id) {
          if (nextCreateMode === "missing-id") {
            nextCreateMode = "malformed-json";
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({}),
            });
            return true;
          }
          if (nextCreateMode === "malformed-json") {
            nextCreateMode = "ok";
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: '{"resume":{"_id":',
            });
            return true;
          }
          return false;
        }

        if (wrongUpdateOnce) {
          wrongUpdateOnce = false;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              resume: { ...payload, _id: "wrong-other-cv-id" },
            }),
          });
          return true;
        }

        return false;
      },
    });

    await page.goto("/resume");
    const titleInput = page.getByRole("textbox", { name: "Tên CV", exact: true });
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await titleInput.fill("CV Phản Hồi Mơ Hồ");
    await bioEditor.click();
    await bioEditor.fill("Dữ liệu quan trọng không được mất.");

    // 1. HTTP 200 {} thiếu resume._id
    await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(1);
    const saveStatus = page.locator("[data-resume-save-status]");
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("[data-resume-save-error]")).toContainText("Thư viện CV");
    await expect(saveStatus.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible();
    await expect(page.getByText("Lưu CV thành công!")).toHaveCount(0);
    expect(page.url()).toMatch(/\/resume$/);
    await expect(titleInput).toHaveValue("CV Phản Hồi Mơ Hồ");
    await expect(bioEditor).toContainText("Dữ liệu quan trọng không được mất.");

    // Không tự động retry cho tạo mới
    await page.waitForTimeout(1500);
    expect(mocks.postRequests).toHaveLength(1);

    // 2. Retry nhận 200 với JSON hỏng -> vẫn không báo Đã lưu
    await saveStatus.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(2);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("[data-resume-save-error]")).toBeVisible();
    await expect(page.getByText("Lưu CV thành công!")).toHaveCount(0);
    expect(page.url()).toMatch(/\/resume$/);

    // 3. Lần lưu hợp lệ gán ID giả lập -> promote thành công
    await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-created-1$/, { timeout: 10_000 });
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");

    // 4. Update nhận 200 nhưng sai _id -> phải báo lỗi và thử lại hợp lệ mới saved
    await bioEditor.click();
    await bioEditor.fill("Bản cập nhật sai ID trả về.");
    await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(4);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("[data-resume-save-error]")).toBeVisible();

    await saveStatus.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(5);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");
  });

  test("tạo CV mới chậm thất bại sau khi người dùng sửa tiếp: giữ bản mới nhất, hiện lỗi và xóa lỗi trùng tên cũ nếu đã đổi tên", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const firstBarrier = createBarrier();
    const secondBarrier = createBarrier();

    const mocks = await mockAutosaveEditor(page, {
      resumes: [],
      onPostResume: async ({ route, index }) => {
        if (index === 1) {
          await firstBarrier.promise;
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              code: "DUPLICATE_RESUME_TITLE",
              message: "Tên CV đã tồn tại",
            }),
          });
          return true;
        }
        if (index === 2) {
          await secondBarrier.promise;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Lỗi máy chủ khi tạo CV" }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/resume");
    const titleInput = page.getByRole("textbox", { name: "Tên CV", exact: true });
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    await titleInput.fill("CV Trùng Tên Cũ");
    await bioEditor.click();
    await bioEditor.fill("Nội dung tạo lần 1.");

    await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(1);

    // Đổi sang tên mới + nội dung mới khi request tạo #1 vẫn đang chạy
    await titleInput.fill("CV Đã Đổi Tên Mới");
    await bioEditor.click();
    await bioEditor.fill("Nội dung mới nhất sau đổi tên.");

    firstBarrier.resolve();

    const saveStatus = page.locator("[data-resume-save-status]");
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("#resume-title-error")).toHaveCount(0);
    await expect(page.locator("[data-resume-save-error]")).toBeVisible();
    await expect(titleInput).toHaveValue("CV Đã Đổi Tên Mới");
    await expect(bioEditor).toContainText("Nội dung mới nhất sau đổi tên.");

    // Không tự động tạo lại
    await page.waitForTimeout(1500);
    expect(mocks.postRequests).toHaveLength(1);

    // Bấm Lưu CV lần 2 -> sửa bio tiếp khi request #2 đang chạy -> nhận 500
    await page.getByRole("button", { name: "Lưu CV", exact: true }).click();
    await expect.poll(() => mocks.postRequests.length).toBe(2);
    expect(mocks.postRequests[1].payload.title).toBe("CV Đã Đổi Tên Mới");

    await bioEditor.click();
    await bioEditor.fill("Nội dung V3 sau lỗi 500.");
    secondBarrier.resolve();

    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("[data-resume-save-error]")).toBeVisible();
    await expect(bioEditor).toContainText("Nội dung V3 sau lỗi 500.");
    await page.waitForTimeout(1500);
    expect(mocks.postRequests).toHaveLength(2);

    // Bấm Thử lại -> gửi bản V3 mới nhất và tạo thành công
    await saveStatus.getByRole("button", { name: "Thử lại", exact: true }).click();
    await page.waitForURL(/\/resume\/cv-created-1$/, { timeout: 10_000 });
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");
    expect(mocks.postRequests[2].payload.bio).toContain("Nội dung V3 sau lỗi 500.");
  });

  test("lỗi 500 tạm thời ở trạng thái retrying khi mở hộp thoại rời trang: giữ im sau ConfirmPopUp, Hủy bỏ thì tiếp tục retry và không kẹt retrying", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const call1Barrier = createBarrier();
    let scenario = "pause-while-saving-then-recover";

    const mocks = await mockAutosaveEditor(page, {
      onPostResume: async ({ route, index }) => {
        if (scenario === "pause-while-saving-then-recover" && index === 1) {
          await call1Barrier.promise;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Lỗi 500 khi đang mở modal" }),
          });
          return true;
        }
        if (scenario === "retry-fails-to-failed") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Lỗi 500 liên tiếp" }),
          });
          return true;
        }
        if (scenario === "leave-from-retrying" && index >= 5) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Lỗi 500 trước khi rời trang" }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/resume/cv-1");
    const bioEditor = page.locator("[data-resume-editor-panel]").first().locator("[contenteditable=true]").first();
    const saveStatus = page.locator("[data-resume-save-status]");
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "idle");

    // 1. Autosave đang saving -> mở ConfirmPopUp -> response 500 về -> vào retrying nhưng KHÔNG bắn ngầm
    await bioEditor.click();
    await bioEditor.fill("Bản chỉnh sửa gặp 500 trong ConfirmPopUp.");
    await expect.poll(() => mocks.postRequests.length).toBe(1);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saving");

    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toHaveCount(1);

    call1Barrier.resolve();
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "retrying");
    await page.waitForTimeout(2400);
    expect(mocks.postRequests).toHaveLength(1);

    // Chọn Hủy bỏ -> tiếp tục retry còn lại và lưu thành công
    await dialog.getByRole("button", { name: "Hủy bỏ", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(2);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");

    // 2. Đang retrying -> mở hộp thoại tạm dừng -> Hủy bỏ -> retry #1 lại 500 -> chốt failed trung thực
    scenario = "retry-fails-to-failed";
    await bioEditor.click();
    await bioEditor.fill("Bản chỉnh sửa thử lại vẫn lỗi 500.");
    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(3);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "retrying");

    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(1);
    await page.waitForTimeout(600);
    await page.getByRole("alertdialog").getByRole("button", { name: "Hủy bỏ", exact: true }).click();

    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(4);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "failed");
    await expect(page.locator("[data-resume-save-error]")).toBeVisible();

    // 3. Rời trang dứt khoát từ trạng thái retrying -> không bao giờ phục sinh retry timer
    scenario = "leave-from-retrying";
    await bioEditor.click();
    await bioEditor.fill("Bản chỉnh sửa cuối rồi rời trang.");
    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(5);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "retrying");

    await page.getByRole("button", { name: "Thư viện", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });
    await page.waitForTimeout(2300);
    expect(mocks.postRequests).toHaveLength(5);
  });
});

test.describe("BL-09: AI điền CV xem trước, chọn lọc, xác nhận và hủy an toàn", () => {
  test("không ghi đè hồ sơ hay lịch sử khi chưa xác nhận, giữ vai trò đã nhập khi lỗi và chỉ thử lại thủ công", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const blankResume = {
      _id: "cv-blank",
      title: "CV mới của tôi",
      selectedTemplate: "modern",
      image: "data:image/png;base64,FAKEAVATAR",
      personalInfo: {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
      },
      bio: "<p></p>",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };
    const profileUser = {
      _id: "cand-profile",
      username: "cand",
      fullName: "Nguyễn Minh Anh",
      email: "candidate@example.test",
      phoneNumber: "0912345678",
      address: "Quận 1, TP.HCM",
      role: "employee",
      experiences: [],
      educations: [],
    };

    const mocks = await mockAutosaveEditor(page, {
      currentUser: profileUser,
      resumes: [blankResume],
      onAiFill: async ({ route, index }) => {
        if (index === 1) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Máy chủ AI đang quá tải" }),
          });
          return true;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              targetRole: "Backend Engineer",
              bio: "Kỹ sư hệ thống tập trung vào Node.js và API hiệu năng cao.",
              skills: [{ title: "Node.js", description: "API", performance: "Tốt" }],
              experiences: [],
              education: [],
            },
          }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-blank");
    const cvPreview = page.locator(".cv-wrapper");
    const undoButton = page.getByRole("button", { name: "Hoàn tác CV", exact: true });
    await expect(undoButton).toBeDisabled();
    await expect(cvPreview).not.toContainText("Nguyễn Minh Anh");

    // 1. Mở AI điền CV khi thiếu career context -> hiện prompt nhập vị trí, KHÔNG tự copy hồ sơ vào CV
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const promptDialog = page.getByRole("dialog", { name: "AI điền CV" });
    await expect(promptDialog).toBeVisible();
    expect(mocks.aiFillRequests).toHaveLength(0);
    await expect(cvPreview).not.toContainText("Nguyễn Minh Anh");

    // Nhấn Escape để hủy -> CV, history và autosave đều nguyên vẹn
    await page.keyboard.press("Escape");
    await expect(promptDialog).toHaveCount(0);
    await expect(cvPreview).not.toContainText("Nguyễn Minh Anh");
    await expect(undoButton).toBeDisabled();
    expect(mocks.postRequests).toHaveLength(0);

    // 2. Mở lại -> submit rỗng bị chặn -> nhập role -> lỗi 500 giữ nguyên role & không auto-retry
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    await promptDialog.getByRole("button", { name: "Bắt đầu điền", exact: true }).click();
    await expect(promptDialog.getByRole("alert")).toContainText("Hãy nhập vị trí mong muốn.");
    expect(mocks.aiFillRequests).toHaveLength(0);

    await promptDialog.getByLabel("Vị trí mong muốn").fill("Backend Engineer");
    await promptDialog.getByRole("button", { name: "Bắt đầu điền", exact: true }).click();

    await expect(promptDialog.getByRole("alert")).toContainText("Máy chủ AI đang quá tải");
    await expect(promptDialog).toContainText("Backend Engineer");
    await page.waitForTimeout(700);
    expect(mocks.aiFillRequests).toHaveLength(1);

    // Kiểm tra PII tối thiểu gửi lên API
    const sentContext = mocks.aiFillRequests[0].payload.resumeContext;
    expect(sentContext.personalInfo.jobTitle).toBe("Backend Engineer");
    expect(sentContext.personalInfo.email).toBeUndefined();
    expect(sentContext.personalInfo.phone).toBeUndefined();
    expect(sentContext.personalInfo.fullName).toBeUndefined();
    expect(sentContext.image).toBeUndefined();
    expect(sentContext._id).toBeUndefined();

    // 3. Bấm Thử lại thủ công -> mở preview phân biệt nguồn, hủy không ghi đè CV
    await promptDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    const previewDialog = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
    await expect(previewDialog).toBeVisible();
    expect(mocks.aiFillRequests).toHaveLength(2);
    await expect(previewDialog).toContainText("Từ hồ sơ tài khoản");
    await expect(previewDialog).toContainText("Từ vị trí bạn nhập");
    await expect(previewDialog).toContainText("AI đề xuất");
    await expect(previewDialog.getByRole("checkbox", { name: "Thông tin cá nhân: Họ và tên" })).toBeChecked();
    await expect(previewDialog.getByRole("checkbox", { name: "Kỹ năng: Node.js" })).not.toBeChecked();
    await expect(cvPreview).not.toContainText("Nguyễn Minh Anh");

    await previewDialog.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(previewDialog).toHaveCount(0);
    await expect(cvPreview).not.toContainText("Nguyễn Minh Anh");
    await expect(undoButton).toBeDisabled();
    expect(mocks.postRequests).toHaveLength(0);
  });

  test("chọn lọc một phần, không mặc định chọn mục AI chưa có nguồn, autosave sau xác nhận và giữ trạng thái trống trung thực", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const existingExperience = {
      id: "exp-user-1",
      title: "QA Engineer",
      company: "VN QA",
      location: "",
      startDate: "",
      endDate: "",
      description: "<p>Kiểm thử hồi quy sản phẩm web.</p>",
    };
    const cvPersisted = {
      _id: "cv-persisted",
      title: "CV QA",
      selectedTemplate: "modern",
      image: "",
      personalInfo: {
        fullName: "Nguyễn Minh Anh",
        jobTitle: "QA Engineer",
        email: "candidate@example.test",
      },
      bio: "",
      experience: [existingExperience],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };

    let aiMode = "proposals";
    const mocks = await mockAutosaveEditor(page, {
      resumes: [cvPersisted],
      onAiFill: async ({ route }) => {
        if (aiMode === "empty") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              result: {
                bio: "Đoạn bio bị bỏ qua vì CV đã có tiểu sử",
                skills: [],
                experiences: [],
                education: [],
              },
            }),
          });
          return true;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              targetRole: "",
              bio: "Kỹ sư kiểm thử tự động với nền tảng JavaScript.",
              skills: [{ title: "Playwright" }, { title: "Cypress" }],
              experiences: [
                {
                  title: "Staff QA Architect",
                  company: "Fake Corp",
                  startDate: "2020-01",
                  endDate: "2024-01",
                  description: "Bịa đặt kinh nghiệm chưa xác nhận.",
                },
              ],
              education: [
                {
                  title: "Thạc sĩ KHMT",
                  company: "Đại học Bịa",
                  score: "4.0",
                  startDate: "2018-09",
                  endDate: "2020-06",
                  description: "",
                },
              ],
              awards: [
                {
                  title: "Giải Nhất Quốc Gia",
                  awarder: "Tổ chức Bịa",
                  date: "2024",
                  description: "",
                },
              ],
            },
          }),
        });
        return true;
      },
    });

    // A. CV chưa lưu (/resume): xác nhận chỉ chọn kỹ năng Playwright và KHÔNG kích hoạt autosave
    await page.goto("/resume");
    await page.getByLabel("Tên CV", { exact: true }).fill("CV QA Nháp");
    await page.getByPlaceholder("Frontend Developer").fill("QA Engineer");
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const previewNew = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
    await expect(previewNew).toBeVisible();
    await expect(previewNew.getByRole("checkbox", { name: "Kỹ năng: Playwright" })).not.toBeChecked();
    await expect(previewNew.getByRole("checkbox", { name: "Kinh nghiệm làm việc: Staff QA Architect" })).not.toBeChecked();
    await expect(previewNew.getByRole("checkbox", { name: "Học vấn: Thạc sĩ KHMT" })).not.toBeChecked();
    await expect(previewNew.getByRole("checkbox", { name: "Giải thưởng: Giải Nhất Quốc Gia" })).not.toBeChecked();

    await previewNew.getByRole("checkbox", { name: "Kỹ năng: Playwright" }).check();
    await previewNew.getByRole("button", { name: "Áp dụng mục đã chọn", exact: true }).click();
    await expect(previewNew).toHaveCount(0);
    await expect(page.locator(".cv-wrapper")).toContainText("Playwright");
    await expect(page.locator(".cv-wrapper")).not.toContainText("Staff QA Architect");
    await expect(page.locator(".cv-wrapper")).not.toContainText("Giải Nhất Quốc Gia");
    await page.waitForTimeout(1500);
    expect(mocks.postRequests).toHaveLength(0);

    // B. CV đã lưu (/resume/cv-persisted): mọi văn bản AI tự soạn mặc định không chọn cho tới khi người dùng rà soát và bật lại
    await page.goto("/resume/cv-persisted");
    const saveStatus = page.locator("[data-resume-save-status]");
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "idle");
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const previewSaved = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
    await expect(previewSaved).toBeVisible();
    const bioCheckbox = previewSaved.getByRole("checkbox", { name: /Giới thiệu bản thân/ });
    const applyButton = previewSaved.getByRole("button", { name: "Áp dụng mục đã chọn", exact: true });
    await expect(bioCheckbox).not.toBeChecked();
    await expect(previewSaved).toContainText("Cần xác nhận");
    await expect(applyButton).toBeDisabled();
    await previewSaved.getByRole("button", { name: "Chọn mục an toàn (0)", exact: true }).click();
    await expect(bioCheckbox).not.toBeChecked();
    await expect(applyButton).toBeDisabled();

    await bioCheckbox.check();
    await expect(previewSaved).toContainText("Đang chọn 1 mục do AI tự soạn");
    await expect(applyButton).toBeEnabled();
    await applyButton.click();
    await expect(page.locator(".cv-wrapper")).toContainText("Kỹ sư kiểm thử tự động với nền tảng JavaScript.");
    await expect(page.locator(".cv-wrapper")).toContainText("Kiểm thử hồi quy sản phẩm web.");
    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(1);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");

    // C. Phản hồi 200 không có đề xuất mới: hiển thị trạng thái trống trung thực, không tạo lịch sử/autosave
    aiMode = "empty";
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const emptyDialog = page.getByRole("dialog", { name: "AI điền CV" });
    await expect(emptyDialog).toContainText("Chưa có đề xuất mới cần áp dụng");
    await expect(emptyDialog.getByRole("button", { name: "Áp dụng mục đã chọn" })).toHaveCount(0);
    await emptyDialog.getByRole("button", { name: "Đóng", exact: true }).first().click();
    await page.waitForTimeout(600);
    expect(mocks.postRequests).toHaveLength(1);
  });

  test("hủy request đang chạy hoặc điều hướng rời trang sẽ hủy và vô hiệu hóa phản hồi đến muộn", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const cv1 = {
      _id: "cv-1",
      title: "CV Thứ Nhất",
      selectedTemplate: "modern",
      image: "",
      personalInfo: { fullName: "Nguyễn Minh Anh", jobTitle: "Frontend Developer" },
      bio: "",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };
    const barrier1 = createBarrier();
    const barrier2 = createBarrier();

    const mocks = await mockAutosaveEditor(page, {
      resumes: [cv1],
      onAiFill: async ({ route, index }) => {
        if (index === 1) {
          await barrier1.promise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              result: {
                bio: "LATE_BIO_FROM_CANCELLED_CALL",
                skills: [{ title: "LateCancelledSkill" }],
              },
            }),
          });
          return true;
        }
        if (index === 2) {
          await barrier2.promise;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "LATE_ERROR_AFTER_LEAVE" }),
          });
          return true;
        }
        return false;
      },
    });

    await page.goto("/ResumeSelection");
    await page.goto("/resume/cv-1");
    await expect(page.locator(".cv-wrapper")).toBeVisible();

    // 1. Đang loading AI -> bấm Hủy -> response muộn về KHÔNG mở lại dialog và KHÔNG chạm CV
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const loadingDialog = page.getByRole("dialog", { name: "AI điền CV" });
    await expect(loadingDialog).toContainText("Đang tạo đề xuất nội dung cho CV");
    await loadingDialog.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(loadingDialog).toHaveCount(0);

    barrier1.resolve();
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".cv-wrapper")).not.toContainText("LATE_BIO_FROM_CANCELLED_CALL");
    expect(mocks.postRequests).toHaveLength(0);

    // 2. Đang loading AI -> Back rời về /ResumeSelection -> lỗi 500 muộn về không báo lỗi hay bật dialog
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "AI điền CV" })).toContainText(
      "Đang tạo đề xuất nội dung cho CV",
    );
    await page.goBack();
    await page.waitForURL(/\/ResumeSelection$/, { timeout: 10_000 });

    barrier2.resolve();
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("LATE_ERROR_AFTER_LEAVE");
  });

  test("giữ nguyên văn bản kỹ thuật DOMParser hiện có, không chọn văn bản AI thiếu nguồn và chỉ autosave mục an toàn", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const cvDom = {
      _id: "cv-dom",
      title: "CV DOMParser",
      selectedTemplate: "modern",
      image: "",
      personalInfo: {
        fullName: "",
        jobTitle: "Developer",
        email: "candidate@example.test",
      },
      bio: "<p>Tối ưu xử lý XML bằng DOMParser.</p>",
      experience: [
        {
          id: "orig",
          title: "Developer",
          company: "Example",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };

    const mocks = await mockAutosaveEditor(page, {
      currentUser: { ...user, fullName: "Nguyễn Minh Anh" },
      resumes: [cvDom],
      onAiFill: async ({ route }) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              bio: "Bio AI không được phép thay thế DOMParser.",
              skills: [],
              experiences: [
                {
                  title: "Developer",
                  company: "Example",
                  description: "Từng phụ trách kiểm toán và quản lý nhóm kỹ thuật.",
                },
                {
                  title: "Developer",
                  company: "",
                  description: "Đề xuất thiếu công ty không được ghép nhầm.",
                },
              ],
              education: [],
            },
          }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-dom");
    const saveStatus = page.locator("[data-resume-save-status]");
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "idle");

    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const preview = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
    await expect(preview).toBeVisible();

    // Văn bản DOMParser hiện có không bị coi là rỗng hay đề xuất thay thế; AI thiếu công ty không ghép vào Example
    await expect(preview).not.toContainText("Bio AI không được phép thay thế DOMParser.");

    // Chỉ mục từ hồ sơ được chọn mặc định; mô tả AI không chứa số và mục mới thiếu công ty đều phải opt-in
    const profileNameCheckbox = preview.getByRole("checkbox", { name: "Thông tin cá nhân: Họ và tên" });
    const aiExpDescCheckbox = preview.getByRole("checkbox", { name: /^Kinh nghiệm làm việc: Developer.*Mô tả$/ });
    const aiNewItemCheckbox = preview.getByRole("checkbox", { name: "Kinh nghiệm làm việc: Developer", exact: true });
    await expect(profileNameCheckbox).toBeChecked();
    await expect(aiExpDescCheckbox).not.toBeChecked();
    await expect(aiNewItemCheckbox).not.toBeChecked();
    await expect(preview).toContainText("Cần xác nhận");
    await expect(preview.getByRole("button", { name: "Chọn tất cả (gồm mục cần xác nhận)", exact: true })).toBeVisible();

    await preview.getByRole("button", { name: "Chọn mục an toàn (1)", exact: true }).click();
    await expect(profileNameCheckbox).toBeChecked();
    await expect(aiExpDescCheckbox).not.toBeChecked();
    await expect(aiNewItemCheckbox).not.toBeChecked();

    await preview.getByRole("button", { name: "Áp dụng mục đã chọn", exact: true }).click();
    await expect(preview).toHaveCount(0);
    await expect(page.locator(".cv-wrapper")).toContainText("Nguyễn Minh Anh");
    await expect(page.locator(".cv-wrapper")).toContainText("Tối ưu xử lý XML bằng DOMParser.");
    await expect(page.locator(".cv-wrapper")).not.toContainText("Từng phụ trách kiểm toán và quản lý nhóm kỹ thuật.");

    await expect.poll(() => mocks.postRequests.length, { timeout: 5_000 }).toBe(1);
    await expect(saveStatus).toHaveAttribute("data-resume-save-status", "saved");
    expect(mocks.postRequests[0].payload.personalInfo.fullName).toBe("Nguyễn Minh Anh");
    expect(mocks.postRequests[0].payload.bio).toBe("<p>Tối ưu xử lý XML bằng DOMParser.</p>");
    expect(mocks.postRequests[0].payload.experience[0].description).toBe("");
  });

  test("phát hiện phản hồi HTTP 200 sai định dạng, giữ nguyên vị trí đã nhập để thử lại thủ công và phân biệt với kết quả rỗng hợp lệ", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const cvBlankBad = {
      _id: "cv-blank-bad",
      title: "CV Nhập Tay",
      selectedTemplate: "modern",
      image: "",
      personalInfo: { fullName: "", jobTitle: "", email: "candidate@example.test" },
      bio: "<p></p>",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };
    const cvHasRole = {
      _id: "cv-has-role",
      title: "CV Đã Có Role",
      selectedTemplate: "modern",
      image: "",
      personalInfo: {
        fullName: "Nguyễn Minh Anh",
        jobTitle: "Platform Engineer",
        email: "candidate@example.test",
      },
      bio: "<p>Kỹ sư hạ tầng cloud.</p>",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
      profile: [],
      customSections: [],
    };

    const mocks = await mockAutosaveEditor(page, {
      currentUser: { ...user, fullName: "" },
      resumes: [cvBlankBad, cvHasRole],
      onAiFill: async ({ route, index }) => {
        if (index === 1) {
          await route.fulfill({ status: 200, contentType: "text/html", body: "<html>Bad Gateway</html>" });
          return true;
        }
        if (index === 2) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ result: [] }),
          });
          return true;
        }
        if (index === 3) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ wrong: true }),
          });
          return true;
        }
        if (index === 4) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              result: {
                bio: "Kỹ sư hạ tầng cloud và tự động hóa.",
                skills: [],
                experiences: [],
                education: [],
              },
            }),
          });
          return true;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ result: {} }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-blank-bad");
    const undoButton = page.getByRole("button", { name: "Hoàn tác CV", exact: true });
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "AI điền CV" });
    await dialog.getByLabel("Vị trí mong muốn").fill("Platform Engineer");
    await dialog.getByRole("button", { name: "Bắt đầu điền", exact: true }).click();

    // Call 1: HTTP 200 HTML -> error rõ ràng, giữ role, không auto-retry, không mutate CV/autosave
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog).not.toContainText("Chưa có đề xuất mới cần áp dụng");
    await expect(dialog).toContainText("Platform Engineer");
    await page.waitForTimeout(600);
    expect(mocks.aiFillRequests).toHaveLength(1);
    await expect(page.locator(".cv-wrapper")).not.toContainText("Platform Engineer");
    expect(mocks.postRequests).toHaveLength(0);

    // Call 2: HTTP 200 { result: [] } -> vẫn vào error, không bị hiểu nhầm là trạng thái rỗng
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog).not.toContainText("Chưa có đề xuất mới cần áp dụng");
    await expect(dialog).toContainText("Platform Engineer");
    await page.waitForTimeout(600);
    expect(mocks.aiFillRequests).toHaveLength(2);
    expect(mocks.postRequests).toHaveLength(0);

    // Call 3: HTTP 200 { wrong: true } -> vẫn vào error
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog).toContainText("Platform Engineer");
    expect(mocks.aiFillRequests).toHaveLength(3);
    expect(mocks.postRequests).toHaveLength(0);

    // Call 4: Thử lại thủ công với payload hợp lệ -> vào preview bình thường, hủy giữ nguyên history rỗng
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    const preview = page.getByRole("dialog", { name: "Xem trước đề xuất điền CV" });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("checkbox", { name: "Thông tin cá nhân: Vị trí ứng tuyển" })).toBeChecked();
    await expect(preview.getByRole("checkbox", { name: /Giới thiệu bản thân/ })).not.toBeChecked();
    await preview.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(preview).toHaveCount(0);
    await expect(undoButton).toBeDisabled();
    expect(mocks.postRequests).toHaveLength(0);

    // Call 5: CV đã có role nhận HTTP 200 { result: {} } -> hiển thị trạng thái rỗng trung thực
    await page.goto("/resume/cv-has-role");
    await page.getByRole("button", { name: "AI điền CV", exact: true }).click();
    const emptyDialog = page.getByRole("dialog", { name: "AI điền CV" });
    await expect(emptyDialog).toContainText("Chưa có đề xuất mới cần áp dụng");
    await expect(emptyDialog.getByRole("alert")).toHaveCount(0);
    expect(mocks.postRequests).toHaveLength(0);
  });
});

test.describe("BL-10: AI Review CV kết nối chỉnh sửa thủ công và vòng đời an toàn", () => {
  test("Desktop: nhảy đúng mục từ góp ý/mục còn thiếu, không tự sửa CV, giữ cache phiên, cảnh báo bản review cũ và cập nhật khi Review lại", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    let resolveDeferredCall1;
    const deferredCall1 = new Promise((resolve) => {
      resolveDeferredCall1 = resolve;
    });

    const mocks = await mockAutosaveEditor(page, {
      resumes: [
        {
          _id: "cv-1",
          title: "CV Backend Số 1",
          selectedTemplate: "modern",
          personalInfo: {
            fullName: "Nguyễn Văn A",
            jobTitle: "Backend Developer",
            email: "a@example.com",
            phone: "0901234567",
            location: "Hà Nội",
          },
          bio: "<p>Lập trình viên Node.js</p>",
          experience: [
            {
              id: "exp-1",
              title: "Backend Developer",
              company: "FPT Software",
              location: "Hà Nội",
              startDate: "01/2023",
              endDate: "Hiện tại",
              description: "<p>Phát triển hệ thống API.</p>",
            },
          ],
          education: [],
          skill: [{ id: "sk-1", title: "Node.js" }],
          language: [],
          certificate: [],
          project: [],
          award: [],
          hobby: [],
          customSections: [],
        },
      ],
      onAiReview: async ({ route, index }) => {
        if (index === 1) {
          await deferredCall1;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              result: {
                overallScore: 76,
                summary: "Cần bổ sung số liệu kinh nghiệm và mở rộng phần tiểu sử.",
                categories: {
                  content: 78,
                  clarity: 74,
                  impact: 68,
                  completeness: 75,
                  ats: 85,
                },
                strengths: ["Kinh nghiệm Backend rõ ràng"],
                improvements: [
                  {
                    section: "Tiểu sử",
                    issue: "Phần tiểu sử còn ngắn gọn.",
                    fix: "Bổ sung số năm kinh nghiệm và thế mạnh chính.",
                    priority: "high",
                  },
                  {
                    section: "Kinh nghiệm",
                    issue: "Thiếu số liệu đo lường hiệu năng.",
                    fix: "Thêm tỷ lệ cải thiện thời gian phản hồi API.",
                    priority: "medium",
                  },
                  {
                    section: "Bố cục và ATS",
                    issue: "Nên đưa Kinh nghiệm lên trước Học vấn.",
                    fix: "Sắp xếp lại thứ tự khối trong bố cục CV.",
                    priority: "low",
                  },
                  {
                    section: "Khác",
                    issue: "Kiểm tra lại độ dài câu văn chung.",
                    fix: "Giữ mỗi gạch đầu dòng súc tích trong 1–2 dòng.",
                    priority: "low",
                  },
                  {
                    section: "Mục tùy biến Lạ",
                    issue: "Lưu ý tham khảo riêng ngoài danh mục chuẩn.",
                    fix: "Xem lại khi cần.",
                    priority: "low",
                  },
                ],
                missingSections: ["Chứng chỉ", "Mục thiếu không rõ"],
              },
            }),
          });
          return true;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              overallScore: 88,
              summary: "Phiên bản CV mới đã rõ ràng và thuyết phục hơn.",
              categories: {
                content: 88,
                clarity: 87,
                impact: 85,
                completeness: 89,
                ats: 90,
              },
              strengths: ["Tiểu sử nêu bật định hướng và kinh nghiệm"],
              improvements: [],
              missingSections: [],
            },
          }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-1");
    const undoButton = page.getByRole("button", { name: "Hoàn tác CV", exact: true });
    const bioSection = page.locator('[data-resume-section="bio"]');
    const bioEditor = bioSection.locator('[contenteditable="true"]').first();
    await expect(bioEditor).toContainText("Lập trình viên Node.js");

    // Trigger review và kiểm tra loading state trước khi resolve
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    const reviewDialog = page.getByRole("dialog", { name: "Review toàn bộ CV" });
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog).toContainText("Đang phân tích CV...");

    resolveDeferredCall1();
    await expect(reviewDialog).toContainText("76");
    await expect(reviewDialog).toContainText("Điểm tốt");
    await expect(reviewDialog).toContainText("Điểm cần sửa và cách sửa");

    // Mục không map hoặc "Khác" không có nút nhảy mục
    const otherImprovement = reviewDialog.locator('[data-review-improvement][data-review-section="Khác"]');
    await expect(otherImprovement).toContainText("Tham khảo chung");
    await expect(otherImprovement.getByRole("button", { name: "Mở mục để sửa" })).toHaveCount(0);

    const customUnknownImprovement = reviewDialog.locator('[data-review-improvement][data-review-section="Mục tùy biến Lạ"]');
    await expect(customUnknownImprovement.getByRole("button", { name: "Mở mục để sửa" })).toHaveCount(0);

    const unknownMissing = reviewDialog.locator('[data-review-missing-section][data-review-section="Mục thiếu không rõ"]');
    await expect(unknownMissing).toBeVisible();
    await expect(unknownMissing.getByRole("button", { name: /Mở mục để sửa/ })).toHaveCount(0);

    // Click "Mở mục để sửa" trên "Tiểu sử" -> đóng modal, focus vào trình soạn thảo Tiểu sử, không tự sửa CV / undo / POST
    const bioImprovement = reviewDialog.locator('[data-review-improvement][data-review-section="Tiểu sử"]');
    await bioImprovement.getByRole("button", { name: "Mở mục để sửa" }).click();

    await expect(reviewDialog).toHaveCount(0);
    await expect(bioEditor).toBeFocused();
    await expect(bioEditor).toContainText("Lập trình viên Node.js");
    await expect(undoButton).toBeDisabled();
    expect(mocks.postRequests).toHaveLength(0);

    // Chỉnh sửa thủ công Tiểu sử -> undo bật lên, CV phản ánh nội dung mới
    await bioEditor.click();
    await page.keyboard.type(" 3 năm");
    await expect(undoButton).toBeEnabled();

    // Mở lại Review toàn bộ CV -> dùng kết quả cache trong phiên (0 call mới) + hiển thị banner bản review cũ
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    await expect(reviewDialog).toBeVisible();
    expect(mocks.aiReviewRequests).toHaveLength(1);
    await expect(reviewDialog.locator("[data-review-stale-banner]")).toBeVisible();
    await expect(reviewDialog).toContainText("Bản review cũ");

    // Nhảy tới mục danh sách đã có item ("Kinh nghiệm") -> focus tiêu đề mục, không tự mở modal sửa item
    const expImprovement = reviewDialog.locator('[data-review-improvement][data-review-section="Kinh nghiệm"]');
    await expImprovement.getByRole("button", { name: "Mở mục để sửa" }).click();
    await expect(reviewDialog).toHaveCount(0);
    await expect(page.locator('[data-resume-section-heading="experience"]')).toBeFocused();
    await expect(page.getByText("Chỉnh Sửa Kinh Nghiệm")).toHaveCount(0);

    // Mở lại cache và nhảy từ mục còn thiếu rỗng ("Chứng chỉ") -> focus nút Thêm chứng chỉ
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    await expect(reviewDialog).toBeVisible();
    expect(mocks.aiReviewRequests).toHaveLength(1);
    const certMissing = reviewDialog.locator('[data-review-missing-section][data-review-section="Chứng chỉ"]');
    await certMissing.getByRole("button", { name: /Mở mục để sửa/ }).click();
    await expect(reviewDialog).toHaveCount(0);
    await expect(page.locator('[data-resume-add-button="certificate"]')).toBeFocused();

    // Mở lại cache và nhảy tới "Bố cục và ATS" -> đóng modal review và mở dialog Sắp xếp bố cục CV
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    await expect(reviewDialog).toBeVisible();
    const layoutImprovement = reviewDialog.locator('[data-review-improvement][data-review-section="Bố cục và ATS"]');
    await layoutImprovement.getByRole("button", { name: "Mở mục để sửa" }).click();
    await expect(reviewDialog).toHaveCount(0);
    const layoutDialog = page.getByRole("dialog", { name: "Sắp xếp bố cục CV" });
    await expect(layoutDialog).toBeVisible();
    await layoutDialog.getByRole("button", { name: "Đóng bố cục CV", exact: true }).click();
    await expect(layoutDialog).toHaveCount(0);

    // Review lại chủ động -> gọi thêm 1 request, cập nhật điểm 88 và xóa banner cũ
    const reviewTrigger = page.getByRole("button", { name: "Review toàn bộ CV", exact: true });
    await reviewTrigger.click();
    await expect(reviewDialog).toBeVisible();
    await reviewDialog.getByRole("button", { name: "Review lại", exact: true }).click();
    expect(mocks.aiReviewRequests).toHaveLength(2);
    await expect(reviewDialog).toContainText("88");
    await expect(reviewDialog.locator("[data-review-stale-banner]")).toHaveCount(0);

    // Đóng bằng phím Escape -> đóng dialog và trả focus về nút kích hoạt
    await page.keyboard.press("Escape");
    await expect(reviewDialog).toHaveCount(0);
    await expect(reviewTrigger).toBeFocused();
  });

  test("Mobile (390x844): dialog review vừa khung nhìn cuộn được và nhảy đúng vùng chỉnh sửa", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mocks = await mockAutosaveEditor(page, {
      resumes: [
        {
          _id: "cv-mobile-review",
          title: "CV Mobile Review",
          selectedTemplate: "modern",
          personalInfo: {
            fullName: "Trần Thị B",
            jobTitle: "Product Designer",
            email: "b@example.com",
            phone: "0909888777",
            location: "TP.HCM",
          },
          bio: "<p>Thiết kế sản phẩm số.</p>",
          experience: [],
          education: [],
          skill: [],
          language: [],
          certificate: [],
          project: [],
          award: [],
          hobby: [],
          customSections: [],
        },
      ],
      onAiReview: async ({ route }) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              overallScore: 72,
              summary: "CV cần làm rõ phần tiểu sử và bổ sung dự án thực tế.",
              categories: {
                content: 74,
                clarity: 76,
                impact: 64,
                completeness: 68,
                ats: 78,
              },
              strengths: [
                "Thông tin liên hệ rõ ràng",
                "Định hướng nghề nghiệp mạch lạc",
              ],
              improvements: [
                {
                  section: "Tiểu sử",
                  issue: "Chưa nêu rõ công cụ thiết kế sử dụng.",
                  fix: "Thêm Figma, Design System và số sản phẩm đã triển khai.",
                  priority: "high",
                },
                {
                  section: "Kinh nghiệm",
                  issue: "Cần mô tả vai trò thiết kế chi tiết hơn.",
                  fix: "Ghi rõ quy trình nghiên cứu người dùng và kết quả.",
                  priority: "medium",
                },
                {
                  section: "Khác",
                  issue: "Gợi ý đọc lại chính tả trước khi xuất PDF.",
                  fix: "Kiểm tra dấu câu thống nhất.",
                  priority: "low",
                },
              ],
              missingSections: ["Dự án", "Kỹ năng"],
            },
          }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-mobile-review");
    const contentToggle = page.getByRole("button", { name: "Nội dung", exact: true });
    if ((await contentToggle.getAttribute("aria-pressed")) !== "true") {
      await contentToggle.click();
    }
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();

    const reviewDialog = page.getByRole("dialog", { name: "Review toàn bộ CV" });
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByRole("button", { name: "Đóng", exact: true })).toBeVisible();
    await expect(reviewDialog.getByRole("button", { name: "Review lại", exact: true })).toBeVisible();

    const dialogBox = await reviewDialog.boundingBox();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox.width).toBeLessThanOrEqual(390);
    expect(dialogBox.height).toBeLessThanOrEqual(844);

    // Nhảy từ review tới "Tiểu sử" trên mobile -> đảm bảo panel chỉnh sửa mở và con trỏ focus vào Tiểu sử
    const bioCard = reviewDialog.locator('[data-review-improvement][data-review-section="Tiểu sử"]');
    await bioCard.getByRole("button", { name: "Mở mục để sửa" }).click();

    await expect(reviewDialog).toHaveCount(0);
    const editorPanel = page.locator("[data-resume-editor-panel]").first();
    await expect(editorPanel).toBeVisible();
    const bioEditor = page.locator('[data-resume-section="bio"] [contenteditable="true"]').first();
    await expect(bioEditor).toBeFocused();
    expect(mocks.postRequests).toHaveLength(0);
  });

  test("Vòng đời an toàn: lỗi 500 không tự retry, payload sai bị chặn, hủy khi đóng và đổi CV xóa cache/bỏ qua response trễ", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const deferredPending = [];
    const abortedUrls = [];
    page.on("requestfailed", (req) => {
      if (new URL(req.url()).pathname === "/api/ai/resume/review") {
        abortedUrls.push(req.failure()?.errorText || "aborted");
      }
    });

    const mocks = await mockAutosaveEditor(page, {
      onAiReview: async ({ route, index }) => {
        if (index === 1) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Máy chủ AI đang quá tải" }),
          });
          return true;
        }
        if (index === 2) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ result: { overallScore: "khong-hop-le" } }),
          });
          return true;
        }
        if (index === 3) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ result: {} }),
          });
          return true;
        }
        if (index === 4) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              result: {
                overallScore: 84,
                summary: "",
                categories: {
                  content: 84,
                  clarity: 84,
                  impact: 84,
                  completeness: 84,
                  ats: 84,
                },
                strengths: [],
                improvements: [],
                missingSections: [],
              },
            }),
          });
          return true;
        }
        if (index === 5 || index === 6) {
          let resolveFn;
          const gate = new Promise((resolve) => {
            resolveFn = resolve;
          });
          deferredPending.push({ route, resolveFn, index });
          await gate;
          try {
            await route.fulfill({
              status: index === 6 ? 500 : 200,
              contentType: "application/json",
              body: JSON.stringify(
                index === 6
                  ? { message: "Lỗi trễ từ CV cũ" }
                  : {
                      result: {
                        overallScore: 91,
                        summary: "Phản hồi trễ đã bị bỏ qua",
                        categories: {
                          content: 91,
                          clarity: 91,
                          impact: 91,
                          completeness: 91,
                          ats: 91,
                        },
                        strengths: [],
                        improvements: [],
                        missingSections: [],
                      },
                    },
              ),
            });
          } catch {
            // Request đã bị abort phía trình duyệt
          }
          return true;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: {
              overallScore: 79,
              summary: "Đánh giá mới dành riêng cho CV Frontend Số 2.",
              categories: {
                content: 80,
                clarity: 79,
                impact: 78,
                completeness: 80,
                ats: 79,
              },
              strengths: ["Kinh nghiệm React rõ ràng"],
              improvements: [],
              missingSections: [],
            },
          }),
        });
        return true;
      },
    });

    await page.goto("/resume/cv-1");
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    const reviewDialog = page.getByRole("dialog", { name: "Review toàn bộ CV" });

    // Call 1: HTTP 500 -> alert + nút Thử lại, không auto-retry
    await expect(reviewDialog.getByRole("alert")).toContainText("Máy chủ AI đang quá tải");
    await page.waitForTimeout(500);
    expect(mocks.aiReviewRequests).toHaveLength(1);

    // Call 2 & 3: HTTP 200 payload sai cấu trúc -> chặn bằng alert, không crash hoặc render trống giả
    await reviewDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(reviewDialog.getByRole("alert")).toBeVisible();
    await expect(reviewDialog.locator("[data-review-empty-state]")).toHaveCount(0);
    expect(mocks.aiReviewRequests).toHaveLength(2);

    await reviewDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(reviewDialog.getByRole("alert")).toBeVisible();
    expect(mocks.aiReviewRequests).toHaveLength(3);

    // Call 4: payload hợp lệ nhưng rỗng -> hiển thị trạng thái rỗng trung thực
    await reviewDialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(reviewDialog).toContainText("84");
    await expect(reviewDialog.locator("[data-review-empty-state]")).toBeVisible();
    await expect(reviewDialog.getByRole("alert")).toHaveCount(0);

    // Call 5: đóng modal khi đang loading -> abort request & bỏ qua response trễ
    await reviewDialog.getByRole("button", { name: "Review lại", exact: true }).click();
    await expect(reviewDialog).toContainText("Đang phân tích CV...");
    await expect.poll(() => deferredPending.length).toBe(1);
    await reviewDialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(reviewDialog).toHaveCount(0);
    await expect.poll(() => abortedUrls.length).toBe(1);
    deferredPending[0].resolveFn();
    await page.waitForTimeout(150);
    await expect(reviewDialog).toHaveCount(0);

    // Call 6: mở lại cache -> bấm Review lại rồi chuyển sang cv-2 khi request cũ đang bay -> hủy, xóa cache cv-1, bỏ qua lỗi trễ trên cv-2
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    await expect(reviewDialog).toBeVisible();
    await reviewDialog.getByRole("button", { name: "Review lại", exact: true }).click();
    await expect.poll(() => deferredPending.length).toBe(2);

    await page.goto("/resume/cv-2");
    await expect(page.getByRole("textbox", { name: "Tên CV", exact: true })).toHaveValue("CV Frontend Số 2");
    deferredPending[1].resolveFn();
    await page.waitForTimeout(200);
    await expect(page.getByRole("dialog", { name: "Review toàn bộ CV" })).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

    // Bấm Review trên cv-2 phải gửi request mới cho cv-2 (không dùng lại cache cv-1)
    await page.getByRole("button", { name: "Review toàn bộ CV", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Review toàn bộ CV" })).toContainText(
      "Đánh giá mới dành riêng cho CV Frontend Số 2.",
    );
    expect(mocks.aiReviewRequests).toHaveLength(7);
    expect(mocks.aiReviewRequests[6].payload.resumeId).toBe("cv-2");
    expect(mocks.aiReviewRequests[6].payload.resumeContext.title).toBe("CV Frontend Số 2");
  });
});
