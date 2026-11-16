import { IMPORTED_SKILL_GROUPS_ID, normalizeCustomSections, normalizeSkillNames } from "./resumeCustomSections.js";
import { normalizeResumePageCount } from "./resumePages.js";
import { RESUME_TEMPLATE_KEYS } from "./resumeTemplates.js";

export const MAX_OCR_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_OCR_PDF_PAGES = 3; // Tối đa 3 trang A4
export const MAX_OCR_RASTER_LONG_EDGE_PX = 1800;
export const MAX_OCR_RASTER_PIXELS_PER_PAGE = 2_400_000;
export const MAX_OCR_TOTAL_RASTER_PIXELS = 6_600_000;
export const DEFAULT_OCR_INIT_TIMEOUT_MS = 30_000;
export const DEFAULT_OCR_PAGE_TIMEOUT_MS = 60_000;
export const DEFAULT_OCR_TOTAL_TIMEOUT_MS = 120_000;
// A new column starts a separate reading stream until its first heading.
export const OCR_COLUMN_BREAK = null;

export class CvOcrImportError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CvOcrImportError";
    this.code = code;
    this.details = details;
  }
}

export function stripVietnameseDiacritics(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function sanitizePlainText(value) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExtractedLines(linesOrText) {
  const rawLines = Array.isArray(linesOrText)
    ? linesOrText
    : String(linesOrText || "").split(/\r?\n/);
  const lines = [];
  let paragraphBreak = false;
  for (const rawLine of rawLines) {
    if (rawLine === OCR_COLUMN_BREAK) {
      if (lines.length && lines.at(-1) !== OCR_COLUMN_BREAK) lines.push(OCR_COLUMN_BREAK);
      paragraphBreak = false;
      continue;
    }
    const line = sanitizePlainText(rawLine);
    if (!line) {
      paragraphBreak ||= typeof rawLine === "string" && !rawLine.trim();
      continue;
    }
    if (paragraphBreak && lines.length && lines.at(-1) !== OCR_COLUMN_BREAK) lines.push("");
    lines.push(line);
    paragraphBreak = false;
  }
  if (lines.at(-1) === OCR_COLUMN_BREAK) lines.pop();
  return lines;
}

export function escapeHtmlEntities(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plainTextToSafeParagraphHtml(value) {
  if (typeof value !== "string") return "";
  const lines = value
    .split(/\r?\n/)
    .map((line) => sanitizePlainText(line))
    .filter(Boolean);
  if (!lines.length) return "";
  return lines.map((line) => `<p>${escapeHtmlEntities(line)}</p>`).join("");
}

export function safeParagraphHtmlToPlainText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split(/\r?\n/)
    .map((line) => sanitizePlainText(line))
    .filter(Boolean)
    .join("\n");
}

export function validatePdfUploadInput(fileMeta = {}) {
  if (!fileMeta || typeof fileMeta !== "object") {
    throw new CvOcrImportError("FILE_MISSING", "Vui lòng chọn một tệp PDF để nhập CV.");
  }
  const name = String(fileMeta.name || "").trim();
  const type = String(fileMeta.type || "").trim().toLowerCase();
  const size = Number(fileMeta.size ?? 0);

  if (!Number.isFinite(size) || size <= 0) {
    throw new CvOcrImportError("FILE_EMPTY", "Tệp PDF trống hoặc không hợp lệ. Vui lòng chọn tệp khác.");
  }
  if (size > MAX_OCR_PDF_BYTES) {
    throw new CvOcrImportError(
      "FILE_TOO_LARGE",
      "Dung lượng tệp vượt quá giới hạn 5 MB. Vui lòng chọn tệp PDF nhỏ hơn hoặc bằng 5 MB.",
      { size, maxBytes: MAX_OCR_PDF_BYTES },
    );
  }
  const hasPdfExtension = name.toLowerCase().endsWith(".pdf");
  const hasPdfMime = !type || type === "application/pdf" || type === "application/x-pdf";
  if (!hasPdfExtension || !hasPdfMime) {
    throw new CvOcrImportError(
      "INVALID_FILE_TYPE",
      "Chỉ hỗ trợ tệp định dạng PDF (.pdf). Vui lòng chọn đúng tệp PDF.",
      { name, type },
    );
  }
  return { name, type: "application/pdf", size };
}

export function validatePdfHeaderBytes(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (view.byteLength < 8) {
    throw new CvOcrImportError("FILE_EMPTY", "Tệp PDF trống hoặc bị hỏng.");
  }
  if (view.byteLength > MAX_OCR_PDF_BYTES) {
    throw new CvOcrImportError(
      "FILE_TOO_LARGE",
      "Dung lượng tệp vượt quá giới hạn 5 MB. Vui lòng chọn tệp PDF nhỏ hơn hoặc bằng 5 MB.",
    );
  }
  const headerSlice = view.subarray(0, Math.min(view.byteLength, 1024));
  const headerText = new TextDecoder("latin1").decode(headerSlice);
  if (!headerText.includes("%PDF-")) {
    throw new CvOcrImportError(
      "INVALID_PDF_MAGIC",
      "Tệp được chọn không phải là tài liệu PDF hợp lệ.",
    );
  }
  const sampleSlice = view.subarray(0, Math.min(view.byteLength, 65536));
  const tailSlice = view.subarray(Math.max(0, view.byteLength - 65536));
  const combinedSample =
    new TextDecoder("latin1").decode(sampleSlice) +
    "\n" +
    new TextDecoder("latin1").decode(tailSlice);
  if (/\/Encrypt\b/.test(combinedSample)) {
    throw new CvOcrImportError(
      "PDF_ENCRYPTED",
      "Tệp PDF được đặt mật khẩu hoặc mã hóa. Vui lòng mở khóa tệp trước khi tải lên.",
    );
  }
  return true;
}

export function validatePdfPageCount(numPages) {
  const count = Number(numPages);
  if (!Number.isInteger(count) || count <= 0) {
    throw new CvOcrImportError("INVALID_PDF_PAGES", "Không tìm thấy trang hợp lệ trong tệp PDF.");
  }
  if (count > MAX_OCR_PDF_PAGES) {
    throw new CvOcrImportError(
      "TOO_MANY_PAGES",
      `Tệp PDF có ${count} trang, vượt quá giới hạn tối đa ${MAX_OCR_PDF_PAGES} trang A4 cho một hồ sơ CV.`,
      { numPages: count, maxPages: MAX_OCR_PDF_PAGES },
    );
  }
  return count;
}

export function computeBoundedRasterViewport({
  widthPt,
  heightPt,
  desiredScale = 2,
  maxLongEdgePx = MAX_OCR_RASTER_LONG_EDGE_PX,
  maxPixels = MAX_OCR_RASTER_PIXELS_PER_PAGE,
}) {
  const safeW = Math.max(1, Number(widthPt) || 595.28);
  const safeH = Math.max(1, Number(heightPt) || 841.89);
  if (safeW > 5000 || safeH > 5000) {
    throw new CvOcrImportError(
      "PAGE_DIMENSIONS_EXCEEDED",
      "Kích thước trang PDF vượt quá giới hạn an toàn để xử lý hình ảnh.",
    );
  }
  let scale = Math.max(0.5, Number(desiredScale) || 2);
  const longEdgeAtScale = Math.max(safeW, safeH) * scale;
  if (longEdgeAtScale > maxLongEdgePx) {
    scale *= maxLongEdgePx / longEdgeAtScale;
  }
  const pixelsAtScale = safeW * scale * (safeH * scale);
  if (pixelsAtScale > maxPixels) {
    scale *= Math.sqrt(maxPixels / pixelsAtScale);
  }
  const width = Math.max(1, Math.floor(safeW * scale));
  const height = Math.max(1, Math.floor(safeH * scale));
  return {
    scale: Number(scale.toFixed(4)),
    width,
    height,
    pixels: width * height,
  };
}

function groupPositionedItemsIntoLines(items) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.top - b.top) > 4.5) return a.top - b.top;
    return a.x - b.x;
  });

  const rows = [];
  for (const item of sorted) {
    const lastRow = rows[rows.length - 1];
    if (!lastRow || Math.abs(lastRow.top - item.top) > 4.5) {
      rows.push({ top: item.top, items: [item] });
    } else {
      lastRow.items.push(item);
      lastRow.top =
        lastRow.items.reduce((sum, entry) => sum + entry.top, 0) / lastRow.items.length;
    }
  }

  const gaps = rows.slice(1).map((row, index) => row.top - rows[index].top);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const normalGap = sortedGaps[Math.floor((sortedGaps.length - 1) / 2)] ?? 0;
  return normalizeExtractedLines(
    rows.flatMap((row, index) => {
      const ordered = row.items.sort((a, b) => a.x - b.x);
      let line = "";
      let prevRight = null;
      for (const token of ordered) {
        const text = token.str.trim();
        if (!text) continue;
        if (!line) {
          line = text;
        } else {
          const gap = prevRight !== null ? token.x - prevRight : 4;
          const noSpaceBefore = /^[,.;:!?%)\]}]/.test(text);
          const noSpaceAfterPrev = /[([{-]$/.test(line);
          line += gap > 1.5 && !noSpaceBefore && !noSpaceAfterPrev ? ` ${text}` : text;
        }
        prevRight = token.x + Math.max(token.width, token.str.length * 3.5);
      }
      return gaps[index - 1] >= Math.max(12, normalGap * 1.6) ? ["", line] : [line];
    }),
  );
}

