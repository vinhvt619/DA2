import {
  hasExistingFieldValue,
  stripExistingHtmlToText,
} from "./resumeAiFill.js";

export const REVIEW_CATEGORY_LABELS = {
  content: "Nội dung",
  clarity: "Rõ ràng",
  impact: "Thuyết phục",
  completeness: "Hoàn thiện",
  ats: "ATS",
};

export const REVIEW_PRIORITY_STYLES = {
  high: {
    label: "Ưu tiên cao",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  medium: {
    label: "Ưu tiên vừa",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  low: {
    label: "Ưu tiên thấp",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

export const REVIEW_SECTION_TARGETS = {
  personalInfo: {
    key: "personalInfo",
    canonicalLabel: "Thông tin liên hệ",
    type: "editor_section",
    sectionKey: "personalInfo",
    actionLabel: "Mở mục để sửa",
  },
  bio: {
    key: "bio",
    canonicalLabel: "Tiểu sử",
    type: "editor_section",
    sectionKey: "bio",
    actionLabel: "Mở mục để sửa",
  },
  experience: {
    key: "experience",
    canonicalLabel: "Kinh nghiệm",
    type: "editor_section",
    sectionKey: "experience",
    actionLabel: "Mở mục để sửa",
  },
  education: {
    key: "education",
    canonicalLabel: "Học vấn",
    type: "editor_section",
    sectionKey: "education",
    actionLabel: "Mở mục để sửa",
  },
  skill: {
    key: "skill",
    canonicalLabel: "Kỹ năng",
    type: "editor_section",
    sectionKey: "skill",
    actionLabel: "Mở mục để sửa",
  },
  project: {
    key: "project",
    canonicalLabel: "Dự án",
    type: "editor_section",
    sectionKey: "project",
    actionLabel: "Mở mục để sửa",
  },
  certificate: {
    key: "certificate",
    canonicalLabel: "Chứng chỉ",
    type: "editor_section",
    sectionKey: "certificate",
    actionLabel: "Mở mục để sửa",
  },
  language: {
    key: "language",
    canonicalLabel: "Ngoại ngữ",
    type: "editor_section",
    sectionKey: "language",
    actionLabel: "Mở mục để sửa",
  },
  award: {
    key: "award",
    canonicalLabel: "Giải thưởng",
    type: "editor_section",
    sectionKey: "award",
    actionLabel: "Mở mục để sửa",
  },
  layout: {
    key: "layout",
    canonicalLabel: "Bố cục và ATS",
    type: "layout_editor",
    sectionKey: "layout",
    actionLabel: "Mở mục để sửa",
  },
};

export const normalizeReviewSectionKey = (value) => {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[:,.\-–—()/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const ALIAS_TO_TARGET_KEY = new Map([
  ["thong tin lien he", "personalInfo"],
  ["thong tin ca nhan", "personalInfo"],
  ["lien he", "personalInfo"],
  ["ho so lien he", "personalInfo"],
  ["contact", "personalInfo"],
  ["contact info", "personalInfo"],
  ["personal info", "personalInfo"],
  ["tieu su", "bio"],
  ["gioi thieu", "bio"],
  ["gioi thieu ban than", "bio"],
  ["muc tieu nghe nghiep", "bio"],
  ["tom tat", "bio"],
  ["bio", "bio"],
  ["summary", "bio"],
  ["kinh nghiem", "experience"],
  ["kinh nghiem lam viec", "experience"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["hoc van", "education"],
  ["trinh do hoc van", "education"],
  ["education", "education"],
  ["ky nang", "skill"],
  ["ky nang chuyen mon", "skill"],
  ["skill", "skill"],
  ["skills", "skill"],
  ["du an", "project"],
  ["du an ca nhan", "project"],
  ["du an noi bat", "project"],
  ["project", "project"],
  ["projects", "project"],
  ["chung chi", "certificate"],
  ["certificate", "certificate"],
  ["certificates", "certificate"],
  ["ngoai ngu", "language"],
  ["ngon ngu", "language"],
  ["language", "language"],
  ["languages", "language"],
  ["giai thuong", "award"],
  ["award", "award"],
  ["awards", "award"],
  ["bo cuc va ats", "layout"],
  ["bo cuc cv", "layout"],
  ["bo cuc", "layout"],
  ["ats", "layout"],
  ["layout", "layout"],
]);

/**
 * Resolve an AI review section label to a fixed, allowlisted editor target.
 * Unrecognized labels, custom sections, and generic "Khác" intentionally return null.
 */
export const resolveReviewSectionTarget = (sectionName) => {
  const normalized = normalizeReviewSectionKey(sectionName);
  if (!normalized || normalized === "khac" || normalized === "other") {
    return null;
  }

  const targetKey = ALIAS_TO_TARGET_KEY.get(normalized);
  if (!targetKey) return null;
  return { ...REVIEW_SECTION_TARGETS[targetKey] };
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

/**
 * Validate and normalize an AI CV review response payload against the expected schema.
 * Rejects missing, wrong-typed, or corrupted payloads before UI rendering.
 */
export const validateAndNormalizeReviewResult = (rawResult) => {
  if (!isPlainObject(rawResult)) {
    throw new Error("Phản hồi review CV không đúng định dạng dữ liệu.");
  }

  if (
    typeof rawResult.overallScore !== "number" ||
    !Number.isFinite(rawResult.overallScore)
  ) {
    throw new Error("Phản hồi review CV thiếu điểm tổng thể hợp lệ.");
  }

  if (typeof rawResult.summary !== "string") {
    throw new Error("Phản hồi review CV thiếu nhận xét tổng quan hợp lệ.");
  }

  if (!isPlainObject(rawResult.categories)) {
    throw new Error("Phản hồi review CV thiếu điểm chi tiết theo tiêu chí.");
  }

  const categories = {};
  for (const key of Object.keys(REVIEW_CATEGORY_LABELS)) {
    const score = rawResult.categories[key];
    if (typeof score !== "number" || !Number.isFinite(score)) {
      throw new Error(`Điểm tiêu chí "${key}" trong review CV không hợp lệ.`);
    }
    categories[key] = Math.round(Math.min(100, Math.max(0, score)));
  }

  if (
    !Array.isArray(rawResult.strengths) ||
    !rawResult.strengths.every((item) => typeof item === "string")
  ) {
    throw new Error("Danh sách điểm tốt trong review CV không hợp lệ.");
  }

  if (!Array.isArray(rawResult.improvements)) {
    throw new Error("Danh sách điểm cần sửa trong review CV không hợp lệ.");
  }

  const improvements = rawResult.improvements.map((item) => {
    if (
      !isPlainObject(item) ||
      typeof item.section !== "string" ||
      typeof item.issue !== "string" ||
      typeof item.fix !== "string" ||
      !VALID_PRIORITIES.has(item.priority)
    ) {
      throw new Error("Mục đề xuất chỉnh sửa trong review CV không hợp lệ.");
    }

    return {
      section: item.section.trim() || "Khác",
      issue: item.issue.trim(),
      fix: item.fix.trim(),
      priority: item.priority,
    };
  }).filter((item) => item.issue || item.fix);

  if (
    !Array.isArray(rawResult.missingSections) ||
    !rawResult.missingSections.every((item) => typeof item === "string")
  ) {
    throw new Error("Danh sách mục còn thiếu trong review CV không hợp lệ.");
  }

  const seenMissing = new Set();
  const missingSections = [];
  for (const rawSection of rawResult.missingSections) {
    const trimmed = rawSection.trim();
    if (!trimmed) continue;
    const dedupKey = normalizeReviewSectionKey(trimmed) || trimmed.toLowerCase();
    if (seenMissing.has(dedupKey)) continue;
    seenMissing.add(dedupKey);
    missingSections.push(trimmed);
  }

  const strengths = rawResult.strengths
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    overallScore: Math.round(Math.min(100, Math.max(0, rawResult.overallScore))),
    summary: rawResult.summary.trim(),
    categories,
    strengths,
    improvements,
    missingSections,
  };
};

export const isReviewResultEmpty = (reviewResult) => {
  if (!reviewResult) return true;
  return (
    !reviewResult.summary &&
    (!reviewResult.strengths || reviewResult.strengths.length === 0) &&
    (!reviewResult.improvements || reviewResult.improvements.length === 0) &&
    (!reviewResult.missingSections || reviewResult.missingSections.length === 0)
  );
};

export const buildReviewSnapshotSignature = (resumeData = {}) => {
  const customSections = Array.isArray(resumeData.customSections)
    ? resumeData.customSections.map((section) => ({
        id: section?.id || "",
        title: section?.title || "",
        fields: section?.fields || {},
        items: Array.isArray(section?.items) ? section.items : [],
      }))
    : [];

  return JSON.stringify({
    title: typeof resumeData.title === "string" ? resumeData.title : "",
    selectedTemplate: resumeData.selectedTemplate || "",
    pageCount: resumeData.pageCount || 1,
    layout: resumeData.layout || null,
    personalInfo: resumeData.personalInfo || {},
    bio: typeof resumeData.bio === "string" ? resumeData.bio : "",
    profile: Array.isArray(resumeData.profile) ? resumeData.profile : [],
    experience: Array.isArray(resumeData.experience)
      ? resumeData.experience
      : [],
    education: Array.isArray(resumeData.education) ? resumeData.education : [],
    skill: Array.isArray(resumeData.skill) ? resumeData.skill : [],
    language: Array.isArray(resumeData.language) ? resumeData.language : [],
    certificate: Array.isArray(resumeData.certificate)
      ? resumeData.certificate
      : [],
    project: Array.isArray(resumeData.project) ? resumeData.project : [],
    award: Array.isArray(resumeData.award) ? resumeData.award : [],
    hobby: Array.isArray(resumeData.hobby) ? resumeData.hobby : [],
    customSections,
  });
};

export const hasReviewableResumeContent = (resumeData = {}) => {
  const personalInfo = resumeData?.personalInfo || {};
  return (
    stripExistingHtmlToText(personalInfo.jobTitle || "").length > 0 ||
    hasExistingFieldValue(resumeData?.bio || "") ||
    (Array.isArray(resumeData?.experience) && resumeData.experience.length > 0) ||
    (Array.isArray(resumeData?.education) && resumeData.education.length > 0) ||
    (Array.isArray(resumeData?.skill) && resumeData.skill.length > 0) ||
    (Array.isArray(resumeData?.project) && resumeData.project.length > 0) ||
    (Array.isArray(resumeData?.certificate) &&
      resumeData.certificate.length > 0) ||
    (Array.isArray(resumeData?.customSections) &&
      resumeData.customSections.some(
        (section) => Array.isArray(section?.items) && section.items.length > 0,
      ))
  );
};
