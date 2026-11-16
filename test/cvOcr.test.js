import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWorker } from "tesseract.js";
import { buildPdfFromPages } from "../scripts/generate-ocr-fixtures.mjs";
import { IMPORTED_SKILL_GROUPS_ID } from "../shared/resumeCustomSections.js";
import { getTemplateLayout } from "../src/utils/resumeLayout.js";
import {
  validatePdfUploadInput,
  validatePdfHeaderBytes,
  validatePdfPageCount,
  computeBoundedRasterViewport,
  reconstructLinesFromPdfTextItems,
  evaluatePageTextSufficiency,
  stitchExtractedPages,
  mapExtractedTextToResumeDraft,
  sanitizeConfirmableResumePayload,
  CvOcrImportError,
  MAX_OCR_PDF_BYTES,
  MAX_OCR_PDF_PAGES,
  MAX_OCR_RASTER_LONG_EDGE_PX,
  MAX_OCR_RASTER_PIXELS_PER_PAGE,
} from "../shared/resumeOcrPolicy.js";
import {
  importResumeFromPdfBytes,
  createCvOcrJobManager,
  OCR_ENGINE_METADATA,
  withStepTimeout,
} from "../src/utils/cvPdfOcrImporter.js";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const qaFixturesDir = path.join(rootDir, "output/pdf/cv-ocr-qa");
const localCacheLangDir = path.join(rootDir, "node_modules/.cache/ocr-lang-data");

function ensureLocalLangData() {
  if (!fs.existsSync(localCacheLangDir)) {
    fs.mkdirSync(localCacheLangDir, { recursive: true });
  }
  const vieSrc = path.join(rootDir, "node_modules/@tesseract.js-data/vie/4.0.0_best_int/vie.traineddata.gz");
  const engSrc = path.join(rootDir, "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz");
  const vieDest = path.join(localCacheLangDir, "vie.traineddata.gz");
  const engDest = path.join(localCacheLangDir, "eng.traineddata.gz");

  if (!fs.existsSync(vieDest) && fs.existsSync(vieSrc)) {
    fs.copyFileSync(vieSrc, vieDest);
  }
  if (!fs.existsSync(engDest) && fs.existsSync(engSrc)) {
    fs.copyFileSync(engSrc, engDest);
  }
}

test("BL-07B OCR engine metadata reflects tesseract.js 7.0.0 Apache-2.0 vie+eng", () => {
  assert.equal(OCR_ENGINE_METADATA.engine, "tesseract.js");
  assert.equal(OCR_ENGINE_METADATA.version, "7.0.0");
  assert.equal(OCR_ENGINE_METADATA.license, "Apache-2.0");
  assert.match(OCR_ENGINE_METADATA.languages, /vie\+eng/);
});