export function splitResumeColumns(positioned, pageWidth) {
  const candidateGutters = [0.5, 0.64, 0.66, 0.62, 0.34, 0.36, 0.4];
  let bestSplit = null;
  for (const ratio of candidateGutters) {
    const splitX = pageWidth * ratio;
    const left = [];
    const right = [];
    const crossing = [];
    for (const item of positioned) {
      const itemRight = item.x + item.width;
      if (itemRight <= splitX) {
        left.push(item);
      } else if (item.x >= splitX) {
        right.push(item);
      } else {
        crossing.push(item);
      }
    }
    if (left.length < 3 || right.length < 3) continue;
    const rightMinTop = Math.min(...right.map((item) => item.top));
    const rightMaxTop = Math.max(...right.map((item) => item.top));
    const overlappingLeft = left.filter(({ top }) => top >= rightMinTop - 12 && top <= rightMaxTop + 12);
    if (overlappingLeft.length < 2) continue;
    const leftMinTop = Math.min(...overlappingLeft.map((item) => item.top));
    const leftMaxTop = Math.max(...overlappingLeft.map((item) => item.top));
    const overlappingRight = right.filter(({ top }) => top >= leftMinTop - 12 && top <= leftMaxTop + 12);
    if (overlappingRight.length < 2) continue;
    const firstColumnTop = Math.min(leftMinTop, rightMinTop);
    const crossingInBody = crossing.filter(({ top }) => top >= firstColumnTop - 8);
    const gap = Math.min(...overlappingRight.map(({ x }) => x)) -
      Math.max(...overlappingLeft.map(({ x, width }) => x + width));
    if (gap < pageWidth * 0.015 || crossingInBody.length > Math.max(1, positioned.length * 0.05)) continue;
    const score = Math.min(overlappingLeft.length, overlappingRight.length) - 2 * crossingInBody.length + gap / pageWidth;
    if (!bestSplit || score > bestSplit.score) bestSplit = { splitX, rightMinTop, score };
  }
  if (!bestSplit) return null;

  const headerCutoffTop = Math.max(0, bestSplit.rightMinTop - 10);
  const topHeaderItems = [];
  const leftColItems = [];
  const rightColItems = [];

  for (const item of positioned) {
    if (item.top < headerCutoffTop && item.x < bestSplit.splitX) {
      topHeaderItems.push(item);
    } else if (item.x < bestSplit.splitX) {
      leftColItems.push(item);
    } else {
      rightColItems.push(item);
    }
  }

  return [topHeaderItems, leftColItems, rightColItems];
}

export function reconstructLinesFromPdfTextItems(rawItems = [], pageWidth = 595.28, pageHeight = 841.89) {
  const positioned = [];
  for (const item of rawItems || []) {
    const str = typeof item?.str === "string" ? item.str : "";
    if (!str.trim()) continue;
    const tx = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
    const x = Number(tx[4]) || 0;
    const y = Number(tx[5]) || 0;
    const top = Math.max(0, pageHeight - y);
    const width = Math.max(0, Number(item.width) || 0);
    positioned.push({ str, x, top, width });
  }
  const columns = splitResumeColumns(positioned, pageWidth);
  if (!columns) return groupPositionedItemsIntoLines(positioned);
  const [header, left, right] = columns;
  return [
    ...groupPositionedItemsIntoLines(header),
    ...groupPositionedItemsIntoLines(left),
    OCR_COLUMN_BREAK,
    ...groupPositionedItemsIntoLines(right),
  ];
}

const WATERMARK_LINE_REGEX =
  /^(?:trang\s*\d+(?:\s*[/|-]\s*\d+)?|page\s*\d+(?:\s*(?:of|\/|-)\s*\d+)?|confidential|draft|sample|demo\s*watermark|created\s+(?:with|by)\b.*|scanned\s+by\b.*)$/i;

const RESUME_SIGNAL_REGEX =
  /(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?84|0)\d[\d\s.-]{7,11}\d|\b(?:kinh nghiem|hoc van|ky nang|ngoai ngu|chung chi|du an|giai thuong|so thich|gioi thieu|tom tat|experience|education|skills|projects|certifications|languages|summary)\b)/i;

export function evaluatePageTextSufficiency(linesOrText) {
  const cleanedLines = normalizeExtractedLines(linesOrText);
  const nonWatermarkLines = normalizeExtractedLines(
    cleanedLines.filter((line) => !WATERMARK_LINE_REGEX.test(line)),
  );
  const joined = nonWatermarkLines.join(" ");
  const asciiFolded = stripVietnameseDiacritics(joined).toLowerCase();
  const words = joined
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w.length >= 2);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const meaningfulCharCount = joined.replace(/\s+/g, "").length;
  const meaningfulWordCount = words.length;
  const uniqueWordCount = uniqueWords.size;
  const hasResumeSignal =
    RESUME_SIGNAL_REGEX.test(joined) || RESUME_SIGNAL_REGEX.test(asciiFolded);

  const isRepetitiveWatermark =
    meaningfulWordCount > 0 && uniqueWordCount <= Math.min(4, Math.ceil(meaningfulWordCount * 0.25));

  const isSufficient =
    !isRepetitiveWatermark &&
    ((meaningfulCharCount >= 80 && meaningfulWordCount >= 15 && uniqueWordCount >= 8) ||
      (meaningfulCharCount >= 45 && meaningfulWordCount >= 8 && hasResumeSignal));

  let reason = "SUFFICIENT_DIRECT_TEXT";
  if (!cleanedLines.length) {
    reason = "EMPTY_TEXT_LAYER";
  } else if (!isSufficient) {
    reason = "INSUFFICIENT_OR_WATERMARK_TEXT";
  }

  return {
    isSufficient,
    reason,
    meaningfulCharCount,
    meaningfulWordCount,
    uniqueWordCount,
    hasResumeSignal,
    cleanedLines: nonWatermarkLines,
    hybridLimitationNote: isSufficient
      ? "Trang có lớp văn bản số đạt ngưỡng chất lượng nên không chạy OCR ảnh; nếu trang có thêm chữ nằm riêng trong ảnh chèn tĩnh (hybrid page), phần chữ trong ảnh sẽ không tự động OCR."
      : null,
  };
}

