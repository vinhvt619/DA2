import { normalizeResumeDateValue } from "./dateInput.js";

export const DEFAULT_RESUME_TITLE = "CV mới của tôi";

export const AI_SECTION_LABELS = {
  title: "Tiêu đề CV",
  personalInfo: "Thông tin cá nhân",
  bio: "Giới thiệu bản thân",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skill: "Kỹ năng",
  project: "Dự án",
  certificate: "Chứng chỉ",
  award: "Giải thưởng",
  language: "Ngôn ngữ",
  hobby: "Sở thích",
};

const PERSONAL_FIELD_LABELS = {
  fullName: "Họ và tên",
  jobTitle: "Vị trí ứng tuyển",
  email: "Email",
  phone: "Số điện thoại",
  location: "Địa chỉ",
};

const ITEM_FIELD_LABELS = {
  company: "Công ty / Tổ chức",
  major: "Chuyên ngành",
  location: "Địa điểm",
  startDate: "Ngày bắt đầu",
  endDate: "Ngày kết thúc",
  date: "Thời gian",
  score: "Điểm số / Xếp loại",
  publisher: "Đơn vị cấp",
  awarder: "Đơn vị trao giải",
  link: "Liên kết",
  description: "Mô tả",
};

const SECTION_CONFIGS = [
  {
    sectionKey: "experience",
    generatedKey: "experiences",
    fields: ["title", "company", "location", "startDate", "endDate", "description"],
    identitySecondaryFields: ["company"],
    legacyContextFields: ["company", "location", "startDate", "endDate"],
    dateFields: ["startDate", "endDate"],
  },
  {
    sectionKey: "education",
    generatedKey: "education",
    fields: [
      "title",
      "major",
      "company",
      "location",
      "startDate",
      "endDate",
      "score",
      "description",
    ],
    identitySecondaryFields: ["company", "major"],
    legacyContextFields: ["company", "major", "location", "startDate", "endDate"],
    dateFields: ["startDate", "endDate"],
  },
  {
    sectionKey: "project",
    generatedKey: "projects",
    fields: [
      "title",
      "company",
      "location",
      "startDate",
      "endDate",
      "date",
      "link",
      "description",
    ],
    identitySecondaryFields: ["company"],
    legacyContextFields: ["company", "location", "startDate", "endDate", "date"],
    dateFields: ["startDate", "endDate", "date"],
    urlFields: ["link"],
  },
  {
    sectionKey: "certificate",
    generatedKey: "certificates",
    fields: ["title", "date", "publisher", "description"],
    identitySecondaryFields: ["publisher"],
    legacyContextFields: ["publisher", "date"],
    dateFields: ["date"],
  },
  {
    sectionKey: "award",
    generatedKey: "awards",
    fields: ["title", "awarder", "date", "description"],
    identitySecondaryFields: ["awarder"],
    legacyContextFields: ["awarder", "date"],
    dateFields: ["date"],
  },
  {
    sectionKey: "language",
    generatedKey: "languages",
    fields: ["title", "description"],
    identitySecondaryFields: [],
    legacyContextFields: [],
    dateFields: [],
  },
  {
    sectionKey: "hobby",
    generatedKey: "hobbies",
    fields: ["title"],
    identitySecondaryFields: [],
    legacyContextFields: [],
    dateFields: [],
  },
];

const EXECUTABLE_TEXT_PATTERN =
  /\b(?:DOMParser|innerHTML|outerHTML|querySelector|eval|document\.|window\.|console\.log)\b/i;

const DANGEROUS_SCHEME_PATTERN = /\b(?:javascript|vbscript|data):/i;

let generatedIdCounter = 0;
const createGeneratedId = (prefix) => {
  generatedIdCounter += 1;
  return `ai-${prefix}-${Date.now()}-${generatedIdCounter}`;
};

const createSkillId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : createGeneratedId("skill");

const decodeBasicHtmlEntities = (value) =>
  value
    .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

/**
 * Extract readable visible text from existing user fields without discarding
 * legitimate technical terminology (e.g. DOMParser, XML, window.location).
 */
export const stripExistingHtmlToText = (value) => {
  if (typeof value !== "string") return "";

  return decodeBasicHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Determine whether an existing user field is non-blank. Empty Tiptap markup
 * shells like `<p></p>`, `<p><br></p>`, and `&nbsp;` are treated as blank;
 * all genuine visible technical prose and non-text elements (`<img>`, `<hr>`) are preserved.
 */
export const hasExistingFieldValue = (value) => {
  if (typeof value !== "string") return Boolean(value);
  if (/<(?:img|svg|video|audio|iframe|hr)\b/i.test(value)) return true;
  return stripExistingHtmlToText(value).length > 0;
};

export const hasMeaningfulRichText = (value) => hasExistingFieldValue(value);

export const isSuspiciousResumeText = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  const decoded = value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return (
    EXECUTABLE_TEXT_PATTERN.test(decoded) ||
    DANGEROUS_SCHEME_PATTERN.test(decoded) ||
    /\bon\w+\s*=/i.test(decoded) ||
    (/(?:=>|\bfunction\b|\bconst\b|\blet\b|\bvar\b)/.test(decoded) &&
      /[{};]/.test(decoded))
  );
};

export const cleanGeneratedText = (value, maxLength = 2000) => {
  if (typeof value !== "string" || isSuspiciousResumeText(value)) return "";

  const cleaned = value
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

  return isSuspiciousResumeText(cleaned) ? "" : cleaned;
};

const cleanGeneratedDate = (value) => {
  const cleaned = cleanGeneratedText(value, 32);
  if (!cleaned) return "";
  if (/^(?:hiện tại|present)$/i.test(cleaned)) {
    return /^present$/i.test(cleaned) ? "Present" : "Hiện tại";
  }
  const normalized = normalizeResumeDateValue(cleaned);
  return /^\d{4}(?:-\d{2})?$/.test(normalized) ? normalized : "";
};