test("BL-07B validatePdfUploadInput validates file type, extension, and 5MB limit", () => {
  assert.throws(
    () => validatePdfUploadInput(null),
    (err) => err instanceof CvOcrImportError && err.code === "FILE_MISSING",
  );

  assert.throws(
    () => validatePdfUploadInput({ name: "cv.docx", size: 1024, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    (err) => err instanceof CvOcrImportError && err.code === "INVALID_FILE_TYPE",
  );

  assert.throws(
    () => validatePdfUploadInput({ name: "cv.pdf", size: MAX_OCR_PDF_BYTES + 1, type: "application/pdf" }),
    (err) => err instanceof CvOcrImportError && err.code === "FILE_TOO_LARGE",
  );

  const valid = validatePdfUploadInput({ name: "my_cv_2026.pdf", size: 2_500_000, type: "application/pdf" });
  assert.equal(valid.name, "my_cv_2026.pdf");
  assert.equal(valid.size, 2_500_000);
});

test("BL-07B validatePdfHeaderBytes checks %PDF- magic bytes and rejects encrypted PDFs", () => {
  const validPdfHeader = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");
  assert.equal(validatePdfHeaderBytes(validPdfHeader), true);

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(
    () => validatePdfHeaderBytes(pngHeader),
    (err) => err instanceof CvOcrImportError && err.code === "INVALID_PDF_MAGIC",
  );

  const encryptedPdfHeader = Buffer.from("%PDF-1.7\n/Encrypt 12 0 R\n");
  assert.throws(
    () => validatePdfHeaderBytes(encryptedPdfHeader),
    (err) => err instanceof CvOcrImportError && err.code === "PDF_ENCRYPTED",
  );
});

test("BL-07B validatePdfPageCount enforces 1 to 3 pages limit", () => {
  assert.equal(validatePdfPageCount(1), 1);
  assert.equal(validatePdfPageCount(2), 2);
  assert.equal(validatePdfPageCount(3), 3);

  assert.throws(
    () => validatePdfPageCount(0),
    (err) => err instanceof CvOcrImportError && err.code === "INVALID_PDF_PAGES",
  );

  assert.throws(
    () => validatePdfPageCount(4),
    (err) => err instanceof CvOcrImportError && err.code === "TOO_MANY_PAGES",
  );
});

test("BL-07B computeBoundedRasterViewport preserves aspect ratio within memory budget", () => {
  const viewport = computeBoundedRasterViewport({
    widthPt: 595.28,
    heightPt: 841.89,
    desiredScale: 2,
  });

  assert.ok(viewport.width <= MAX_OCR_RASTER_LONG_EDGE_PX);
  assert.ok(viewport.height <= MAX_OCR_RASTER_LONG_EDGE_PX);
  assert.ok(viewport.pixels <= MAX_OCR_RASTER_PIXELS_PER_PAGE);
  assert.ok(Math.abs(viewport.width / viewport.height - 595.28 / 841.89) < 0.01);
});

test("BL-07B reconstructLinesFromPdfTextItems respects 2-column layouts without interleaving", () => {
  // Two column mock items:
  // Left column (x: 50): "KỸ NĂNG", "JavaScript", "React"
  // Right column (x: 350): "KINH NGHIỆM", "Frontend Engineer", "FPT Software"
  const items = [
    { str: "KỸ NĂNG", transform: [1, 0, 0, 1, 50, 700], width: 60 },
    { str: "KINH NGHIỆM", transform: [1, 0, 0, 1, 350, 700], width: 80 },
    { str: "JavaScript", transform: [1, 0, 0, 1, 50, 670], width: 70 },
    { str: "Frontend Engineer", transform: [1, 0, 0, 1, 350, 670], width: 100 },
    { str: "React", transform: [1, 0, 0, 1, 50, 640], width: 40 },
    { str: "FPT Software", transform: [1, 0, 0, 1, 350, 640], width: 90 },
  ];

  const lines = reconstructLinesFromPdfTextItems(items, 600, 800);
  const leftIdxSkills = lines.indexOf("KỸ NĂNG");
  const leftIdxReact = lines.indexOf("React");
  const rightIdxExp = lines.indexOf("KINH NGHIỆM");

  assert.ok(leftIdxSkills !== -1);
  assert.ok(rightIdxExp !== -1);
  // Column-ordered: Left column items precede right column items
  assert.ok(leftIdxReact < rightIdxExp, "Left column lines should not interleave with right column lines");
});

test("BL-07B evaluatePageTextSufficiency distinguishes rich text from empty/watermark layers", () => {
  const emptyRes = evaluatePageTextSufficiency([]);
  assert.equal(emptyRes.isSufficient, false);

  const watermarkOnly = evaluatePageTextSufficiency(["Page 2 of 2", "CONFIDENTIAL"]);
  assert.equal(watermarkOnly.isSufficient, false);

  const richContent = evaluatePageTextSufficiency([
    "NGUYEN MINH ANH",
    "Kỹ sư phần mềm Full-stack",
    "Email: minhanh@rabbitcv.test | SĐT: 0912345678",
    "KINH NGHIỆM LÀM VIỆC",
    "Công ty Công nghệ Rabbit - Lập trình viên cao cấp",
    "Phát triển hệ thống vi dịch vụ xử lý 10,000 requests mỗi giây.",
    "HỌC VẤN: Đại học Bách Khoa Hà Nội",
  ]);
  assert.equal(richContent.isSufficient, true);
  assert.ok(richContent.meaningfulCharCount > 100);
});

test("BL-07B stitchExtractedPages deduplicates recurring headers and footers across pages", () => {
  const pages = [
    {
      pageNumber: 1,
      source: "text",
      lines: [
        "RabbitCV Official Resume",
        "Nguyễn Minh Anh - Trang 1",
        "MỤC TIÊU NGHỀ NGHIỆP",
        "Trở thành kỹ sư trưởng nhóm.",
        "Bảo mật thông tin ứng viên",
      ],
      confidence: 100,
    },
    {
      pageNumber: 2,
      source: "text",
      lines: [
        "RabbitCV Official Resume", // running header
        "Nguyễn Minh Anh - Trang 2",
        "KINH NGHIỆM LÀM VIỆC",
        "Công ty ABC Software",
        "Bảo mật thông tin ứng viên", // running footer
      ],
      confidence: 100,
    },
  ];

  const stitched = stitchExtractedPages(pages);
  // Should deduplicate recurring header and footer
  const headerCount = stitched.lines.filter((l) => l === "RabbitCV Official Resume").length;
  const footerCount = stitched.lines.filter((l) => l === "Bảo mật thông tin ứng viên").length;
  assert.equal(headerCount, 1);
  assert.equal(footerCount, 1);
  assert.equal(stitched.pageSummaries.length, 2);
});

test("BL-07B mapExtractedTextToResumeDraft parses VN/EN sections, contact info, and tracks uncertain lines", () => {
  const lines = [
    "NGUYỄN MINH ANH",
    "KỸ SƯ PHẦN MỀM FULL-STACK",
    "minhanh.nguyen@rabbitcv.test | 0912345678 | Quận 1, TP. Hồ Chí Minh",
    "LinkedIn: linkedin.com/in/minhanh-dev | GitHub: github.com/minhanh-dev",
    "MỤC TIÊU NGHỀ NGHIỆP",
    "Kỹ sư có 4 năm kinh nghiệm phát triển phần mềm doanh nghiệp.",
    "KINH NGHIỆM LÀM VIỆC",
    "Trưởng nhóm Lập trình Frontend",
    "Công ty Công nghệ Rabbit",
    "01/2022 - Hiện tại",
    "Dẫn dắt đội ngũ 6 kỹ sư xây dựng hệ sinh thái tuyển dụng.",
    "HỌC VẤN",
    "Đại học Bách Khoa TP.HCM",
    "Kỹ sư Khoa học Máy tính",
    "2017 - 2021",
    "GPA: 3.65/4.0",
    "KỸ NĂNG",
    "JavaScript, TypeScript, React, Node.js, Docker",
    "CHỨNG CHỈ",
    "AWS Certified Solutions Architect",
    "GIẢI THƯỞNG",
    "Giải Nhất Hackathon Toàn quốc 2023",
  ];

  const { draft, reviewNotes } = mapExtractedTextToResumeDraft(lines, {
    fileName: "nguyen_minh_anh_cv.pdf",
    selectedTemplate: "modern",
    pageCount: 1,
  });

  assert.equal(draft.title, "CV - NGUYỄN MINH ANH");
  assert.equal(draft.personalInfo.fullName, "NGUYỄN MINH ANH");
  assert.equal(draft.personalInfo.email, "minhanh.nguyen@rabbitcv.test");
  assert.equal(draft.personalInfo.phone, "0912345678");
  assert.match(draft.personalInfo.location, /Quận 1/);
  assert.ok(draft.profile.some((p) => (p.link || "").includes("linkedin.com/in/minhanh-dev")));
  assert.ok(draft.profile.some((p) => (p.link || "").includes("github.com/minhanh-dev")));

  assert.ok(draft.experience.length >= 1);
  assert.ok(draft.education.length >= 1);
  assert.equal(draft.education[0].title, "Đại học Bách Khoa TP.HCM");
  assert.match(draft.education[0].score, /3\.65/);

  assert.ok(draft.skill.length >= 1);
  assert.ok(Array.isArray(reviewNotes.uncertainFields));
  assert.ok(Array.isArray(reviewNotes.unmappedLines));
});

test("CV import keeps undated projects, coursework, skills, interests, and bio paragraphs separate", () => {
  const { draft } = mapExtractedTextToResumeDraft([
    "Example Person",
    "Software Developer",
    "About Me",
    "I build products that",
    "help teams work together.",
    "",
    "I enjoy mentoring.",
    "Projects",
    "RabbitCV",
    "Built a CV editor.",
    "Shop Portal",
    "Built a checkout flow.",
    "Courses",
    "Web Development Fundamentals",
    "Database Design",
    "Technical Skills: React; Node.js; C++; .NET",
    "Personal Interests: Reading - Running",
  ]);
  const saved = sanitizeConfirmableResumePayload(draft);
  assert.deepEqual(saved.project.map(({ title, description }) => [title, description]), [
    ["RabbitCV", "<p>Built a CV editor.</p>"],
    ["Shop Portal", "<p>Built a checkout flow.</p>"],
  ]);
  assert.deepEqual(saved.skill.map(({ title }) => title), ["React", "Node.js", "C++", ".NET"]);
  assert.deepEqual(saved.hobby.map(({ title }) => title), ["Reading", "Running"]);
  assert.equal(saved.customSections[0].title, "Khóa học");
  assert.deepEqual(saved.customSections[0].items.map(({ title }) => title), ["Web Development Fundamentals", "Database Design"]);
  assert.equal(saved.bio, "<p>I build products that help teams work together.</p><p>I enjoy mentoring.</p>");
});

test("CV import handles inline Vietnamese headings and keeps dates, URLs, and bullets with each project", () => {
  const { draft } = mapExtractedTextToResumeDraft([
    "Giới thiệu: Tôi xây công cụ",
    "giúp nhóm theo dõi tiến độ.",
    "Dự án: Cổng tuyển dụng",
    "03/2024 – 06/2024",
    "Link: https://example.com/recruitment",
    "• Xây bộ lọc.",
    "• Thêm tìm kiếm và phân trang",
    "cho danh sách việc làm.",
    "Dự án 2: Kho hàng",
    "07/2024 – 09/2024",
    "https://example.com/inventory",
    "• Xây báo cáo.",
    "Các khóa học: Cơ sở dữ liệu; Kiểm thử",
    "Kỹ năng: React, C++",
    "Sở thích: Chạy bộ; Đọc sách",
  ]);
  assert.equal(draft.bio, "<p>Tôi xây công cụ giúp nhóm theo dõi tiến độ.</p>");
  assert.deepEqual(draft.project.map(({ title, date, link }) => [title, date, link]), [
    ["Cổng tuyển dụng", "03/2024 – 06/2024", "https://example.com/recruitment"],
    ["Kho hàng", "07/2024 – 09/2024", "https://example.com/inventory"],
  ]);
  assert.match(draft.project[0].description, /Thêm tìm kiếm và phân trang.*cho danh sách việc làm/);
  assert.equal(draft.project[1].description, "<p>Xây báo cáo.</p>");
  assert.deepEqual(draft.customSections[0].items.map(({ title }) => title), ["Cơ sở dữ liệu", "Kiểm thử"]);
  assert.deepEqual(draft.skill.map(({ title }) => title), ["React", "C++"]);
  assert.deepEqual(draft.hobby.map(({ title }) => title), ["Chạy bộ", "Đọc sách"]);
});

test("CV import unwraps project prose and keeps unrelated rows out of skills and hobbies", () => {
  const unrelated = [
    "□ Ho Chi Minh City", "Viet Nam", "2020 -2026", "June 2023 -August 2023",
    "Graduation Project -2026", "privacy-first 2-tier local PDF parser (PDF.js",
    "Personal Project -2025", "2022", "2023",
  ];
  const { draft, reviewNotes } = mapExtractedTextToResumeDraft([
    "Alex Morgan", "Developer", "Projects", "Document Converter",
    "Developed an OCR platform converting PDFs and",
    "spreadsheets to formatted Word and Excel",
    "documents.",
    "Applied OpenCV to detect tables and restore paragraph indentation,",
    "headings, and font properties.",
    "Deployed background jobs on Modal Serverless, enabling batch uploads",
    "and progress tracking.",
    "Skills",
    "Programming Languages Python, C++, Dart",
    "Frontend ReactJS, Vite, Tailwind CSS",
    "Backend Node.js, Express, MongoDB",
    "Tools & Cloud Git, Vercel, Modal Serverless",
    "Languages English (TOEIC 625), Vietnamese",
    "2026",
    "Hobbies",
    "Reading", "Running", "Traveling", "Listening to music",
    ...unrelated,
  ]);

  assert.equal(draft.project.length, 1);
  assert.equal(draft.project[0].description, [
    "<p>Developed an OCR platform converting PDFs and spreadsheets to formatted Word and Excel documents.</p>",
    "<p>Applied OpenCV to detect tables and restore paragraph indentation, headings, and font properties.</p>",
    "<p>Deployed background jobs on Modal Serverless, enabling batch uploads and progress tracking.</p>",
  ].join(""));
  assert.deepEqual(draft.hobby.map(({ title }) => title), ["Reading", "Running", "Traveling", "Listening to music"]);
  assert.ok(unrelated.every((line) => reviewNotes.unmappedLines.includes(line)));
  assert.ok(reviewNotes.unmappedLines.includes("2026"));

  const payload = sanitizeConfirmableResumePayload(draft);
  assert.deepEqual(payload.skill, []);
  assert.equal(payload.customSections[0].title, "Kỹ năng");
  assert.deepEqual(payload.customSections[0].items.map(({ title, description }) => [title, description]), [
    ["Programming Languages", "<p>Python, C++, Dart</p>"],
    ["Frontend", "<p>ReactJS, Vite, Tailwind CSS</p>"],
    ["Backend", "<p>Node.js, Express, MongoDB</p>"],
    ["Tools & Cloud", "<p>Git, Vercel, Modal Serverless</p>"],
    ["Languages", "<p>English (TOEIC 625), Vietnamese</p>"],
  ]);
  const skillKey = "custom:" + IMPORTED_SKILL_GROUPS_ID;
  const defaultLayout = getTemplateLayout(payload.layout, "modern", payload.customSections);
  assert.equal(defaultLayout.sidebar[defaultLayout.sidebar.indexOf("skill") + 1], skillKey);
  const moved = getTemplateLayout({ byTemplate: { modern: { main: [skillKey] } } }, "modern", payload.customSections);
  assert.equal(moved.main[0], skillKey);
  assert.ok(!moved.sidebar.includes(skillKey));
});

test("PDF columns do not inherit the last section from the other column", () => {
  const left = ["Hobbies", "Reading", "Running", "Listening to music"];
  const right = ["Unlabeled continuation", "Another unclassified line", "Projects", "Garden Planner", "Built a schedule."];
  const items = [left, right].flatMap((column, side) => column.map((str, index) => ({
    str, width: str.length * 6, transform: [1, 0, 0, 1, side ? 255 : 35, 730 - index * 15],
  })));
  const reconstructed = reconstructLinesFromPdfTextItems(items, 595, 842);
  const stitched = stitchExtractedPages([{ pageNumber: 1, lines: evaluatePageTextSufficiency(reconstructed).cleanedLines }]);
  const { draft, reviewNotes } = mapExtractedTextToResumeDraft(stitched.lines);
  assert.deepEqual(draft.hobby.map(({ title }) => title), left.slice(1));
  assert.deepEqual(draft.project.map(({ title }) => title), ["Garden Planner"]);
  assert.deepEqual(reviewNotes.unmappedLines, right.slice(0, 2));
});

test("PDF text extraction preserves spacing between bio paragraphs", async () => {
  const bytes = buildPdfFromPages([{ type: "text", lines: [
    "Example Person",
    "Software Developer",
    "SUMMARY",
    "My goal is to build products that",
    "help teams work together.",
    "",
    "Mentoring is also important to me.",
    "SKILLS",
    "React and JavaScript",
  ] }]);
  const result = await importResumeFromPdfBytes({
    bytes,
    fileMeta: { name: "wrapped-summary.pdf", size: bytes.length, type: "application/pdf" },
  }, {
    createOcrWorker: async () => assert.fail("Selectable PDF text should not require OCR"),
  });
  assert.equal(result.pageSummaries[0].source, "text");
  assert.equal(result.draft.bio, "<p>My goal is to build products that help teams work together.</p><p>Mentoring is also important to me.</p>");
  assert.match(result.fullText, /products that\nhelp teams work together\.\n\nMentoring/);
});

test("BL-07B sanitizeConfirmableResumePayload strips internal ids, pdfData, scripts, and ensures schema match", () => {
  const dirtyPayload = {
    _id: "672f0123456789abcdef0123",
    userId: "672f0123456789abcdef0999",
    isVirtual: true,
    pdfData: "base64datahere...",
    fileName: "cv.pdf",
    title: "CV 2026",
    selectedTemplate: "classic",
    pageCount: 2,
    personalInfo: {
      fullName: "<script>alert('xss')</script>Nguyễn Văn A",
      email: "vana@test.vn",
      phone: "0900000000",
      jobTitle: "Dev",
      location: "HN",
    },
    bio: "<p>Mô tả hợp lệ</p><script>alert(1)</script>",
    profile: [{ networkName: "Site", link: "javascript:void(0)" }],
    experience: [
      {
        _id: "temp_exp_1",
        position: "Dev",
        company: "ABC",
        description: "Làm việc chăm chỉ <script>window.hack=true</script>",
      },
    ],
    education: [],
    skill: [{ name: "JS", rating: 5 }],
    customSections: [],
  };

  const clean = sanitizeConfirmableResumePayload(dirtyPayload);

  assert.equal(clean._id, undefined);
  assert.equal(clean.userId, undefined);
  assert.equal(clean.isVirtual, undefined);
  assert.equal(clean.pdfData, undefined);
  assert.equal(clean.fileName, undefined);

  assert.equal(clean.personalInfo.fullName, "Nguyễn Văn A");
  assert.equal(clean.personalInfo.location, "HN");
  assert.equal(clean.profile[0].link, "");
  assert.equal(clean.experience[0]._id, undefined);
  assert.doesNotMatch(clean.experience[0].description, /<script/i);
  assert.match(clean.experience[0].description, /<p>Làm việc chăm chỉ/);
  assert.equal(clean.title, "CV 2026");
  assert.equal(clean.selectedTemplate, "classic");
  assert.equal(clean.pageCount, 2);
});

test("BL-07B importResumeFromPdfBytes on text-cv-1page.pdf uses Tier 1 direct text without calling OCR", async () => {
  const pdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
  assert.ok(fs.existsSync(pdfPath), "text-cv-1page.pdf fixture must exist");

  const pdfBuf = await fsp.readFile(pdfPath);
  let ocrWorkerInvoked = false;

  const result = await importResumeFromPdfBytes(
    {
      fileMeta: { name: "text-cv-1page.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      createOcrWorker: async () => {
        ocrWorkerInvoked = true;
        throw new Error("OCR worker should NEVER be called for pure text PDF");
      },
    },
  );

  assert.equal(ocrWorkerInvoked, false, "Pure text PDF must not invoke OCR worker");
  assert.equal(result.metrics.ocrPageCount, 0);
  assert.equal(result.metrics.textPageCount, 1);
  assert.equal(result.pageSummaries[0].source, "text");
  assert.equal(result.draft.personalInfo.fullName, "Nguyễn Minh Anh");
  assert.equal(result.draft.personalInfo.email, "minhanh.nguyen@rabbitcv.test");
  assert.equal(result.draft.personalInfo.phone, "0912345678");
  assert.ok(result.draft.experience.length >= 1);
});

test("BL-07B importResumeFromPdfBytes on scan-cv-1page.pdf uses Tier 2 local tesseract.js OCR", async () => {
  ensureLocalLangData();
  const pdfPath = path.join(qaFixturesDir, "scan-cv-1page.pdf");
  const renderedPngPath = path.join(qaFixturesDir, "scan-cv-1page-rendered-1.png");
  assert.ok(fs.existsSync(pdfPath), "scan-cv-1page.pdf fixture must exist");
  assert.ok(fs.existsSync(renderedPngPath), "scan-cv-1page-rendered-1.png must exist");

  const pdfBuf = await fsp.readFile(pdfPath);
  const pngBuf = await fsp.readFile(renderedPngPath);

  let activeWorker = null;
  const progressReports = [];

  const result = await importResumeFromPdfBytes(
    {
      fileMeta: { name: "scan-cv-1page.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      onProgress: (p) => progressReports.push(p),
      rasterizePage: async () => `data:image/png;base64,${pngBuf.toString("base64")}`,
      createOcrWorker: async (onProgress) => {
        activeWorker = await createWorker("vie+eng", 1, {
          langPath: localCacheLangDir,
          cacheMethod: "none",
          logger: onProgress,
        });
        return activeWorker;
      },
    },
  );

  assert.equal(result.metrics.ocrPageCount, 1);
  assert.equal(result.metrics.textPageCount, 0);
  assert.equal(result.pageSummaries[0].source, "ocr");
  assert.ok(result.metrics.ocrRecognizeMs > 0);
  assert.ok(result.pageSummaries[0].confidence > 70);

  // Check OCR extracted text
  assert.match(result.draft.personalInfo.fullName, /Nguyễn Minh Anh/i);
  assert.equal(result.draft.personalInfo.email, "minhanh.nguyen@rabbitcv.test");
  assert.equal(result.draft.personalInfo.phone, "0912345678");

  // Verify progress callbacks fired
  assert.ok(progressReports.some((p) => p.stage === "ocr_recognizing"));
  assert.ok(progressReports.some((p) => p.stage === "completed" && p.percent === 100));

  if (activeWorker) {
    await activeWorker.terminate();
  }
});

test("BL-07B importResumeFromPdfBytes on mixed-cv-2pages.pdf extracts Page 1 via text and Page 2 via OCR", async () => {
  ensureLocalLangData();
  const pdfPath = path.join(qaFixturesDir, "mixed-cv-2pages.pdf");
  const renderedPngPath2 = path.join(qaFixturesDir, "mixed-cv-2pages-rendered-2.png");
  assert.ok(fs.existsSync(pdfPath), "mixed-cv-2pages.pdf fixture must exist");
  assert.ok(fs.existsSync(renderedPngPath2), "mixed-cv-2pages-rendered-2.png must exist");

  const pdfBuf = await fsp.readFile(pdfPath);
  const pngBuf2 = await fsp.readFile(renderedPngPath2);

  let activeWorker = null;
  const result = await importResumeFromPdfBytes(
    {
      fileMeta: { name: "mixed-cv-2pages.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      rasterizePage: async (_page, _boundedViewport) => `data:image/png;base64,${pngBuf2.toString("base64")}`,
      createOcrWorker: async (onProgress) => {
        activeWorker = await createWorker("vie+eng", 1, {
          langPath: localCacheLangDir,
          cacheMethod: "none",
          logger: onProgress,
        });
        return activeWorker;
      },
    },
  );

  assert.equal(result.metrics.totalPages, 2);
  assert.equal(result.metrics.textPageCount, 1);
  assert.equal(result.metrics.ocrPageCount, 1);

  assert.equal(result.pageSummaries[0].pageNumber, 1);
  assert.equal(result.pageSummaries[0].source, "text");
  assert.equal(result.pageSummaries[1].pageNumber, 2);
  assert.equal(result.pageSummaries[1].source, "ocr");

  // Page 1 contact info
  assert.equal(result.draft.personalInfo.email, "minhanh.nguyen@rabbitcv.test");
  // Page 2 OCR certifications/awards
  assert.ok(result.fullText.includes("AWS Certified Solutions Architect") || result.fullText.includes("Hackathon"));

  if (activeWorker) {
    await activeWorker.terminate();
  }
});

test("BL-07B createCvOcrJobManager aborts active extraction and suppresses stale results", async () => {
  const manager = createCvOcrJobManager();
  const pdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
  const pdfBuf = await fsp.readFile(pdfPath);

  // Start slow job
  const jobPromise = manager.runJob(
    {
      fileMeta: { name: "text-cv-1page.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      pdfLoader: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { numPages: 1 };
      },
    },
  );

  // Immediately cancel
  manager.cancelActive();

  await assert.rejects(
    jobPromise,
    (err) => err instanceof CvOcrImportError && err.code === "OCR_ABORTED",
  );
});

test("BL-07B OCR worker lifecycle terminates late-created worker after init timeout", async () => {
  let createdCount = 0;
  let terminatedCount = 0;

  const fakeWorker = {
    recognize: async () => ({ data: { text: "Late worker text", confidence: 90 } }),
    terminate: async () => {
      terminatedCount += 1;
    },
  };

  const pdfBuf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");

  const promise = importResumeFromPdfBytes(
    {
      fileMeta: { name: "test-late.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      initTimeoutMs: 15,
      pdfLoader: async () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getViewport: () => ({ width: 595, height: 842 }),
            getTextContent: async () => ({ items: [] }), // insufficient text -> triggers OCR
          }),
        }),
      }),
      rasterizePage: async () => "data:image/png;base64,fake-data",
      createOcrWorker: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        createdCount += 1;
        return fakeWorker;
      },
    },
  );

  await assert.rejects(
    promise,
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );

  // Wait for the late factory promise to settle
  await new Promise((resolve) => setTimeout(resolve, 70));

  assert.equal(createdCount, 1, "Factory should have produced 1 worker");
  assert.equal(terminatedCount, 1, "Late worker must be terminated exactly once");
});

