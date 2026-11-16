import { RESUME_TEMPLATE_KEYS } from "../../shared/resumeTemplates.js";
import { IMPORTED_SKILL_GROUPS_ID } from "../../shared/resumeCustomSections.js";
export { RESUME_TEMPLATE_KEYS } from "../../shared/resumeTemplates.js";

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
  executive: {
    main: ["bio", "experience", "education", "project", "certificate", "award", "skill", "language", "hobby"],
    sidebar: [],
  },
  timeline: {
    main: ["bio", "experience", "project", "certificate"],
    sidebar: ["award", "skill", "language", "education", "hobby"],
  },
  editorial: {
    main: ["bio", "education", "experience", "project", "certificate", "award", "skill", "language", "hobby"],
    sidebar: [],
  },
  technology: {
    main: ["bio", "experience", "project", "award", "certificate"],
    sidebar: ["education", "skill", "language", "hobby"],
  },
  graduate: {
    main: ["education", "experience", "project", "skill", "bio", "certificate", "award", "language", "hobby"],
    sidebar: [],
  },
  nordic: {
    main: ["bio", "experience", "education", "project", "certificate", "award", "skill", "language", "hobby"],
    sidebar: [],
  },
  portfolio: {
    main: ["experience", "education", "project", "certificate", "award"],
    sidebar: ["bio", "skill", "language", "hobby"],
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
  const importedSkills = customSectionKey(IMPORTED_SKILL_GROUPS_ID);
  const placeImportedSkills = customKeys.includes(importedSkills) && !seen.has(importedSkills);

  for (const section of [...fallback.main, ...fallback.sidebar, ...customKeys]) {
    if (seen.has(section)) continue;
    const target = fallback.sidebar.includes(section) ? sidebar : main;
    target.push(section);
    seen.add(section);
  }

  if (placeImportedSkills) {
    main.splice(main.indexOf(importedSkills), 1);
    const skillZone = sidebar.includes("skill") ? sidebar : main;
    skillZone.splice(skillZone.indexOf("skill") + 1, 0, importedSkills);
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