const cleanGeneratedUrl = (value) => {
  const cleaned = cleanGeneratedText(value, 500);
  if (!cleaned || !/^https?:\/\/\S+$/i.test(cleaned)) return "";
  try {
    const parsed = new URL(cleaned);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : "";
  } catch {
    return "";
  }
};

const normalizeTitle = (value) =>
  cleanGeneratedText(value, 200).toLocaleLowerCase("vi-VN");

const normalizeExistingValue = (value, maxLength = 2000) =>
  stripExistingHtmlToText(typeof value === "string" ? value : "")
    .slice(0, maxLength)
    .toLocaleLowerCase("vi-VN");

const cleanGeneratedItem = (item, fields, options = {}) => {
  const dateFieldSet = new Set(options.dateFields || []);
  const urlFieldSet = new Set(options.urlFields || []);

  return fields.reduce((result, field) => {
    const raw = item?.[field];
    const cleaned = dateFieldSet.has(field)
      ? cleanGeneratedDate(raw)
      : urlFieldSet.has(field)
        ? cleanGeneratedUrl(raw)
        : cleanGeneratedText(raw, field === "description" ? 2000 : 200);
    return {
      ...result,
      [field]: cleaned,
    };
  }, {});
};

const sanitizeAccountDate = (value) => {
  if (!value) return "";
  const cleaned = cleanGeneratedText(String(value), 40);
  if (!cleaned) return "";
  return normalizeResumeDateValue(cleaned);
};

export const getAccountLocation = (currentUser) => {
  if (!currentUser) return "";
  const raw =
    currentUser.address ||
    [currentUser.hometown, currentUser.country].filter(Boolean).join(", ");
  return cleanGeneratedText(raw, 240);
};

export const mapAccountExperience = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      id: item?._id || item?.id || `account-experience-${index}`,
      title: cleanGeneratedText(item?.position || item?.title || "", 160),
      company: cleanGeneratedText(item?.company || "", 160),
      location: cleanGeneratedText(item?.location || "", 160),
      startDate: sanitizeAccountDate(item?.startDate),
      endDate: sanitizeAccountDate(item?.endDate),
      description: cleanGeneratedText(item?.description || "", 2000),
    }))
    .filter((item) => item.title || item.company || item.description);

export const mapAccountEducation = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      id: item?._id || item?.id || `account-education-${index}`,
      title: cleanGeneratedText(item?.degree || item?.title || "", 160),
      company: cleanGeneratedText(item?.school || item?.company || "", 160),
      location: cleanGeneratedText(item?.location || "", 160),
      major: cleanGeneratedText(item?.major || "", 160),
      score: cleanGeneratedText(item?.score || "", 80),
      startDate: sanitizeAccountDate(item?.startDate),
      endDate: sanitizeAccountDate(item?.endDate),
      description: cleanGeneratedText(item?.description || "", 1200),
    }))
    .filter((item) => item.title || item.company || item.major || item.description);

const itemsMatchByIdentity = (itemA, itemB, secondaryFields = []) => {
  const titleA = normalizeExistingValue(itemA?.title, 200);
  const titleB = normalizeExistingValue(itemB?.title, 200);
  if (!titleA || titleA !== titleB) return false;

  for (const field of secondaryFields) {
    const valA = normalizeExistingValue(itemA?.[field], 200);
    const valB = normalizeExistingValue(itemB?.[field], 200);
    // Do not wildcard-match across differing or missing secondary keys (company, major, publisher, awarder).
    if (valA !== valB) {
      return false;
    }
  }
  return true;
};

const findUniqueIdentityIndex = (
  items,
  target,
  secondaryFields = [],
  excludedIndexes = null,
) => {
  const matches = [];
  for (let index = 0; index < items.length; index += 1) {
    if (excludedIndexes?.has(index)) continue;
    if (itemsMatchByIdentity(items[index], target, secondaryFields)) {
      matches.push(index);
    }
  }
  return matches.length === 1 ? matches[0] : -1;
};

const countMatchingIdentityItems = (items, target, secondaryFields = []) =>
  items.reduce(
    (count, candidate) =>
      itemsMatchByIdentity(candidate, target, secondaryFields)
        ? count + 1
        : count,
    0,
  );

const inferDefaultSecondaryFields = (fields = []) => {
  if (fields.includes("major")) return ["company", "major"];
  if (fields.includes("company")) return ["company"];
  if (fields.includes("publisher")) return ["publisher"];
  if (fields.includes("awarder")) return ["awarder"];
  return [];
};

export const mergeAiSection = (
  existingItems,
  generatedItems,
  fields,
  idPrefix,
  options = {},
) => {
  const existing = Array.isArray(existingItems) ? existingItems : [];
  const generated = (Array.isArray(generatedItems) ? generatedItems : [])
    .map((item) => cleanGeneratedItem(item, fields, options))
    .filter((item) => item.title);
  const usedGeneratedIndexes = new Set();
  const secondaryFields =
    options.identitySecondaryFields ?? inferDefaultSecondaryFields(fields);

  const mergedExisting = existing.map((item) => {
    const generatedIndex = findUniqueIdentityIndex(
      generated,
      item,
      secondaryFields,
      usedGeneratedIndexes,
    );

    const suggestion = generatedIndex >= 0 ? generated[generatedIndex] : {};
    if (generatedIndex >= 0) usedGeneratedIndexes.add(generatedIndex);

    return fields.reduce((result, field) => {
      const currentValue = result[field];
      const shouldReplace = !hasExistingFieldValue(currentValue);
      return shouldReplace && suggestion[field]
        ? { ...result, [field]: suggestion[field] }
        : result;
    }, item);
  });

  const additions = generated
    .filter((_, index) => !usedGeneratedIndexes.has(index))
    .map((item) => ({
      ...item,
      id: createGeneratedId(idPrefix),
    }));

  const appendGenerated = options.appendGenerated ?? existing.length === 0;

  return appendGenerated ? [...mergedExisting, ...additions] : mergedExisting;
};