export function stitchExtractedPages(pages = []) {
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const firstPage = sortedPages[0];
  const firstPageLines = normalizeExtractedLines(firstPage?.lines ?? firstPage?.text).filter(Boolean);
  const firstPageTopSet = new Set(
    firstPageLines.slice(0, 2).map((line) => stripVietnameseDiacritics(line).toLowerCase()),
  );
  const firstPageBottomSet = new Set(
    firstPageLines.slice(-2).map((line) => stripVietnameseDiacritics(line).toLowerCase()),
  );

  const stitchedLines = [];
  const pageSummaries = [];

  for (const page of sortedPages) {
    const rawLines = normalizeExtractedLines(page.lines ?? page.text);
    const contentCount = rawLines.filter(Boolean).length;
    let contentIndex = 0;
    const filteredLines = normalizeExtractedLines(rawLines.filter((line) => {
      if (!line) return true;
      const index = contentIndex++;
      if (WATERMARK_LINE_REGEX.test(line)) return false;
      if (page.pageNumber > 1) {
        const normalized = stripVietnameseDiacritics(line).toLowerCase();
        if (index < 2 && firstPageTopSet.has(normalized)) return false;
        if (index >= contentCount - 2 && firstPageBottomSet.has(normalized)) return false;
      }
      return true;
    }));

    for (const line of filteredLines) {
      if (stitchedLines[stitchedLines.length - 1] !== line) {
        stitchedLines.push(line);
      }
    }

    const pageText = filteredLines.join("\n");
    pageSummaries.push({
      pageNumber: page.pageNumber,
      source: page.source === "ocr" ? "ocr" : "text",
      charCount: pageText.replace(/\s+/g, "").length,
      wordCount: pageText.split(/\s+/).filter(Boolean).length,
      confidence: typeof page.confidence === "number" ? Math.round(page.confidence) : null,
      text: pageText,
    });
  }

  return {
    fullText: stitchedLines.join("\n"),
    lines: stitchedLines,
    pageSummaries,
  };
}

const SECTION_PATTERNS = [
  {
    key: "contact",
    patterns: [
      /^(?:thong tin lien he|lien he|contact(?: info(?:rmation)?)?)$/i,
    ],
  },
  {
    key: "profile",
    patterns: [
      /^(?:mang xa hoi|lien ket|social(?:s| media| links| profiles)?|profiles?)$/i,
    ],
  },
  {
    key: "bio",
    patterns: [
      /^(?:gioi thieu(?: ban than)?|tom tat(?: nghe nghiep| ban than)?|muc tieu(?: nghe nghiep)?|ve toi|summary|professional summary|profile summary|about(?: me)?|objective|career objective)$/i,
    ],
  },
  {
    key: "experience",
    patterns: [
      /^(?:kinh nghiem(?: lam viec| nghe nghiep)?|lich su lam viec|work experience|professional experience|experience|employment(?: history)?)$/i,
    ],
  },
  {
    key: "education",
    patterns: [
      /^(?:hoc van|trinh do hoc van|dao tao|education(?:al background)?|academic background)$/i,
    ],
  },
  {
    key: "skill",
    patterns: [
      /^(?:ky nang(?: chuyen mon| nghe nghiep| mem| ky thuat)?|chuyen mon|skills?|(?:technical|professional|soft|core) skills?|core competencies)$/i,
    ],
  },
  {
    key: "language",
    patterns: [
      /^(?:ngoai ngu|ngon ngu|languages?)$/i,
    ],
  },
  {
    key: "certificate",
    patterns: [
      /^(?:chung chi(?: & giay phep)?|chung nhan|certifications?|certificates?|licenses?)$/i,
    ],
  },
  {
    key: "course",
    patterns: [
      /^(?:(?:cac )?khoa hoc(?: lien quan)?|(?:cac )?mon hoc(?: lien quan| tieu bieu)?|(?:relevant |selected )?(?:courses?|coursework)|training courses?)$/i,
    ],
  },
  {
    key: "project",
    patterns: [
      /^(?:(?:cac )?du an(?: noi bat| tieu bieu| ca nhan)?|(?:(?:key|personal|selected|academic) )?projects?)$/i,
    ],
  },
  {
    key: "award",
    patterns: [
      /^(?:giai thuong(?: & danh hieu)?|thanh tich|awards?|honors?(?: & awards?)?|achievements?)$/i,
    ],
  },
  {
    key: "hobby",
    patterns: [
      /^(?:so thich(?: ca nhan)?|(?:personal )?(?:hobbies|interests)|hobbies (?:and|&) interests|interests (?:and|&) hobbies)$/i,
    ],
  },
  {
    key: "custom",
    patterns: [
      /^(?:hoat dong(?: cong dong| ngoai khoa| tinh nguyen)?|tinh nguyen|volunteer(?:ing| experience)?|extracurricular(?: activities)?|activities|community)$/i,
    ],
  },
];

function classifySectionHeader(line) {
  const clean = line.replace(/^[•·\-–—*+#|\d.)\s]+/, "").trim();
  const separator = clean.search(/[:：]/);
  const rawTitle = (separator === -1 ? clean : clean.slice(0, separator)).trim();
  if (!rawTitle || rawTitle.length > 55) return null;
  const folded = stripVietnameseDiacritics(rawTitle)
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return null;

  for (const entry of SECTION_PATTERNS) {
    if (entry.patterns.some((regex) => regex.test(folded))) {
      return { key: entry.key, rawTitle, content: separator === -1 ? "" : clean.slice(separator + 1).trim() };
    }
  }
  return null;
}

const EMAIL_EXTRACT_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12})/;
const PHONE_EXTRACT_REGEX = /((?:\+?84|0)\s*(?:\d[\s.-]?){8,10}\d)/;
const URL_EXTRACT_REGEX =
  /\b((?:https?:\/\/|httpsi\/i|www\.)[^\s,;)|]+|(?:github\.com|linkedin\.com|gitlab\.com)\/[a-zA-Z0-9._/-]+|[a-zA-Z0-9-]+\.(?:dev|io|vn|com|org|net|me)(?:\/[^\s,;)|]*)?)/gi;

