export const RESUME_SECTION_KEYS = [
  "bio",
  "experience",
  "education",
  "project",
  "certificate",
  "award",
  "skill",
  "language",
  "hobby",
];

export const RESUME_SECTION_LABELS = {
  bio: "Giới thiệu",
  experience: "Kinh nghiệm",
  education: "Học vấn",
  project: "Dự án",
  certificate: "Chứng chỉ",
  award: "Giải thưởng",
  skill: "Kỹ năng",
  language: "Ngoại ngữ",
  hobby: "Sở thích",
};

export const RESUME_TEMPLATE_KEYS = [
  "classic",
  "modern",
  "professional",
  "elegant",
  "creative",
  "compact",
];

export const DEFAULT_RESUME_LAYOUTS = {
  classic: {
    main: ["bio", "experience", "education", "project", "certificate"],
    sidebar: ["skill", "language", "award", "hobby"],
  },
  modern: {
    main: ["bio", "experience", "education", "project", "certificate"],
    sidebar: ["skill", "language", "award", "hobby"],
  },
  professional: {
    main: ["bio", "experience", "education", "project", "certificate"],
    sidebar: ["skill", "language", "award", "hobby"],
  },
  elegant: {
    main: ["bio", "experience", "education", "project", "certificate", "award"],
    sidebar: ["skill", "language", "hobby"],
  },
  creative: {
    main: ["bio", "experience", "project", "certificate", "award"],
    sidebar: ["skill", "education", "language", "hobby"],
  },
  compact: {
    main: [...RESUME_SECTION_KEYS],
    sidebar: [],
  },
};

export const customSectionKey = (id) => `custom:${id}`;

const uniqueKnownSections = (items, seen, keys) =>
  (Array.isArray(items) ? items : []).filter((item) => {
    if (!keys.includes(item) || seen.has(item)) return false;
    seen.add(item);
    return true;
  });

export const normalizeTemplateLayout = (layout, template = "modern", customSections = []) => {
  const safeTemplate = RESUME_TEMPLATE_KEYS.includes(template) ? template : "modern";
  const fallback = DEFAULT_RESUME_LAYOUTS[safeTemplate];
  const seen = new Set();
  const customKeys = customSections.map((item) => customSectionKey(item.id));
  const keys = [...RESUME_SECTION_KEYS, ...customKeys];
  const main = uniqueKnownSections(layout?.main, seen, keys);
  const sidebar = uniqueKnownSections(layout?.sidebar, seen, keys);

  for (const section of [...fallback.main, ...fallback.sidebar, ...customKeys]) {
    if (seen.has(section)) continue;
    const target = fallback.sidebar.includes(section) ? sidebar : main;
    target.push(section);
    seen.add(section);
  }

  if (safeTemplate === "compact") {
    return { main: [...main, ...sidebar], sidebar: [] };
  }

  return { main, sidebar };
};

export const normalizeResumeLayout = (layout, customSections = []) => {
  const byTemplate = {};
  const sourceTemplates = layout?.byTemplate || {};

  for (const template of RESUME_TEMPLATE_KEYS) {
    if (sourceTemplates[template]) {
      byTemplate[template] = normalizeTemplateLayout(
        sourceTemplates[template],
        template,
        customSections,
      );
    }
  }

  return {
    version: 1,
    customizedTemplates: Array.from(
      new Set(
        (Array.isArray(layout?.customizedTemplates)
          ? layout.customizedTemplates
          : []
        ).filter((template) => RESUME_TEMPLATE_KEYS.includes(template)),
      ),
    ),
    byTemplate,
  };
};

export const getTemplateLayout = (layout, template = "modern", customSections = []) => {
  const safeTemplate = RESUME_TEMPLATE_KEYS.includes(template) ? template : "modern";
  return normalizeTemplateLayout(layout?.byTemplate?.[safeTemplate], safeTemplate, customSections);
};

export const isTemplateLayoutCustomized = (layout, template) =>
  Array.isArray(layout?.customizedTemplates) &&
  layout.customizedTemplates.includes(template);

export const setTemplateLayout = (layout, template, nextZones, customSections = []) => {
  const normalized = normalizeResumeLayout(layout, customSections);
  return {
    ...normalized,
    customizedTemplates: Array.from(
      new Set([...normalized.customizedTemplates, template]),
    ),
    byTemplate: {
      ...normalized.byTemplate,
      [template]: normalizeTemplateLayout(nextZones, template, customSections),
    },
  };
};

export const resetTemplateLayout = (layout, template, customSections = []) => {
  const normalized = normalizeResumeLayout(layout, customSections);
  const byTemplate = { ...normalized.byTemplate };
  delete byTemplate[template];
  return {
    ...normalized,
    customizedTemplates: normalized.customizedTemplates.filter(
      (item) => item !== template,
    ),
    byTemplate,
  };
};