export const mergeAiSkills = (existingItems, generatedItems) => {
  const safe = (items) =>
    (Array.isArray(items) ? items : []).filter(
      (item) =>
        cleanGeneratedText(item?.title, 200) &&
        !isSuspiciousResumeText(
          `${item?.title || ""} ${item?.description || ""}`,
        ),
    );
  const seen = new Set();
  return [...safe(existingItems), ...safe(generatedItems).slice(0, 8)].flatMap(
    (item) => {
      const title = cleanGeneratedText(item.title, 200);
      const key = normalizeTitle(title);
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{ id: item.id || createSkillId(), title }];
    },
  );
};

export const cleanAiFillResult = (result = {}) => ({
  targetRole: cleanGeneratedText(result?.targetRole, 160),
  bio: cleanGeneratedText(result?.bio, 1200),
  skills: (Array.isArray(result?.skills) ? result.skills : [])
    .slice(0, 8)
    .flatMap((item) => {
      if (
        isSuspiciousResumeText(
          `${item?.title || ""} ${item?.description || ""}`,
        )
      ) {
        return [];
      }
      const title = cleanGeneratedText(item?.title, 120);
      return title ? [{ title }] : [];
    }),
  experiences: (Array.isArray(result?.experiences) ? result.experiences : [])
    .slice(0, 8)
    .map((item) =>
      cleanGeneratedItem(
        item,
        ["title", "company", "location", "startDate", "endDate", "description"],
        { dateFields: ["startDate", "endDate"] },
      ),
    )
    .filter((item) => item.title),
  education: (Array.isArray(result?.education) ? result.education : [])
    .slice(0, 8)
    .map((item) =>
      cleanGeneratedItem(
        item,
        [
          "title",
          "major",
          "company",
          "location",
          "startDate",
          "endDate",
          "score",
          "description",
        ],
        { dateFields: ["startDate", "endDate"] },
      ),
    )
    .filter((item) => item.title),
  languages: (Array.isArray(result?.languages) ? result.languages : [])
    .slice(0, 8)
    .map((item) => cleanGeneratedItem(item, ["title", "description"]))
    .filter((item) => item.title),
  certificates: (Array.isArray(result?.certificates) ? result.certificates : [])
    .slice(0, 8)
    .map((item) =>
      cleanGeneratedItem(
        item,
        ["title", "date", "publisher", "description"],
        { dateFields: ["date"] },
      ),
    )
    .filter((item) => item.title),
  projects: (Array.isArray(result?.projects) ? result.projects : [])
    .slice(0, 8)
    .map((item) =>
      cleanGeneratedItem(
        item,
        [
          "title",
          "company",
          "location",
          "startDate",
          "endDate",
          "date",
          "link",
          "description",
        ],
        {
          dateFields: ["startDate", "endDate", "date"],
          urlFields: ["link"],
        },
      ),
    )
    .filter((item) => item.title),
  awards: (Array.isArray(result?.awards) ? result.awards : [])
    .slice(0, 8)
    .map((item) =>
      cleanGeneratedItem(
        item,
        ["title", "awarder", "date", "description"],
        { dateFields: ["date"] },
      ),
    )
    .filter((item) => item.title),
  hobbies: (Array.isArray(result?.hobbies) ? result.hobbies : [])
    .slice(0, 8)
    .map((item) => cleanGeneratedItem(item, ["title"]))
    .filter((item) => item.title),
});

const sanitizeContextFields = (item, fields, dateFields = []) =>
  cleanGeneratedItem(item, fields, { dateFields });