const DATE_RANGE_REGEX =
  /\b((?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|(?:19|20)\d{2}-(?:0?[1-9]|1[0-2])|(?:19|20)\d{2})\s*[-–—~]\s*((?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|(?:19|20)\d{2}-(?:0?[1-9]|1[0-2])|(?:19|20)\d{2}|Hiện tại|Hien tai|Present|Now|Current)\b/i;

const SINGLE_DATE_REGEX =
  /\b((?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|(?:19|20)\d{2}-(?:0?[1-9]|1[0-2])|(?:19|20)\d{2})\b/;

const LOCATION_HINT_REGEX =
  /\b(?:Quận\s*\d+|Quan\s*\d+|Phường\s+[\p{L}\s]+|TP\.?\s*H[ồo3]\s*Ch[íi]\s*Minh|Hồ\s*Chí\s*Minh|Ho\s*Chi\s*Minh|Hà\s*Nội|Ha\s*Noi|Đà\s*Nẵng|Da\s*Nang|Cần\s*Thơ|Hải\s*Phòng|Bình\s*Dương|Đồng\s*Nai|Việt\s*Nam|Vietnam)\b/iu;

function normalizeExtractedUrl(rawUrl) {
  let cleaned = String(rawUrl || "")
    .trim()
    .replace(/^httpsi\/i/i, "https://")
    .replace(/[.,;)]+$/, "");
  if (!cleaned) return "";
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

function cleanOcrContactNoise(text) {
  return sanitizePlainText(text)
    .replace(/^[£§©®@✉☎📍🌐•·*|\-–—~_]+\s*/gu, "")
    .trim();
}

function extractLocationFromLine(line) {
  const clean = cleanOcrContactNoise(line);
  // Look for segments around Quận / TP. Hồ Chí Minh / Hà Nội / Đà Nẵng
  const parts = clean
    .split(/(?:[|•·]|@[a-z0-9.-]+|\b(?:\+?84|0)\d[\d\s.-]{7,10}\d|\bhttps?:\/\/\S+|\bhttpsi\/i\S+|\bgithub\.com\/\S+|\blinkedin\.com\/\S+)/i)
    .map((p) => cleanOcrContactNoise(p))
    .filter(Boolean);

  for (const part of parts) {
    if (LOCATION_HINT_REGEX.test(part) || LOCATION_HINT_REGEX.test(stripVietnameseDiacritics(part))) {
      return part
        .replace(/TP\.\s*H3\s*Chi\s*Minh/gi, "TP. Hồ Chí Minh")
        .replace(/TP\.H3\s*ChiMinh/gi, "TP. Hồ Chí Minh")
        .replace(/\bQuan\s+1,\s*TP\.?\s*Ho\s*Chi\s*Minh\b/gi, "Quận 1, TP. Hồ Chí Minh")
        .replace(/^[@£§\s-]+/, "")
        .trim();
    }
  }
  return "";
}

function parseExperienceBlock(lines = []) {
  const entries = [];
  let current = null;

  for (const rawLine of lines) {
    const line = sanitizePlainText(rawLine);
    if (!line) continue;

    const dateMatch = line.match(DATE_RANGE_REGEX);
    if (dateMatch) {
      const startDate = dateMatch[1];
      const endDate = /hien tai|present|now|current/i.test(stripVietnameseDiacritics(dateMatch[2]))
        ? "Hiện tại"
        : dateMatch[2];
      const withoutDate = sanitizePlainText(line.replace(dateMatch[0], " ").replace(/[|•·]+\s*$/, ""));

      if (!current || (current.startDate && (current.company || current.descriptionLines.length > 0))) {
        if (current) entries.push(current);
        current = {
          title: withoutDate || "Vị trí công việc",
          company: "",
          location: "",
          startDate,
          endDate,
          descriptionLines: [],
        };
      } else {
        current.startDate = startDate;
        current.endDate = endDate;
        if (withoutDate && !current.company) {
          const parts = withoutDate.split(/\s*[•·|«+]\s*/).filter(Boolean);
          current.company = parts[0] || "";
          if (parts[1] && !current.location) current.location = parts[1];
        }
      }
      continue;
    }

    if (!current) {
      current = {
        title: line.replace(/^[•·\-*]\s*/, ""),
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        descriptionLines: [],
      };
      continue;
    }

    if (!current.company && !/^[•·\-*]/.test(line) && current.descriptionLines.length === 0 && line.length <= 90) {
      const parts = line.split(/\s*[•·|«+]\s*/).filter(Boolean);
      current.company = (parts[0] || "").replace(/Công ty Cỏ phần/gi, "Công ty Cổ phần");
      if (parts[1]) current.location = parts[1];
      continue;
    }

    current.descriptionLines.push(line.replace(/^[•·\-*]\s*/, ""));
  }

  if (current) entries.push(current);

  return entries
    .filter((item) => item.title || item.company || item.descriptionLines.length)
    .map((item, idx) => ({
      id: `ocr-exp-${idx + 1}`,
      title: item.title || item.company || `Kinh nghiệm ${idx + 1}`,
      company: item.company || "",
      location: item.location || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      description: plainTextToSafeParagraphHtml(item.descriptionLines.join("\n")),
    }));
}

function parseEducationBlock(lines = []) {
  const entries = [];
  let current = null;

  for (const rawLine of lines) {
    const line = sanitizePlainText(rawLine);
    if (!line) continue;

    const dateMatch = line.match(DATE_RANGE_REGEX);
    if (dateMatch) {
      const startDate = dateMatch[1];
      const endDate = dateMatch[2];
      const withoutDate = sanitizePlainText(line.replace(dateMatch[0], " ").replace(/[|•·]+\s*$/, ""));

      if (!current || (current.startDate && (current.company || current.descriptionLines.length > 0))) {
        if (current) entries.push(current);
        current = {
          title: withoutDate || "",
          major: "",
          company: "",
          location: "",
          startDate,
          endDate,
          score: "",
          descriptionLines: [],
        };
      } else {
        current.startDate = startDate;
        current.endDate = endDate;
        if (withoutDate && !current.company) {
          const parts = withoutDate.split(/\s*[•·|«+]\s*/).filter(Boolean);
          current.company = parts[0] || "";
          if (parts[1]) current.location = parts[1];
        }
      }
      continue;
    }

    if (!current) {
      current = {
        title: line,
        major: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        score: "",
        descriptionLines: [],
      };
      continue;
    }

    const gpaMatch = line.match(/\b((?:GPA\s*)?\d\.\d{1,2}\s*\/\s*(?:4\.0|10(?:\.0)?)|GPA\s*[:\s]?\d\.\d{1,2})\b/i);
    if (gpaMatch) {
      current.score = gpaMatch[1].trim();
      const rest = sanitizePlainText(line.replace(gpaMatch[0], "").replace(/^[•·\-+|«\s]+|[•·\-+|«\s]+$/g, ""));
      if (rest && !current.major && rest.length <= 65) {
        current.major = rest.replace(/Khoa học Máy tinh/gi, "Khoa học Máy tính");
      } else if (rest) {
        current.descriptionLines.push(rest);
      }
      continue;
    }

    if (!current.company && current.descriptionLines.length === 0 && line.length <= 90) {
      const parts = line.split(/\s*[•·|«+]\s*/).filter(Boolean);
      current.company = parts[0] || "";
      if (parts[1]) current.location = parts[1];
      continue;
    }

    current.descriptionLines.push(line.replace(/^[•·\-*]\s*/, ""));
  }

  if (current) entries.push(current);

  return entries
    .filter((item) => item.title || item.company || item.major)
    .map((item, idx) => ({
      id: `ocr-edu-${idx + 1}`,
      title: item.title || item.major || item.company || `Học vấn ${idx + 1}`,
      major: item.major || "",
      company: item.company || "",
      location: item.location || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      score: item.score || "",
      description: plainTextToSafeParagraphHtml(item.descriptionLines.join("\n")),
    }));
}

const LIST_MARKER_REGEX = /^(?:[•·▪◦●]\s*|[-–—*+]\s+|\d{1,2}[.)]\s+)/u;

const SKILL_GROUP_PATTERNS = [
  /^(?:programming languages?|ngon ngu lap trinh)\b/,
  /^(?:(?:front|back)[ -]?end)(?: development| frameworks?)?\b/,
  /^(?:tools (?:and|&) cloud|cloud (?:and|&) tools|cloud (?:tools|platforms)|tools(?: (?:and|&) platforms)?|cong cu(?: (?:va|&) dam may)?|devops(?: (?:and|&) cloud)?)\b/,
  /^(?:databases?|co so du lieu|mobile development|testing tools)\b/,
  /^(?:spoken languages?|languages|ngoai ngu|ngon ngu)\b/,
];

function readSkillGroup(line) {
  const text = line.replace(LIST_MARKER_REGEX, "").trim();
  const folded = stripVietnameseDiacritics(text).toLowerCase();
  for (const pattern of SKILL_GROUP_PATTERNS) {
    const label = folded.match(pattern)?.[0];
    if (!label) continue;
    const suffix = text.slice(label.length);
    if (suffix && !/^[\s:：|–—-]/.test(suffix)) continue;
    return {
      title: text.slice(0, label.length),
      content: suffix.replace(/^[\s:：|–—-]+/, ""),
      isLanguage: pattern === SKILL_GROUP_PATTERNS.at(-1),
    };
  }
  return null;
}

function isListSpillover(text) {
  const folded = stripVietnameseDiacritics(text).toLowerCase().replace(/^[^\p{L}\p{N}.]+/u, "");
  return !folded ||
    EMAIL_EXTRACT_REGEX.test(text) ||
    PHONE_EXTRACT_REGEX.test(text) ||
    /(?:https?:\/\/|www\.|(?:github|linkedin|gitlab)\.com\/)/i.test(text) ||
    (/^[\d\s/–—.-]+$/.test(folded) && SINGLE_DATE_REGEX.test(folded)) ||
    /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|thang)\s+\d/i.test(folded) ||
    /^(?:viet\s?nam|ho chi minh(?: city)?|(?:tp\.?\s*)?ha noi|da nang|hanoi|hcmc|ho chi minh city\s+viet\s?nam)$/i.test(folded) ||
    LOCATION_HINT_REGEX.test(folded) ||
    /^(?:graduation|capstone|personal|academic|side|selected)\s+projects?\b/.test(folded) ||
    /\b(?:pdf parser|project description)\b/.test(folded) ||
    PROJECT_DESCRIPTION_START_REGEX.test(folded);
}

function readListValues(lines, unmappedLines) {
  const items = [];
  const seen = new Set();
  for (const rawLine of lines) {
    if (!rawLine) continue;
    const text = rawLine.replace(LIST_MARKER_REGEX, "").trim();
    // Check the entire line before splitting. Date ranges and addresses can contain list separators.
    if (isListSpillover(text)) {
      unmappedLines.push(rawLine);
      continue;
    }
    const parts = text
      .split(/[•·▪◦●,;|\n]|\s+[-–—]\s+/)
      .map((part) => sanitizePlainText(part.trim().replace(LIST_MARKER_REGEX, "")))
      .filter(Boolean);
    for (const part of parts) {
      if (part.length > 70 || isListSpillover(part)) {
        unmappedLines.push(part);
      } else if (!seen.has(part.toLowerCase())) {
        seen.add(part.toLowerCase());
        items.push(part);
      }
    }
  }
  return items;
}

function makeListItems(values, prefix) {
  return values.map((title, index) => ({ id: prefix + "-" + (index + 1), title }));
}

function readSkills(lines, unmappedLines) {
  const ungrouped = [];
  const groups = [];
  let currentLines = ungrouped;
  for (const line of lines) {
    if (!line) continue;
    const group = readSkillGroup(line);
    if (group) {
      currentLines = group.content ? [group.content] : [];
      groups.push({ title: group.title, lines: currentLines });
    } else {
      currentLines.push(line);
    }
  }

  const plainValues = readListValues(ungrouped, unmappedLines);
  const items = groups.flatMap((group, index) => {
    const values = readListValues(group.lines, unmappedLines);
    if (!values.length) return [];
    return [{
      id: "ocr-skill-group-" + (index + 1),
      title: group.title,
      description: plainTextToSafeParagraphHtml(values.join(", ")),
    }];
  });
  if (!items.length) return { skill: makeListItems(plainValues, "ocr-skill"), section: null };
  if (plainValues.length) {
    items.unshift({ id: "ocr-skill-group-general", description: plainTextToSafeParagraphHtml(plainValues.join(", ")) });
  }
  return {
    skill: [],
    section: {
      id: IMPORTED_SKILL_GROUPS_ID,
      title: "Kỹ năng",
      fields: { organization: false, location: false, dates: false, link: false, description: true },
      items,
    },
  };
}

function parseLanguageBlock(lines = []) {
  const results = [];
  const joined = lines.join("\n");
  const splitTokens = joined
    .split(/(?:[•·\n])/)
    .map((line) => sanitizePlainText(line))
    .filter(Boolean);

  for (let i = 0; i < splitTokens.length; i += 1) {
    const token = splitTokens[i];
    const parenMatch = token.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (parenMatch && splitTokens.length <= 4 && !/ielts|toeic|toefl|n[1-5]|hsk/i.test(parenMatch[1])) {
      results.push({
        id: `ocr-lang-${results.length + 1}`,
        title: sanitizePlainText(parenMatch[1]),
        description: sanitizePlainText(parenMatch[2]),
      });
      continue;
    }
    const dashParts = token.split(/\s*[:\-–—]\s*/);
    if (dashParts.length === 2) {
      results.push({
        id: `ocr-lang-${results.length + 1}`,
        title: dashParts[0],
        description: dashParts[1],
      });
      continue;
    }
    const nextToken = splitTokens[i + 1];
    if (
      nextToken &&
      /^(?:bản ngữ|ban ngu|fluent|native|intermediate|basic|advanced|sơ cấp|trung cấp|cao cấp|thành thạo)/i.test(
        nextToken,
      )
    ) {
      results.push({
        id: `ocr-lang-${results.length + 1}`,
        title: token,
        description: nextToken,
      });
      i += 1;
      continue;
    }
    results.push({
      id: `ocr-lang-${results.length + 1}`,
      title: token,
      description: "",
    });
  }

  return results;
}

const PROJECT_LABEL_REGEX = /^(?:project|du an)\s+\d{1,2}\s*[:：.)–—-]\s*/;
const PROJECT_DESCRIPTION_START_REGEX =
  /^(?:built|developed|implemented|designed|created|managed|used|added|fixed|optimized|integrated|applied|deployed|responsible for|worked on|xay dung|phat trien|trien khai|thiet ke|toi uu|tich hop|su dung|ap dung|phu trach|ho tro|viet)\b/;

