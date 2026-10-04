import { expect, test } from "@playwright/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { RESUME_TEMPLATE_KEYS, RESUME_TEMPLATES } from "../shared/resumeTemplates.js";

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
  await expect(page.locator(".cv-wrapper")).toContainText("AI summary");
  await page.getByRole("button", { name: "Hoàn tác CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).not.toContainText("AI summary");
  await page.getByRole("button", { name: "Làm lại CV", exact: true }).click();
  await expect(page.locator(".cv-wrapper")).toContainText("AI summary");
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