export const prepareAiFillInput = ({
  resumeData = {},
  currentUser = null,
  requestedTargetRole = "",
} = {}) => {
  const personalInfo = resumeData?.personalInfo || {};
  const existingExperience = Array.isArray(resumeData?.experience)
    ? resumeData.experience
    : [];
  const existingEducation = Array.isArray(resumeData?.education)
    ? resumeData.education
    : [];
  const accountExperience = mapAccountExperience(currentUser?.experiences);
  const accountEducation = mapAccountEducation(currentUser?.educations);
  const sourceExperience =
    existingExperience.length > 0 ? existingExperience : accountExperience;
  const sourceEducation =
    existingEducation.length > 0 ? existingEducation : accountEducation;

  const requestedRoleClean = cleanGeneratedText(requestedTargetRole, 160);
  const existingRoleVisible = stripExistingHtmlToText(personalInfo.jobTitle).slice(
    0,
    160,
  );
  const existingRoleForAi = cleanGeneratedText(personalInfo.jobTitle, 160);
  const latestAccountRole = cleanGeneratedText(
    sourceExperience.find((item) => stripExistingHtmlToText(item?.title))?.title || "",
    160,
  );
  const effectiveTargetRoleVisible =
    existingRoleVisible || requestedRoleClean || latestAccountRole;
  const effectiveTargetRoleForAi =
    existingRoleForAi || requestedRoleClean || latestAccountRole;

  const accountLocation = getAccountLocation(currentUser);
  const profileSeeds = {
    fullName: cleanGeneratedText(
      currentUser?.fullName || currentUser?.username || "",
      160,
    ),
    email: cleanGeneratedText(currentUser?.email || "", 320),
    phone: cleanGeneratedText(currentUser?.phoneNumber || "", 80),
    location: accountLocation,
    jobTitle: existingRoleVisible
      ? ""
      : requestedRoleClean || latestAccountRole || "",
    jobTitleOrigin: requestedRoleClean
      ? "user_role"
      : latestAccountRole
        ? "profile"
        : "",
  };

  const skills = Array.isArray(resumeData?.skill) ? resumeData.skill : [];
  const projects = Array.isArray(resumeData?.project) ? resumeData.project : [];
  const certificates = Array.isArray(resumeData?.certificate)
    ? resumeData.certificate
    : [];
  const languages = Array.isArray(resumeData?.language)
    ? resumeData.language
    : [];
  const awards = Array.isArray(resumeData?.award) ? resumeData.award : [];
  const hobbies = Array.isArray(resumeData?.hobby) ? resumeData.hobby : [];
  const profiles = Array.isArray(resumeData?.profile) ? resumeData.profile : [];

  const hasCareerContext =
    Boolean(effectiveTargetRoleVisible) ||
    hasExistingFieldValue(resumeData?.bio) ||
    sourceExperience.length > 0 ||
    sourceEducation.length > 0 ||
    skills.length > 0 ||
    projects.length > 0 ||
    certificates.length > 0;

  // Send only minimal sanitized career context to the AI endpoint (no auth tokens, user/doc IDs, avatars, or raw contact PII).
  const resumeContext = {
    personalInfo: {
      jobTitle: effectiveTargetRoleForAi,
    },
    bio: cleanGeneratedText(resumeData?.bio || "", 2500),
    experience: sourceExperience
      .map((item) =>
        sanitizeContextFields(
          item,
          ["title", "company", "location", "startDate", "endDate", "description"],
          ["startDate", "endDate"],
        ),
      )
      .filter((item) => item.title || item.company || item.description),
    education: sourceEducation
      .map((item) =>
        sanitizeContextFields(
          item,
          [
            "title",
            "major",
            "company",
            "location",
            "startDate",
            "endDate",
            "score",
            "description",
          ],
          ["startDate", "endDate"],
        ),
      )
      .filter((item) => item.title || item.company || item.major || item.description),
    skill: skills
      .filter(
        (item) =>
          cleanGeneratedText(item?.title, 120) &&
          !isSuspiciousResumeText(
            `${item?.title || ""} ${item?.description || ""}`,
          ),
      )
      .map((item) => ({ title: cleanGeneratedText(item.title, 120) })),
    language: languages
      .map((item) => sanitizeContextFields(item, ["title", "description"]))
      .filter((item) => item.title),
    certificate: certificates
      .map((item) =>
        sanitizeContextFields(
          item,
          ["title", "date", "publisher", "description"],
          ["date"],
        ),
      )
      .filter((item) => item.title),
    project: projects
      .map((item) =>
        sanitizeContextFields(
          item,
          [
            "title",
            "company",
            "location",
            "startDate",
            "endDate",
            "date",
            "description",
          ],
          ["startDate", "endDate", "date"],
        ),
      )
      .filter((item) => item.title),
    award: awards
      .map((item) =>
        sanitizeContextFields(
          item,
          ["title", "awarder", "date", "description"],
          ["date"],
        ),
      )
      .filter((item) => item.title),
    hobby: hobbies
      .map((item) => sanitizeContextFields(item, ["title"]))
      .filter((item) => item.title),
    profile: profiles
      .map((item) => ({
        networkName: cleanGeneratedText(item?.networkName || "", 120),
      }))
      .filter((item) => item.networkName),
  };

  return {
    hasCareerContext,
    effectiveTargetRole: effectiveTargetRoleVisible,
    latestAccountRole,
    requestedRoleClean,
    profileSeeds,
    accountExperience,
    accountEducation,
    resumeContext,
  };
};

const extractStandaloneNumbers = (text) => {
  if (!text) return [];
  const matches = text.match(/(?<![A-Za-zÀ-ỹ])\d+(?:[.,]\d+)?%?(?![A-Za-zÀ-ỹ])/g);
  return matches ? matches.map((token) => token.replace(/%$/, "")) : [];
};

const collectSourceText = (resumeData, currentUser, requestedRole) => {
  const parts = [];
  const pushString = (val) => {
    const visible = stripExistingHtmlToText(val).slice(0, 2500);
    if (visible) parts.push(visible);
  };

  pushString(requestedRole);
  pushString(resumeData?.title);
  pushString(resumeData?.bio);
  Object.values(resumeData?.personalInfo || {}).forEach(pushString);

  for (const key of [
    "experience",
    "education",
    "skill",
    "project",
    "certificate",
    "award",
    "language",
    "hobby",
  ]) {
    const list = Array.isArray(resumeData?.[key]) ? resumeData[key] : [];
    list.forEach((item) => {
      if (item && typeof item === "object") {
        Object.values(item).forEach((v) => {
          if (typeof v === "string") pushString(v);
        });
      }
    });
  }

  for (const accExp of mapAccountExperience(currentUser?.experiences)) {
    Object.values(accExp).forEach(pushString);
  }
  for (const accEdu of mapAccountEducation(currentUser?.educations)) {
    Object.values(accEdu).forEach(pushString);
  }

  return parts.join(" ");
};