function looksLikeProjectTitle(text) {
  if (!/^\p{Lu}/u.test(text) || text.length > 100 || /[:;,.!?]$|[:;!?]/.test(text)) return false;
    const folded = stripVietnameseDiacritics(text).toLowerCase();
  return !PROJECT_DESCRIPTION_START_REGEX.test(folded);
}

function projectLineParts(line) {
  const body = line.replace(LIST_MARKER_REGEX, "");
  const label = stripVietnameseDiacritics(body).toLowerCase().match(PROJECT_LABEL_REGEX)?.[0];
  const text = label ? body.slice(label.length) : body;
  const url = [...text.matchAll(URL_EXTRACT_REGEX)].find(([match]) =>
    /^(?:https?:\/\/|httpsi\/i|www\.)/i.test(match) || match.includes("/") || match === text,
  );
  const remainder = url
    ? text.replace(url[0], "")
      .replace(/^(?:link|url|repo(?:sitory)?|github|gitlab|demo|live demo|website|liên kết)\s*[:：]\s*$/i, "")
      .replace(/[\s|•·–—-]+$/, "")
    : text;
  const date = remainder.match(DATE_RANGE_REGEX)?.[0] || remainder.match(SINGLE_DATE_REGEX)?.[0] || "";
  const title = date
    ? remainder.replace(date, " ").replace(/^[\s|•·,:()–—-]+|[\s|•·,:()–—-]+$/g, "").replace(/\s+/g, " ")
    : remainder;
  return { text, title, date, link: url ? normalizeExtractedUrl(url[0]) : "", labeled: Boolean(label) };
}

