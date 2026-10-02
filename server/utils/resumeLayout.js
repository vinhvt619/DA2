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

export const RESUME_TEMPLATE_KEYS = [
  "classic",
  "modern",
  "professional",
  "elegant",
  "creative",
  "compact",
];

const cleanZone = (items, seen, keys) =>
  (Array.isArray(items) ? items : []).filter((item) => {
    if (!keys.includes(item) || seen.has(item)) return false;
    seen.add(item);
    return true;
  });

export const sanitizeResumeLayout = (layout, customSections = []) => {
  const keys = [...RESUME_SECTION_KEYS, ...customSections.map((item) => `custom:${item.id}`)];
  const byTemplate = {};
  for (const template of RESUME_TEMPLATE_KEYS) {
    const source = layout?.byTemplate?.[template];
    if (!source) continue;
    const seen = new Set();
    const main = cleanZone(source.main, seen, keys);
    const sidebar = cleanZone(source.sidebar, seen, keys);
    if (template === "compact") main.push(...sidebar.splice(0));
    for (const section of keys) {
      if (!seen.has(section)) main.push(section);
    }
    byTemplate[template] = { main, sidebar };
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