const hasUngroundedNumbers = (candidateText, sourceText) => {
  const numbers = extractStandaloneNumbers(candidateText);
  if (numbers.length === 0) return false;
  if (!sourceText) return true;

  return numbers.some((num) => {
    const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tokenPattern = new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`);
    return !tokenPattern.test(sourceText);
  });
};

const buildIdentityObject = (item, secondaryFields = []) => {
  const identity = {
    title: stripExistingHtmlToText(item?.title || "").slice(0, 200),
  };
  for (const field of secondaryFields) {
    identity[field] = stripExistingHtmlToText(item?.[field] || "").slice(0, 200);
  }
  return identity;
};

const buildIdentityKey = (identity, secondaryFields = []) =>
  [
    normalizeExistingValue(identity.title, 200),
    ...secondaryFields.map((field) =>
      normalizeExistingValue(identity[field] || "", 200),
    ),
  ].join("|");

const buildItemContextSnapshot = (item, fields = []) =>
  fields.reduce((snapshot, field) => {
    snapshot[field] = normalizeExistingValue(item?.[field] ?? "", 2500);
    return snapshot;
  }, {});

const matchesItemContextSnapshot = (candidateItem, snapshot = {}, fields = []) =>
  fields.every(
    (field) =>
      normalizeExistingValue(candidateItem?.[field] ?? "", 2500) ===
      (snapshot[field] ?? ""),
  );

const getStableItemId = (item) => {
  const raw = item?.id ?? item?._id;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
};

const formatItemSummary = (item, fields) => {
  const parts = [];
  if (item.company) parts.push(item.company);
  if (item.major) parts.push(`Ngành: ${item.major}`);
  if (item.publisher) parts.push(item.publisher);
  if (item.awarder) parts.push(item.awarder);
  if (item.location) parts.push(item.location);
  const period = [item.startDate, item.endDate].filter(Boolean).join(" - ");
  if (period) parts.push(period);
  else if (item.date) parts.push(item.date);
  if (item.score) parts.push(`Điểm: ${item.score}`);
  if (item.link) parts.push(item.link);
  if (item.description && fields.includes("description")) {
    parts.push(item.description);
  }
  return parts.join(" • ") || item.title;
};

export const buildAiFillProposals = ({
  resumeData = {},
  currentUser = null,
  requestedTargetRole = "",
  generatedResult = {},
} = {}) => {
  const prepared = prepareAiFillInput({
    resumeData,
    currentUser,
    requestedTargetRole,
  });
  const cleanedAi = cleanAiFillResult(generatedResult);
  const sourceText = collectSourceText(
    resumeData,
    currentUser,
    prepared.requestedRoleClean,
  );
  const proposals = [];

  const personalInfo = resumeData?.personalInfo || {};
  const resolvedRole =
    prepared.effectiveTargetRole || cleanedAi.targetRole || "";
  const resolvedRoleOrigin = hasExistingFieldValue(personalInfo.jobTitle)
    ? "profile"
    : prepared.requestedRoleClean
      ? "user_role"
      : prepared.latestAccountRole
        ? "profile"
        : cleanedAi.targetRole
          ? "ai"
          : "";

  // 1. Personal info proposals from account profile / role (only when genuinely blank)
  for (const field of ["fullName", "email", "phone", "location", "jobTitle"]) {
    if (hasExistingFieldValue(personalInfo[field])) continue;

    let proposedValue = "";
    let origin = "profile";
    if (field === "jobTitle") {
      if (prepared.profileSeeds.jobTitle) {
        proposedValue = prepared.profileSeeds.jobTitle;
        origin = prepared.profileSeeds.jobTitleOrigin;
      } else if (cleanedAi.targetRole) {
        proposedValue = cleanedAi.targetRole;
        origin = "ai";
      }
    } else {
      proposedValue = prepared.profileSeeds[field];
    }

    if (!proposedValue) continue;
    const isAiOrigin = origin === "ai";
    proposals.push({
      id: `personalInfo:${field}`,
      sectionKey: "personalInfo",
      sectionLabel: AI_SECTION_LABELS.personalInfo,
      kind: "personal_field",
      field,
      fieldLabel: PERSONAL_FIELD_LABELS[field] || field,
      itemLabel: PERSONAL_FIELD_LABELS[field] || field,
      origin,
      originLabel:
        origin === "profile"
          ? "Từ hồ sơ tài khoản"
          : origin === "user_role"
            ? "Từ vị trí bạn nhập"
            : "AI đề xuất",
      defaultSelected: !isAiOrigin,
      requiresReview: isAiOrigin,
      reviewReason: isAiOrigin
        ? "Vị trí mục tiêu do AI suy đoán — cần xác nhận trước khi áp dụng."
        : "",
      beforeText: "Trống",
      afterText: proposedValue,
      value: proposedValue,
    });
  }

  // 2. Default CV title upgrade when still on default or empty
  const existingTitleVisible = stripExistingHtmlToText(resumeData?.title || "");
  if (
    resolvedRole &&
    (!hasExistingFieldValue(resumeData?.title) ||
      existingTitleVisible === DEFAULT_RESUME_TITLE)
  ) {
    const nextTitle = `CV ${resolvedRole}`;
    if (nextTitle !== existingTitleVisible) {
      const isAiRoleOnly = resolvedRoleOrigin === "ai";
      proposals.push({
        id: "title",
        sectionKey: "title",
        sectionLabel: AI_SECTION_LABELS.title,
        kind: "title",
        field: "title",
        fieldLabel: "Tiêu đề CV",
        itemLabel: "Tiêu đề CV",
        origin: isAiRoleOnly ? "ai" : resolvedRoleOrigin || "profile",
        originLabel: isAiRoleOnly
          ? "AI đề xuất"
          : resolvedRoleOrigin === "user_role"
            ? "Từ vị trí bạn nhập"
            : "Từ hồ sơ tài khoản",
        defaultSelected: !isAiRoleOnly,
        requiresReview: isAiRoleOnly,
        reviewReason: isAiRoleOnly
          ? "Tiêu đề dựa trên vị trí AI gợi ý — cần xác nhận."
          : "",
        beforeText: existingTitleVisible || "Trống",
        afterText: nextTitle,
        value: nextTitle,
      });
    }
  }

  // 3. Model-authored Bio is ALWAYS conservative opt-in (defaultSelected: false, requiresReview: true)
  if (!hasExistingFieldValue(resumeData?.bio) && cleanedAi.bio) {
    const bioHasNumbers = hasUngroundedNumbers(cleanedAi.bio, sourceText);
    proposals.push({
      id: "bio",
      sectionKey: "bio",
      sectionLabel: AI_SECTION_LABELS.bio,
      kind: "bio",
      field: "bio",
      fieldLabel: "Giới thiệu bản thân",
      itemLabel: "Tóm tắt mục tiêu nghề nghiệp",
      origin: "ai",
      originLabel: "AI đề xuất",
      defaultSelected: false,
      requiresReview: true,
      reviewReason: bioHasNumbers
        ? "Nội dung do AI viết và chứa số liệu chưa có trong dữ liệu gốc — cần xác nhận trước khi chọn."
        : "Nội dung do AI viết mới dựa trên ngữ cảnh hiện có — hãy kiểm tra và tự tích chọn nếu phù hợp.",
      beforeText: "Trống",
      afterText: cleanedAi.bio,
      value: cleanedAi.bio,
    });
  }

  // 4. Skills (AI suggestions only; always require explicit opt-in)
  const existingSkills = Array.isArray(resumeData?.skill)
    ? resumeData.skill
    : [];
  const existingSkillKeys = new Set(
    existingSkills
      .map((item) => normalizeExistingValue(item?.title, 200))
      .filter(Boolean),
  );
  const seenGeneratedSkills = new Set();
  cleanedAi.skills.forEach((skillItem, index) => {
    const key = normalizeTitle(skillItem.title);
    if (!key || existingSkillKeys.has(key) || seenGeneratedSkills.has(key)) {
      return;
    }
    seenGeneratedSkills.add(key);
    proposals.push({
      id: `new-item:skill:${key}:${index}`,
      sectionKey: "skill",
      sectionLabel: AI_SECTION_LABELS.skill,
      kind: "new_item",
      field: "title",
      fieldLabel: "Kỹ năng mới",
      itemLabel: skillItem.title,
      origin: "ai",
      originLabel: "AI đề xuất",
      defaultSelected: false,
      requiresReview: true,
      reviewReason:
        "Kỹ năng do AI gợi ý chưa có trong CV — chỉ áp dụng khi bạn tích chọn.",
      beforeText: "Chưa có trong CV",
      afterText: skillItem.title,
      targetIdentity: { title: skillItem.title },
      item: { title: skillItem.title },
    });
  });

  // 5. Structured sections: experience, education, project, certificate, award, language, hobby
  for (const config of SECTION_CONFIGS) {
    const {
      sectionKey,
      generatedKey,
      fields,
      identitySecondaryFields,
      legacyContextFields,
    } = config;
    const existingList = Array.isArray(resumeData?.[sectionKey])
      ? resumeData[sectionKey]
      : [];
    const generatedList = Array.isArray(cleanedAi[generatedKey])
      ? cleanedAi[generatedKey]
      : [];

    // Seed from user account profile ONLY when the CV section is completely empty
    const accountItems =
      sectionKey === "experience" && existingList.length === 0
        ? prepared.accountExperience
        : sectionKey === "education" && existingList.length === 0
          ? prepared.accountEducation
          : [];

    const profileProposalByIndex = new Map();
    accountItems.forEach((accItem, accIdx) => {
      const identity = buildIdentityObject(accItem, identitySecondaryFields);
      const idKey = buildIdentityKey(identity, identitySecondaryFields);
      const profileProposalId = `profile-item:${sectionKey}:${idKey}:${accIdx}`;
      profileProposalByIndex.set(accIdx, profileProposalId);
      proposals.push({
        id: profileProposalId,
        sectionKey,
        sectionLabel: AI_SECTION_LABELS[sectionKey],
        kind: "profile_item",
        fieldLabel: "Từ hồ sơ tài khoản",
        itemLabel: accItem.title || accItem.company || AI_SECTION_LABELS[sectionKey],
        origin: "profile",
        originLabel: "Từ hồ sơ tài khoản",
        defaultSelected: true,
        requiresReview: false,
        reviewReason: "",
        beforeText: "Chưa có trong CV",
        afterText: formatItemSummary(accItem, fields),
        identitySecondaryFields,
        targetIdentity: identity,
        item: { ...accItem },
      });
    });

    const isProfilePool = existingList.length === 0 && accountItems.length > 0;
    const matchPool = isProfilePool ? accountItems : existingList;
    const usedGeneratedIndexes = new Set();

    // Count duplicate stable IDs so ambiguous IDs cannot be enriched unsafely
    const idCounts = new Map();
    matchPool.forEach((item) => {
      const idVal = getStableItemId(item);
      if (idVal) idCounts.set(idVal, (idCounts.get(idVal) || 0) + 1);
    });

    matchPool.forEach((targetItem, targetIdx) => {
      // Skip enrichment if matchPool itself contains duplicate identical items (ambiguous identity)
      const identityMatchCount = countMatchingIdentityItems(
        matchPool,
        targetItem,
        identitySecondaryFields,
      );
      if (identityMatchCount !== 1) return;

      const generatedIndex = findUniqueIdentityIndex(
        generatedList,
        targetItem,
        identitySecondaryFields,
        usedGeneratedIndexes,
      );
      if (generatedIndex < 0) return;

      usedGeneratedIndexes.add(generatedIndex);
      const suggestion = generatedList[generatedIndex];

      const stableId = getStableItemId(targetItem);
      const hasDuplicateId = Boolean(stableId) && idCounts.get(stableId) > 1;
      const hasLegacySecondaryContext = legacyContextFields.some((field) =>
        hasExistingFieldValue(targetItem?.[field]),
      );
      // Refuse unsafe field enrichment when ID is missing without secondary context, or ID is duplicated
      if (hasDuplicateId || (!stableId && !hasLegacySecondaryContext)) {
        return;
      }

      const identity = buildIdentityObject(targetItem, identitySecondaryFields);
      const idKey = buildIdentityKey(identity, identitySecondaryFields);
      const contextSnapshot = buildItemContextSnapshot(targetItem, fields);
      const itemLabel =
        stripExistingHtmlToText(
          [
            targetItem.title,
            targetItem.company || targetItem.publisher || targetItem.awarder,
          ]
            .filter(Boolean)
            .join(" — "),
        ).slice(0, 160) || AI_SECTION_LABELS[sectionKey];

      fields.forEach((field) => {
        if (field === "title") return;
        const suggestedValue = suggestion[field];
        // Check existing target field via hasExistingFieldValue so legitimate technical text is never treated as blank
        if (hasExistingFieldValue(targetItem?.[field]) || !suggestedValue) {
          return;
        }

        const hasNumbers =
          field === "description" &&
          hasUngroundedNumbers(suggestedValue, sourceText);
        const reviewReason =
          sectionKey === "language"
            ? "Mức độ / mô tả ngoại ngữ do AI đề xuất — cần xác nhận."
            : field === "description"
              ? hasNumbers
                ? "Mô tả do AI viết và chứa số liệu chưa có trong hồ sơ — cần xác nhận trước khi chọn."
                : "Mô tả do AI đề xuất chưa có trong hồ sơ — hãy kiểm tra và tự tích chọn nếu phù hợp."
              : "Thông tin chi tiết (ngày tháng, đơn vị, đường dẫn, điểm số) do AI gợi ý — cần xác nhận.";

        proposals.push({
          id: `item-field:${sectionKey}:${stableId || idKey}:${targetIdx}:${field}`,
          sectionKey,
          sectionLabel: AI_SECTION_LABELS[sectionKey],
          kind: "item_field",
          field,
          fieldLabel: ITEM_FIELD_LABELS[field] || field,
          itemLabel,
          origin: "ai",
          originLabel: "AI đề xuất",
          defaultSelected: false,
          requiresReview: true,
          reviewReason,
          beforeText: "Trống",
          afterText: suggestedValue,
          identitySecondaryFields,
          targetIdentity: identity,
          targetSourceKind: isProfilePool ? "profile_item" : "existing",
          profileProposalId: isProfilePool
            ? profileProposalByIndex.get(targetIdx) || null
            : null,
          targetItemId: stableId || null,
          targetFields: [...fields],
          targetContextSnapshot: contextSnapshot,
          value: suggestedValue,
        });
      });
    });

    // Unmatched AI-generated items become explicit opt-in proposals (defaultSelected: false)
    const seenNewKeys = new Set(
      matchPool.map((item) =>
        buildIdentityKey(
          buildIdentityObject(item, identitySecondaryFields),
          identitySecondaryFields,
        ),
      ),
    );

    generatedList.forEach((genItem, genIdx) => {
      if (usedGeneratedIndexes.has(genIdx)) return;
      const identity = buildIdentityObject(genItem, identitySecondaryFields);
      const key = buildIdentityKey(identity, identitySecondaryFields);
      if (!identity.title || seenNewKeys.has(key)) return;
      seenNewKeys.add(key);

      proposals.push({
        id: `new-item:${sectionKey}:${key}:${genIdx}`,
        sectionKey,
        sectionLabel: AI_SECTION_LABELS[sectionKey],
        kind: "new_item",
        fieldLabel: "Mục mới AI đề xuất",
        itemLabel: genItem.title,
        origin: "ai",
        originLabel: "AI đề xuất",
        defaultSelected: false,
        requiresReview: true,
        reviewReason:
          "Mục mới do AI tự tạo chưa có trong hồ sơ — hãy kiểm tra kỹ trước khi tích chọn.",
        beforeText: "Chưa có trong CV",
        afterText: formatItemSummary(genItem, fields),
        identitySecondaryFields,
        targetIdentity: identity,
        item: { ...genItem },
      });
    });
  }

  return {
    prepared,
    cleanedAi,
    proposals,
  };
};

export const applySelectedAiProposals = (
  latestResume = {},
  proposals = [],
  selectedIds = [],
) => {
  const selectedSet =
    selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  const selectedProposals = (Array.isArray(proposals) ? proposals : []).filter(
    (proposal) => selectedSet.has(proposal.id),
  );

  if (selectedProposals.length === 0) {
    return {
      nextResume: latestResume,
      changed: false,
      appliedCount: 0,
      conflicts: [],
    };
  }

  let nextTitle = latestResume.title;
  const nextPersonalInfo = { ...(latestResume.personalInfo || {}) };
  let nextBio = latestResume.bio;
  const sectionDrafts = {
    experience: [...(Array.isArray(latestResume.experience) ? latestResume.experience : [])],
    education: [...(Array.isArray(latestResume.education) ? latestResume.education : [])],
    skill: [...(Array.isArray(latestResume.skill) ? latestResume.skill : [])],
    project: [...(Array.isArray(latestResume.project) ? latestResume.project : [])],
    certificate: [...(Array.isArray(latestResume.certificate) ? latestResume.certificate : [])],
    award: [...(Array.isArray(latestResume.award) ? latestResume.award : [])],
    language: [...(Array.isArray(latestResume.language) ? latestResume.language : [])],
    hobby: [...(Array.isArray(latestResume.hobby) ? latestResume.hobby : [])],
  };

  let appliedCount = 0;
  const conflicts = [];
  const addConflict = (proposal, reason) => {
    conflicts.push({
      id: proposal.id,
      sectionLabel: proposal.sectionLabel,
      itemLabel: proposal.itemLabel,
      reason,
    });
  };

  // Phase 1: scalar title, personalInfo fields, and bio
  for (const proposal of selectedProposals) {
    if (proposal.kind === "title") {
      const currentTitleVisible = stripExistingHtmlToText(nextTitle || "");
      if (
        hasExistingFieldValue(nextTitle) &&
        currentTitleVisible !== DEFAULT_RESUME_TITLE
      ) {
        addConflict(proposal, "Tiêu đề CV đã được chỉnh sửa.");
      } else if (proposal.value && currentTitleVisible !== proposal.value) {
        nextTitle = proposal.value;
        appliedCount += 1;
      }
    } else if (proposal.kind === "personal_field") {
      if (hasExistingFieldValue(nextPersonalInfo[proposal.field])) {
        addConflict(
          proposal,
          `${proposal.fieldLabel} đã có nội dung mới trong CV.`,
        );
      } else if (proposal.value) {
        nextPersonalInfo[proposal.field] = proposal.value;
        appliedCount += 1;
      }
    } else if (proposal.kind === "bio") {
      if (hasExistingFieldValue(nextBio)) {
        addConflict(
          proposal,
          "Mục Giới thiệu bản thân đã có nội dung mới.",
        );
      } else if (proposal.value) {
        nextBio = proposal.value;
        appliedCount += 1;
      }
    }
  }

  // Phase 2: profile-backed experience / education additions
  const appliedProfileProposalIds = new Set();
  for (const proposal of selectedProposals) {
    if (proposal.kind !== "profile_item") continue;
    const list = sectionDrafts[proposal.sectionKey];
    if (!list) continue;
    const duplicateExists = list.some((existingItem) =>
      itemsMatchByIdentity(
        existingItem,
        proposal.targetIdentity,
        proposal.identitySecondaryFields || [],
      ),
    );
    if (duplicateExists) {
      addConflict(proposal, "Mục hồ sơ này đã tồn tại trong CV.");
      continue;
    }
    list.push({
      ...proposal.item,
      id: proposal.item?.id || createGeneratedId(proposal.sectionKey),
    });
    appliedProfileProposalIds.add(proposal.id);
    appliedCount += 1;
  }

  // Phase 3: strict item-bound field updates evaluated against pre-mutation target state
  const prePhase3Snapshots = Object.fromEntries(
    Object.entries(sectionDrafts).map(([key, list]) => [key, [...list]]),
  );

  for (const proposal of selectedProposals) {
    if (proposal.kind !== "item_field") continue;
    const baseList = prePhase3Snapshots[proposal.sectionKey];
    const draftList = sectionDrafts[proposal.sectionKey];
    if (!baseList || !draftList) continue;

    if (
      proposal.targetSourceKind === "profile_item" &&
      !appliedProfileProposalIds.has(proposal.profileProposalId)
    ) {
      addConflict(
        proposal,
        "Mục hồ sơ tương ứng chưa được áp dụng nên không thể điền chi tiết.",
      );
      continue;
    }

    const fields = proposal.targetFields || [];
    const snapshot = proposal.targetContextSnapshot || {};

    let targetIndex;
    if (proposal.targetItemId) {
      const idMatches = [];
      baseList.forEach((item, idx) => {
        if (getStableItemId(item) === proposal.targetItemId) {
          idMatches.push(idx);
        }
      });
      if (idMatches.length !== 1) {
        addConflict(
          proposal,
          "Không còn tìm thấy đúng mục gốc trong CV (đã bị xóa, thay thế hoặc trùng ID).",
        );
        continue;
      }
      targetIndex = idMatches[0];
    } else {
      // Conservative fallback only for legacy items created without any ID
      const contextMatches = [];
      baseList.forEach((item, idx) => {
        if (
          !getStableItemId(item) &&
          matchesItemContextSnapshot(item, snapshot, fields)
        ) {
          contextMatches.push(idx);
        }
      });
      if (contextMatches.length !== 1) {
        addConflict(
          proposal,
          "Mục không có ID đã thay đổi, bị thay thế hoặc không còn duy nhất.",
        );
        continue;
      }
      targetIndex = contextMatches[0];
    }

    const baseItem = baseList[targetIndex];
    if (!matchesItemContextSnapshot(baseItem, snapshot, fields)) {
      addConflict(
        proposal,
        "Thông tin của mục gốc đã thay đổi trong lúc bạn xem trước.",
      );
      continue;
    }

    const currentItem = draftList[targetIndex];
    if (hasExistingFieldValue(currentItem?.[proposal.field])) {
      addConflict(
        proposal,
        `${proposal.fieldLabel} của "${proposal.itemLabel}" đã có nội dung.`,
      );
      continue;
    }

    draftList[targetIndex] = {
      ...currentItem,
      [proposal.field]: proposal.value,
    };
    appliedCount += 1;
  }

  // Phase 4: explicit opt-in new AI items (skills keep strictly { id, title })
  for (const proposal of selectedProposals) {
    if (proposal.kind !== "new_item") continue;
    const list = sectionDrafts[proposal.sectionKey];
    if (!list) continue;

    if (proposal.sectionKey === "skill") {
      const targetKey = normalizeTitle(proposal.item?.title);
      const duplicate = list.some(
        (existingSkill) =>
          normalizeExistingValue(existingSkill?.title, 200) === targetKey,
      );
      if (duplicate || !targetKey) {
        addConflict(proposal, "Kỹ năng này đã có trong CV.");
        continue;
      }
      list.push({
        id: createSkillId(),
        title: cleanGeneratedText(proposal.item.title, 120),
      });
      appliedCount += 1;
      continue;
    }

    const duplicateExists = list.some((existingItem) =>
      itemsMatchByIdentity(
        existingItem,
        proposal.targetIdentity,
        proposal.identitySecondaryFields || [],
      ),
    );
    if (duplicateExists) {
      addConflict(proposal, "Mục này đã tồn tại trong CV.");
      continue;
    }

    list.push({
      ...proposal.item,
      id: createGeneratedId(proposal.sectionKey),
    });
    appliedCount += 1;
  }

  if (appliedCount === 0) {
    return {
      nextResume: latestResume,
      changed: false,
      appliedCount: 0,
      conflicts,
    };
  }

  return {
    nextResume: {
      ...latestResume,
      title: nextTitle,
      personalInfo: nextPersonalInfo,
      bio: nextBio,
      ...sectionDrafts,
    },
    changed: true,
    appliedCount,
    conflicts,
  };
};