function startsProject(lines, rows, index, previousDescription) {
  const { title, date, link } = rows[index];
  const nextIndex = rows[index + 1] === null ? index + 2 : index + 1;
  const next = rows[nextIndex];
  const followedByMetadata = next && !next.title && (next.date || next.link);
  const followedByBullet = next && LIST_MARKER_REGEX.test(lines[nextIndex]);
  if (!looksLikeProjectTitle(title)) return false;
  if (LIST_MARKER_REGEX.test(lines[index])) {
    return /^\d{1,2}[.)]\s+/.test(lines[index]) && (followedByMetadata || followedByBullet);
  }
  const words = title.split(/\s+/);
  const compactTitle = words.length <= 6 && words.every((word) => /^[\p{Lu}\p{N}][\p{L}\p{N}.+&/#-]*$/u.test(word));
  const followedByDescription = next && PROJECT_DESCRIPTION_START_REGEX.test(stripVietnameseDiacritics(next.text).toLowerCase());
  return date || followedByMetadata || followedByBullet || (compactTitle && (!previousDescription || /[.!?]$/.test(previousDescription))) ||
    (link && words.length <= 6) ||
    (followedByDescription && /[.!?]$/.test(previousDescription || "")) ||
    (rows[index - 1] === null && words.length <= 5);
}

function appendProjectDescription(project, text, newParagraph) {
  const previous = project.descriptionLines.at(-1);
  if (previous && !newParagraph) {
    project.descriptionLines[project.descriptionLines.length - 1] = previous + " " + text;
  } else {
    project.descriptionLines.push(text);
  }
}

function parseProjectBlock(lines = []) {
  const entries = [];
  const rows = lines.map((line) => line ? projectLineParts(line) : null);
  let current = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row) continue;
    const { text, title, date, link, labeled } = row;
    const metadataOnly = !title && (date || link);
    const hasContent = current && (current.descriptionLines.length || current.link || current.date);
    if (!current || (labeled && title) ||
      (!metadataOnly && hasContent && startsProject(lines, rows, index, current.descriptionLines.at(-1)))) {
      current = { title, date, link, descriptionLines: [] };
      entries.push(current);
    } else if (metadataOnly && ((date && !current.date) || (link && !current.link))) {
      current.date ||= date;
      current.link ||= link;
    } else if (!current.title && looksLikeProjectTitle(title)) {
      current.title = title;
    } else {
      const newParagraph = LIST_MARKER_REGEX.test(lines[index]) ||
        rows[index - 1] === null ||
        PROJECT_DESCRIPTION_START_REGEX.test(stripVietnameseDiacritics(text).toLowerCase());
      if (link && title && !current.link && !newParagraph) {
        current.link = link;
        appendProjectDescription(current, title, newParagraph);
      } else {
        appendProjectDescription(current, text, newParagraph);
      }
    }
  }

  return entries
    .filter((item) => item.title || item.date || item.link || item.descriptionLines.length)
    .map((item, idx) => ({
      id: `ocr-proj-${idx + 1}`,
      title: item.title || `Dự án ${idx + 1}`,
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      date: item.date || "",
      link: item.link || "",
      description: plainTextToSafeParagraphHtml(item.descriptionLines.join("\n")),
    }));
}

function parseCredentialBlock(lines = [], metaKey = "publisher", prefix = "ocr-cred") {
  const entries = [];
  let current = null;

  for (const rawLine of lines) {
    const line = sanitizePlainText(rawLine);
    if (!line) continue;

    const dateMatch = line.match(SINGLE_DATE_REGEX);
    if (dateMatch) {
      const dateStr = dateMatch[0];
      const rest = sanitizePlainText(line.replace(dateStr, " "));
      if (!current || current.date || current.descriptionLines.length > 0) {
        if (current) entries.push(current);
        current = {
          title: rest || "Chứng nhận",
          [metaKey]: "",
          date: dateStr,
          descriptionLines: [],
        };
      } else {
        current.date = dateStr;
        if (rest && !current[metaKey]) current[metaKey] = rest;
      }
      continue;
    }

    if (!current) {
      current = {
        title: line,
        [metaKey]: "",
        date: "",
        descriptionLines: [],
      };
      continue;
    }

    if (!current[metaKey] && current.descriptionLines.length === 0 && line.length <= 75) {
      current[metaKey] = line;
      continue;
    }

    current.descriptionLines.push(line.replace(/^[•·\-*]\s*/, ""));
  }

  if (current) entries.push(current);

  return entries
    .filter((item) => item.title)
    .map((item, idx) => ({
      id: `${prefix}-${idx + 1}`,
      title: item.title,
      [metaKey]: item[metaKey] || "",
      date: item.date || "",
      description: plainTextToSafeParagraphHtml(item.descriptionLines.join("\n")),
    }));
}

function parseCustomSectionBlock(title, lines = [], index = 0) {
  const cleanedLines = lines.map((l) => sanitizePlainText(l)).filter(Boolean);
  if (!cleanedLines.length) return null;

  const firstLine = cleanedLines[0];
  const dateMatch = firstLine.match(DATE_RANGE_REGEX);
  let itemTitle = firstLine;
  let startDate = "";
  let endDate = "";
  if (dateMatch) {
    startDate = dateMatch[1];
    endDate = /hien tai|present|now|current/i.test(stripVietnameseDiacritics(dateMatch[2]))
      ? "Hiện tại"
      : dateMatch[2];
    itemTitle = sanitizePlainText(firstLine.replace(dateMatch[0], " ")) || title;
  }

  let organization = "";
  let location = "";
  let link = "";
  const descriptionLines = [];
  const details = [];

  for (let i = 1; i < cleanedLines.length; i += 1) {
    const line = cleanedLines[i];
    const urlMatches = [...line.matchAll(URL_EXTRACT_REGEX)];
    if (urlMatches.length > 0 && line.replace(urlMatches[0][0], "").trim().length < 5) {
      link = normalizeExtractedUrl(urlMatches[0][0]);
      continue;
    }
    const kvMatch = line.match(/^([^:]{2,35}):\s*(.+)$/);
    if (kvMatch && i >= cleanedLines.length - 2) {
      details.push({
        id: `ocr-custom-det-${index + 1}-${details.length + 1}`,
        label: sanitizePlainText(kvMatch[1]),
        value: sanitizePlainText(kvMatch[2]),
      });
      continue;
    }
    if (!organization && i === 1 && line.length <= 80) {
      const parts = line.split(/\s*[•·|«+]\s*/).filter(Boolean);
      organization = parts[0] || "";
      if (parts[1]) location = parts[1];
      continue;
    }
    descriptionLines.push(line);
  }

  return {
    id: `ocr-custom-${index + 1}`,
    title: sanitizePlainText(title) || "Hoạt động bổ sung",
    content: "",
    fields: {
      organization: true,
      location: true,
      dates: true,
      link: true,
      description: true,
    },
    items: [
      {
        id: `ocr-custom-item-${index + 1}`,
        title: itemTitle,
        organization,
        location,
        startDate,
        endDate,
        link,
        description: plainTextToSafeParagraphHtml(descriptionLines.join("\n")),
        details,
      },
    ],
  };
}