test("BL-07B hung PDF stages (loader, getPage, getTextContent) are bounded by timeout", async () => {
  const pdfBuf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");

  // 1. Hung pdfLoader
  await assert.rejects(
    importResumeFromPdfBytes(
      {
        fileMeta: { name: "hung-loader.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
        bytes: pdfBuf,
      },
      {
        initTimeoutMs: 25,
        pdfLoader: () => new Promise(() => {}), // never resolves
      },
    ),
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );

  // 2. Hung getPage
  await assert.rejects(
    importResumeFromPdfBytes(
      {
        fileMeta: { name: "hung-getpage.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
        bytes: pdfBuf,
      },
      {
        pageTimeoutMs: 25,
        pdfLoader: async () => ({
          promise: Promise.resolve({
            numPages: 1,
            getPage: () => new Promise(() => {}), // never resolves
          }),
        }),
      },
    ),
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );

  // 3. Hung getTextContent
  await assert.rejects(
    importResumeFromPdfBytes(
      {
        fileMeta: { name: "hung-text.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
        bytes: pdfBuf,
      },
      {
        pageTimeoutMs: 25,
        pdfLoader: async () => ({
          promise: Promise.resolve({
            numPages: 1,
            getPage: async () => ({
              getViewport: () => ({ width: 595, height: 842 }),
              getTextContent: () => new Promise(() => {}), // never resolves
            }),
          }),
        }),
      },
    ),
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );
});

test("BL-07B createCvOcrJobManager suppresses stale failures when job is replaced or canceled", async () => {
  const manager = createCvOcrJobManager();
  const pdfBuf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");

  let rejectJob1;
  const job1Barrier = new Promise((_, reject) => {
    rejectJob1 = reject;
  });

  // Start Job 1 with deferred rejection
  const job1Promise = manager.runJob(
    {
      fileMeta: { name: "job1.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      pdfLoader: async () => {
        await job1Barrier;
        return { numPages: 1 };
      },
    },
  );

  // Start Job 2 immediately, replacing Job 1
  const job2Promise = manager.runJob(
    {
      fileMeta: { name: "job2.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      pdfLoader: async () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getViewport: () => ({ width: 595, height: 842 }),
            getTextContent: async () => ({
              items: [
                { str: "Nguyễn Văn B", transform: [12, 0, 0, 12, 50, 750], width: 80, height: 12 },
                { str: "Kỹ Sư Phần Mềm", transform: [10, 0, 0, 10, 50, 720], width: 90, height: 10 },
                { str: "vanb.nguyen@rabbitcv.test", transform: [10, 0, 0, 10, 50, 700], width: 120, height: 10 },
                { str: "0987654321", transform: [10, 0, 0, 10, 50, 680], width: 70, height: 10 },
                { str: "Kinh nghiệm làm việc tại công ty công nghệ cao phát triển web và ứng dụng phân tán.", transform: [10, 0, 0, 10, 50, 650], width: 300, height: 10 },
              ],
            }),
          }),
        }),
      }),
    },
  );

  // Now reject Job 1 with a failure
  rejectJob1(new Error("Job 1 network failure"));

  // Job 1 must reject with OCR_ABORTED instead of "Job 1 network failure"
  await assert.rejects(
    job1Promise,
    (err) => err instanceof CvOcrImportError && err.code === "OCR_ABORTED",
    "Stale failure must be suppressed as OCR_ABORTED",
  );

  // Job 2 must succeed normally
  const result2 = await job2Promise;
  assert.equal(result2.draft.personalInfo.fullName, "Nguyễn Văn B");
});

