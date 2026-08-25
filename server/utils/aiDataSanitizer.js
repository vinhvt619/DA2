const MAX_ARRAY_ITEMS = 20;

export const cleanAiText = (value, maxLength = 4000) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

export const looksLikeExecutableText = (value) => {
  const text = cleanAiText(value, 3000);
  if (!text) return false;

  return (
    /\b(?:DOMParser|innerHTML|outerHTML|querySelector|eval|document\.|window\.|console\.log)\b/i.test(
      text,
    ) ||
    /\bon\w+\s*=/i.test(text) ||
    (/(?:=>|\bfunction\b|\bconst\b|\blet\b|\bvar\b)/.test(text) &&
      /[{};]/.test(text))
  );
};

export const looksLikeEditorialBioAdvice = (value) => {
  const text = cleanAiText(value, 5000).toLocaleLowerCase("vi-VN");
  if (!text) return true;

  const directAdviceMarkers = [
    "hãy ",
    "bạn nên ",
    "ứng viên nên ",
    "cần bổ sung ",
    "cập nhật ",
    "đề xuất ",
    "gợi ý ",
    "viết lại ",
  ];
  const editorialMarkers = [
    "loại bỏ ",
    "sắp xếp lại ",
    "phần mô tả",
    "nhấn mạnh ",
    "thay thế ",
  ];

  const startsWithAdvice = directAdviceMarkers.some((marker) =>
    text.startsWith(marker),
  );
  const editorialMarkerCount = editorialMarkers.filter((marker) =>
    text.includes(marker),
  ).length;

  return startsWithAdvice || editorialMarkerCount >= 2;
};

const sanitizeList = (items, mapper) =>
  (Array.isArray(items) ? items : [])
    .slice(0, MAX_ARRAY_ITEMS)
    .map(mapper)
    .filter(Boolean);

const formatAiDate = (value) => {
  const date = cleanAiText(value, 80);
  const monthMatch = date.match(/^(\d{4})-(\d{2})$/);
  return monthMatch ? `${monthMatch[2]}/${monthMatch[1]}` : date;
};

const formatAiPeriod = (startDate, endDate) =>
  [formatAiDate(startDate), formatAiDate(endDate)]
    .filter(Boolean)
    .join(" - ");

export const sanitizeResumeForAi = (resume = {}) => ({
  targetRole: cleanAiText(resume.personalInfo?.jobTitle, 160),
  contactCompleteness: {
    fullName: Boolean(cleanAiText(resume.personalInfo?.fullName, 160)),
    email: Boolean(cleanAiText(resume.personalInfo?.email, 320)),
    phone: Boolean(cleanAiText(resume.personalInfo?.phone, 80)),
    location: Boolean(cleanAiText(resume.personalInfo?.location, 240)),
    website: Boolean(cleanAiText(resume.personalInfo?.website, 500)),
  },
  summary: cleanAiText(resume.bio, 2500),
  experience: sanitizeList(resume.experience, (item) => ({
    title: cleanAiText(item?.title, 160),
    company: cleanAiText(item?.company, 160),
    location: cleanAiText(item?.location, 160),
    period: formatAiPeriod(item?.startDate, item?.endDate),
    description: cleanAiText(item?.description, 2500),
  })),
  education: sanitizeList(resume.education, (item) => ({
    title: cleanAiText(item?.title, 160),
    major: cleanAiText(item?.major, 160),
    score: cleanAiText(item?.score, 80),
    institution: cleanAiText(item?.company, 160),
    period: formatAiPeriod(item?.startDate, item?.endDate),
    description: cleanAiText(item?.description, 1200),
  })),
  skills: sanitizeList(resume.skill, (item) => ({
    title: cleanAiText(item?.title, 120),
    description: cleanAiText(item?.description, 500),
    level: cleanAiText(item?.performance, 80),
  })).filter(
    (item) =>
      item.title &&
      !looksLikeExecutableText(`${item.title} ${item.description}`),
  ),
  projects: sanitizeList(resume.project, (item) => ({
    title: cleanAiText(item?.title, 160),
    period: formatAiDate(item?.date),
    description: cleanAiText(item?.description, 2000),
  })),
  certificates: sanitizeList(resume.certificate, (item) => ({
    title: cleanAiText(item?.title, 160),
    publisher: cleanAiText(item?.publisher, 160),
    date: formatAiDate(item?.date),
    description: cleanAiText(item?.description, 1000),
  })),
  languages: sanitizeList(resume.language, (item) => ({
    title: cleanAiText(item?.title, 120),
    description: cleanAiText(item?.description, 500),
  })),
  awards: sanitizeList(resume.award, (item) => ({
    title: cleanAiText(item?.title, 160),
    awarder: cleanAiText(item?.awarder, 160),
    date: formatAiDate(item?.date),
    description: cleanAiText(item?.description, 1000),
  })),
  hobbies: sanitizeList(resume.hobby, (item) =>
    cleanAiText(item?.title, 120),
  ),
  profiles: sanitizeList(resume.profile, (item) => ({
    network: cleanAiText(item?.networkName, 120),
    hasLink: Boolean(cleanAiText(item?.link, 500)),
  })),
});

export const sanitizeJobForAi = (job = {}) => ({
  title: cleanAiText(job.title, 180),
  company: cleanAiText(job.company, 180),
  location: cleanAiText(job.location, 180),
  type: cleanAiText(job.type, 80),
  experience: cleanAiText(job.experience, 120),
  education: cleanAiText(job.education, 120),
  workModel: cleanAiText(job.workModel, 120),
  description: cleanAiText(job.description, 4000),
  requirements: sanitizeList(job.requirements, (item) =>
    cleanAiText(item, 500),
  ),
  benefits: sanitizeList(job.benefits, (item) => cleanAiText(item, 500)),
  tags: sanitizeList(job.tags, (item) => cleanAiText(item, 100)),
});