function parseCourses(lines) {
  const items = lines
    .flatMap((line) => line.split(/[•▪◦●;|]/))
    .map((line) => line.trim().replace(LIST_MARKER_REGEX, ""))
    .filter(Boolean)
    .map((title, index) => ({ id: "ocr-course-" + (index + 1), title }));
  if (!items.length) return null;
  return {
    id: "ocr-courses",
    title: "Khóa học",
    fields: { organization: false, location: false, dates: false, link: false, description: false },
    items,
  };
}

function parseBio(lines) {
  const paragraphs = [];
  let paragraph = [];
  for (const line of lines) {
    if (line) {
      paragraph.push(line);
    } else if (paragraph.length) {
      paragraphs.push(paragraph.join(" "));
      paragraph = [];
    }
  }
  if (paragraph.length) paragraphs.push(paragraph.join(" "));
  return plainTextToSafeParagraphHtml(paragraphs.join("\n"));
}

export function mapExtractedTextToResumeDraft(
  linesOrText,
  options = { fileName: "", selectedTemplate: "modern", pageCount: 1, pageSummaries: [] },
) {
  const lines = normalizeExtractedLines(linesOrText);

  const personalInfo = {
    fullName: "",
    jobTitle: "",
    email: "",
    website: "",
    phone: "",
    location: "",
  };
  const profile = [];
  const buckets = {
    header: [],
    column: [],
    contact: [],
    profile: [],
    bio: [],
    experience: [],
    education: [],
    skill: [],
    language: [],
    certificate: [],
    course: [],
    project: [],
    award: [],
    hobby: [],
    custom: [],
  };
  let currentSection = "header";
  let hasSkillGroups = false;

  for (const line of lines) {
    if (line === OCR_COLUMN_BREAK) {
      currentSection = "column";
      hasSkillGroups = false;
      continue;
    }
    // Under Skills, "Languages" may be one of several skill groups.
    const skillGroup = currentSection === "skill" && readSkillGroup(line);
    if (skillGroup && (hasSkillGroups || !skillGroup.isLanguage)) {
      hasSkillGroups = true;
      buckets.skill.push(line);
      continue;
    }
    const headerMatch = classifySectionHeader(line);
    if (headerMatch) {
      currentSection = headerMatch.key;
      hasSkillGroups = false;
      if (currentSection === "custom") {
        buckets.custom.push({ title: headerMatch.rawTitle, lines: [] });
      } else if (buckets[currentSection].length && (currentSection === "project" || currentSection === "bio")) {
        buckets[currentSection].push("");
      }
    }

    const content = headerMatch ? headerMatch.content : line;
    if (headerMatch && !content) continue;
    if (currentSection === "custom") {
      buckets.custom.at(-1).lines.push(content);
    } else {
      buckets[currentSection].push(content);
    }
  }

  const headerAndContactLines = [...buckets.header, ...buckets.contact, ...buckets.profile, ...buckets.column];
  const remainingHeaderLines = [];
  const unmappedLines = [];

  for (const line of headerAndContactLines) {
    let matchedContactSignal = false;

    const emailMatch = line.match(EMAIL_EXTRACT_REGEX);
    if (emailMatch && !personalInfo.email) {
      personalInfo.email = emailMatch[1].toLowerCase();
      matchedContactSignal = true;
    }

    const phoneMatch = line.match(PHONE_EXTRACT_REGEX);
    if (phoneMatch && !personalInfo.phone) {
      personalInfo.phone = phoneMatch[1].replace(/\s+/g, "");
      matchedContactSignal = true;
    }

    const loc = extractLocationFromLine(line);
    if (loc && !personalInfo.location) {
      personalInfo.location = loc;
      matchedContactSignal = true;
    }

    const urlMatches = [...line.matchAll(URL_EXTRACT_REGEX)];
    for (const match of urlMatches) {
      const rawToken = match[1];
      if (rawToken.includes("@")) continue;
      const normalizedUrl = normalizeExtractedUrl(rawToken);
      if (/github\.com|linkedin\.com|gitlab\.com/i.test(rawToken)) {
        const cleanHandle = rawToken.replace(/^https?:\/\//i, "");
        if (!profile.some((item) => item.link.toLowerCase() === normalizedUrl.toLowerCase())) {
          const isGithub = /github/i.test(rawToken);
          profile.push({
            id: `ocr-prof-${profile.length + 1}`,
            networkName: isGithub ? `GitHub: ${cleanHandle}` : `LinkedIn: ${cleanHandle}`,
            username: cleanHandle.split("/").filter(Boolean).pop() || "",
            link: normalizedUrl,
          });
        }
        matchedContactSignal = true;
      } else if (!personalInfo.website) {
        personalInfo.website = normalizedUrl;
        matchedContactSignal = true;
      }
    }

    if (!matchedContactSignal) {
      if (buckets.header.includes(line)) remainingHeaderLines.push(line);
      else if (line && buckets.column.includes(line)) unmappedLines.push(line);
    }
  }

  // Fallback scan across all lines if email or phone was wrapped into another column
  if (!personalInfo.email || !personalInfo.phone) {
    const fullJoined = lines.join(" ");
    if (!personalInfo.email) {
      const m = fullJoined.match(EMAIL_EXTRACT_REGEX);
      if (m) personalInfo.email = m[1].toLowerCase();
    }
    if (!personalInfo.phone) {
      const m = fullJoined.match(PHONE_EXTRACT_REGEX);
      if (m) personalInfo.phone = m[1].replace(/\s+/g, "");
    }
  }

  for (const candidateLine of remainingHeaderLines) {
    const cleaned = cleanOcrContactNoise(candidateLine);
    if (!cleaned) continue;
    if (!personalInfo.fullName && cleaned.length >= 3 && cleaned.length <= 55 && !/\d{3,}/.test(cleaned)) {
      personalInfo.fullName = cleaned;
    } else if (!personalInfo.jobTitle && cleaned.length >= 3 && cleaned.length <= 75) {
      personalInfo.jobTitle = cleaned;
    } else {
      unmappedLines.push(cleaned);
    }
  }

  const bio = parseBio(buckets.bio);
  const experience = parseExperienceBlock(buckets.experience);
  const education = parseEducationBlock(buckets.education);
  const { skill, section: groupedSkills } = readSkills(buckets.skill, unmappedLines);
  const language = parseLanguageBlock(buckets.language);
  const certificate = parseCredentialBlock(buckets.certificate, "publisher", "ocr-cert");
  const project = parseProjectBlock(buckets.project);
  const award = parseCredentialBlock(buckets.award, "awarder", "ocr-award");
  const hobby = makeListItems(readListValues(buckets.hobby, unmappedLines), "ocr-hobby");

  const customSections = buckets.custom
    .map((block, index) => parseCustomSectionBlock(block.title, block.lines, index))
    .filter(Boolean);
  const courses = parseCourses(buckets.course);
  if (courses) customSections.push(courses);
  if (groupedSkills) customSections.unshift(groupedSkills);

  if (unmappedLines.length > 0 && !bio && experience.length === 0 && education.length === 0 &&
    !project.length && !skill.length && !groupedSkills && !hobby.length) {
    customSections.push({
      id: `ocr-custom-unmapped`,
      title: "Nội dung trích xuất cần kiểm tra",
      content: "",
      fields: {
        organization: false,
        location: false,
        dates: false,
        link: false,
        description: true,
      },
      items: [
        {
          id: "ocr-custom-unmapped-item-1",
          title: "Văn bản chưa phân mục tự động",
          organization: "",
          location: "",
          startDate: "",
          endDate: "",
          link: "",
          description: plainTextToSafeParagraphHtml(unmappedLines.join("\n")),
          details: [],
        },
      ],
    });
  }

  const baseFileName = sanitizePlainText(
    String(options.fileName || "")
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " "),
  );
  const defaultTitle = personalInfo.fullName
    ? `CV - ${personalInfo.fullName}`
    : baseFileName
      ? `CV nhập từ ${baseFileName}`
      : "CV nhập từ PDF";

  const selectedTemplate = RESUME_TEMPLATE_KEYS.includes(options.selectedTemplate)
    ? options.selectedTemplate
    : "modern";
  const pageCount = normalizeResumePageCount(
    options.pageCount || (Array.isArray(options.pageSummaries) && options.pageSummaries.length >= 2 ? 2 : 1),
  );

  const uncertainFields = [];
  if (!personalInfo.fullName) uncertainFields.push("fullName");
  if (!personalInfo.jobTitle) uncertainFields.push("jobTitle");
  if (!personalInfo.email) uncertainFields.push("email");
  if (!personalInfo.phone) uncertainFields.push("phone");
  if (experience.length === 0) uncertainFields.push("experience");
  if (education.length === 0) uncertainFields.push("education");
  if (!skill.length && !groupedSkills) uncertainFields.push("skill");

  const usedOcr = Array.isArray(options.pageSummaries) && options.pageSummaries.some((p) => p.source === "ocr");
  if (usedOcr && !uncertainFields.includes("location") && personalInfo.location) {
    uncertainFields.push("location");
  }

  return {
    draft: {
      title: defaultTitle,
      selectedTemplate,
      pageCount,
      image: "",
      personalInfo,
      bio,
      profile,
      experience,
      education,
      skill,
      language,
      certificate,
      project,
      award,
      hobby,
      customSections: normalizeCustomSections(customSections),
      layout: {
        version: 1,
        customizedTemplates: [],
      },
    },
    reviewNotes: {
      uncertainFields,
      unmappedLines,
      usedOcr,
    },
  };
}