test("BL-07B Late PDF loader acquisition resolves after timeout/abort and is disposed exactly once", async () => {
  const samplePdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
  const pdfBuf = await fsp.readFile(samplePdfPath);

  // 1. Timeout during deferred loader acquisition, then late resolve
  let resolveLoader;
  const loaderDeferred = new Promise((resolve) => {
    resolveLoader = resolve;
  });

  let destroyedCount = 0;
  const lateTask = {
    promise: Promise.resolve({ numPages: 1 }),
    destroy: async () => {
      destroyedCount += 1;
    },
  };

  await assert.rejects(
    importResumeFromPdfBytes(
      {
        fileMeta: { name: "deferred.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
        bytes: pdfBuf,
      },
      {
        initTimeoutMs: 5,
        totalTimeoutMs: 25,
        pdfLoader: () => loaderDeferred,
      },
    ),
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );

  // Now resolve deferred loader after timeout
  resolveLoader(lateTask);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(destroyedCount, 1, "Late loading task must be destroyed exactly once after timeout");

  // 2. Cancellation during deferred loader acquisition, then late resolve
  let resolveLoader2;
  const loaderDeferred2 = new Promise((resolve) => {
    resolveLoader2 = resolve;
  });
  let destroyedCount2 = 0;
  const lateTask2 = {
    promise: Promise.resolve({ numPages: 1 }),
    destroy: async () => {
      destroyedCount2 += 1;
    },
  };
  const abortController = new AbortController();

  const cancelImportPromise = importResumeFromPdfBytes(
    {
      fileMeta: { name: "deferred2.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      signal: abortController.signal,
      initTimeoutMs: 50,
      totalTimeoutMs: 100,
      pdfLoader: () => loaderDeferred2,
    },
  );

  abortController.abort();
  await assert.rejects(
    cancelImportPromise,
    (err) => err instanceof CvOcrImportError && err.code === "OCR_ABORTED",
  );

  resolveLoader2(lateTask2);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(destroyedCount2, 1, "Late loading task must be destroyed exactly once after abort");

  // 3. Late rejection of deferred loader should not trigger unhandledRejection
  let rejectLoader3;
  const loaderDeferred3 = new Promise((_, reject) => {
    rejectLoader3 = reject;
  });

  let unhandledCaptured = null;
  const onUnhandled = (err) => {
    unhandledCaptured = err;
  };
  process.on("unhandledRejection", onUnhandled);

  try {
    await assert.rejects(
      importResumeFromPdfBytes(
        {
          fileMeta: { name: "deferred3.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
          bytes: pdfBuf,
        },
        {
          initTimeoutMs: 5,
          totalTimeoutMs: 25,
          pdfLoader: () => loaderDeferred3,
        },
      ),
      (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
    );

    rejectLoader3(new Error("late loader failure"));
    await new Promise((resolve) => setTimeout(resolve, 15));
    assert.equal(unhandledCaptured, null, "Late loader rejection must be observed without unhandledRejection");
  } finally {
    process.removeListener("unhandledRejection", onUnhandled);
  }
});

test("BL-07B Resource cleanup is prompt, bounded, and rejection-safe", async () => {
  const samplePdfPath = path.join(qaFixturesDir, "text-cv-1page.pdf");
  const pdfBuf = await fsp.readFile(samplePdfPath);

  // 1. Hung loading task destroy does not block prompt settlement
  const hungLoadingTask = {
    promise: new Promise(() => {}),
    destroy: () => new Promise(() => {}), // never resolves
  };

  const startHung = Date.now();
  await assert.rejects(
    importResumeFromPdfBytes(
      {
        fileMeta: { name: "hung-destroy.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
        bytes: pdfBuf,
      },
      {
        initTimeoutMs: 5,
        totalTimeoutMs: 20,
        pdfLoader: async () => hungLoadingTask,
      },
    ),
    (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
  );
  const elapsedHung = Date.now() - startHung;
  assert.ok(
    elapsedHung < 75,
    `Operation must settle promptly despite hung destroy (took ${elapsedHung}ms, expected < 75ms)`,
  );

  // 2. withStepTimeout catches rejected async cleanup without unhandledRejection
  let unhandledInTimeout = null;
  const onUnhandled = (err) => {
    unhandledInTimeout = err;
  };
  process.on("unhandledRejection", onUnhandled);

  try {
    const neverPromise = new Promise(() => {});
    await assert.rejects(
      withStepTimeout(
        neverPromise,
        5,
        "OCR_TIMEOUT",
        "review timeout",
        () => Promise.reject(new Error("async destroy failed")),
      ),
      (err) => err instanceof CvOcrImportError && err.code === "OCR_TIMEOUT",
    );

    await new Promise((resolve) => setTimeout(resolve, 15));
    assert.equal(unhandledInTimeout, null, "Async cleanup rejection must not escape as unhandledRejection");
  } finally {
    process.removeListener("unhandledRejection", onUnhandled);
  }

  // 3. No stale progress callbacks after cancellation
  const staleProgressList = [];
  let isCanceled = false;
  const abortController = new AbortController();

  let unblockPage;
  const pageBarrier = new Promise((resolve) => {
    unblockPage = resolve;
  });

  const progressImportPromise = importResumeFromPdfBytes(
    {
      fileMeta: { name: "stale-progress.pdf", size: pdfBuf.byteLength, type: "application/pdf" },
      bytes: pdfBuf,
    },
    {
      signal: abortController.signal,
      initTimeoutMs: 50,
      totalTimeoutMs: 150,
      onProgress: (p) => {
        if (isCanceled) {
          staleProgressList.push(p);
        }
      },
      pdfLoader: async () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => {
            await pageBarrier;
            return {
              getViewport: () => ({ width: 595, height: 842 }),
              getTextContent: async () => ({ items: [] }),
            };
          },
        }),
      }),
    },
  );

  abortController.abort();
  isCanceled = true;
  await assert.rejects(
    progressImportPromise,
    (err) => err instanceof CvOcrImportError && err.code === "OCR_ABORTED",
  );

  // Release the blocked page afterwards
  unblockPage();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(staleProgressList.length, 0, "No progress callbacks must be fired after cancellation");
});