export function sanitizeConfirmableResumePayload(draft = {}) {
  const safeTemplate = RESUME_TEMPLATE_KEYS.includes(draft.selectedTemplate)
    ? draft.selectedTemplate
    : "modern";
  const safePageCount = normalizeResumePageCount(draft.pageCount);
  const personalInfo = draft.personalInfo || {};

  const sanitizeRichOrPlain = (value) => {
    const str = String(value || "").trim();
    if (!str) return "";
    if (/^<p>.*<\/p>$/is.test(str) && !/<script|<iframe|onerror|onload|javascript:/i.test(str)) {
      return str;
    }
    return plainTextToSafeParagraphHtml(safeParagraphHtmlToPlainText(str));
  };

  return {
    title: sanitizePlainText(draft.title) || "CV nhập từ PDF",
    selectedTemplate: safeTemplate,
    pageCount: safePageCount,
    image: typeof draft.image === "string" && /^data:image\/|^https?:\/\//i.test(draft.image) ? draft.image : "",
    personalInfo: {
      fullName: sanitizePlainText(personalInfo.fullName),
      jobTitle: sanitizePlainText(personalInfo.jobTitle),
      email: sanitizePlainText(personalInfo.email),
      website: sanitizePlainText(personalInfo.website),
      phone: sanitizePlainText(personalInfo.phone),
      location: sanitizePlainText(personalInfo.location),
    },
    bio: sanitizeRichOrPlain(draft.bio),
    profile: (Array.isArray(draft.profile) ? draft.profile : [])
      .map((item) => {
        const rawLink = String(item?.link || item?.url || "").trim();
        const safeLink = /^javascript:/i.test(rawLink) ? "" : sanitizePlainText(rawLink);
        return {
          networkName: sanitizePlainText(item?.networkName),
          username: sanitizePlainText(item?.username),
          link: safeLink,
        };
      })
      .filter((item) => item.networkName || item.link),
    experience: (Array.isArray(draft.experience) ? draft.experience : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        company: sanitizePlainText(item?.company),
        location: sanitizePlainText(item?.location),
        startDate: sanitizePlainText(item?.startDate),
        endDate: sanitizePlainText(item?.endDate),
        description: sanitizeRichOrPlain(item?.description),
      }))
      .filter((item) => item.title || item.company || item.description),
    education: (Array.isArray(draft.education) ? draft.education : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        major: sanitizePlainText(item?.major),
        company: sanitizePlainText(item?.company),
        location: sanitizePlainText(item?.location),
        startDate: sanitizePlainText(item?.startDate),
        endDate: sanitizePlainText(item?.endDate),
        score: sanitizePlainText(item?.score),
        description: sanitizeRichOrPlain(item?.description),
      }))
      .filter((item) => item.title || item.company || item.major),
    skill: normalizeSkillNames(draft.skill).map((item) => ({
      title: sanitizePlainText(item.title),
    })).filter((item) => item.title),
    language: (Array.isArray(draft.language) ? draft.language : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        description: sanitizePlainText(item?.description),
      }))
      .filter((item) => item.title),
    certificate: (Array.isArray(draft.certificate) ? draft.certificate : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        date: sanitizePlainText(item?.date),
        publisher: sanitizePlainText(item?.publisher),
        description: sanitizeRichOrPlain(item?.description),
      }))
      .filter((item) => item.title),
    project: (Array.isArray(draft.project) ? draft.project : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        company: sanitizePlainText(item?.company),
        location: sanitizePlainText(item?.location),
        startDate: sanitizePlainText(item?.startDate),
        endDate: sanitizePlainText(item?.endDate),
        date: sanitizePlainText(item?.date),
        link: sanitizePlainText(item?.link),
        description: sanitizeRichOrPlain(item?.description),
      }))
      .filter((item) => item.title || item.description),
    award: (Array.isArray(draft.award) ? draft.award : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
        awarder: sanitizePlainText(item?.awarder),
        date: sanitizePlainText(item?.date),
        description: sanitizeRichOrPlain(item?.description),
      }))
      .filter((item) => item.title),
    hobby: (Array.isArray(draft.hobby) ? draft.hobby : [])
      .map((item) => ({
        title: sanitizePlainText(item?.title),
      }))
      .filter((item) => item.title),
    customSections: normalizeCustomSections(draft.customSections),
    layout: {
      version: 1,
      customizedTemplates: [],
    },
  };
}
