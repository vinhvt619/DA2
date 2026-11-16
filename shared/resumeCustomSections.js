export const CUSTOM_SECTION_FIELDS = {
  organization: "Tổ chức / Đơn vị", location: "Địa điểm", dates: "Thời gian", link: "Liên kết", description: "Mô tả",
};
export const DEFAULT_CUSTOM_FIELDS = Object.fromEntries(Object.keys(CUSTOM_SECTION_FIELDS).map((key) => [key, true]));
export const IMPORTED_SKILL_GROUPS_ID = "ocr-skill-groups";
const text = (value, length) => typeof value === "string" ? value.trim().slice(0, length) : "";
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function normalizeCustomSections(sections) {
  const seen = new Set();
  return (Array.isArray(sections) ? sections : []).slice(0, 30).flatMap((section) => {
    if (!validId(section?.id) || seen.has(section.id)) return [];
    seen.add(section.id);
    const entryIds = new Set();
    // Preserve the rich-text block in CVs saved before grouped entries were introduced.
    const items = Array.isArray(section.items) ? section.items
      : section.content ? [{ id: `${section.id.slice(0, 70)}-legacy`, description: section.content }] : [];
    return [{ id: section.id, title: text(section.title, 120),
      fields: Object.fromEntries(Object.keys(CUSTOM_SECTION_FIELDS).map((key) => [key, section.fields?.[key] !== false])),
      items: items.slice(0, 50).flatMap((item, index) => {
        if (!item || typeof item !== "object") return [];
        const id = validId(item.id) ? item.id : `${section.id.slice(0, 60)}-entry-${index}`;
        if (entryIds.has(id)) return [];
        entryIds.add(id);
        return [{ id, title: text(item.title, 200), organization: text(item.organization, 200), location: text(item.location, 200),
          startDate: text(item.startDate, 40), endDate: text(item.endDate, 40), link: text(item.link, 2000), description: text(item.description, 50000),
          details: (Array.isArray(item.details) ? item.details : []).slice(0, 12).map((detail, detailIndex) => ({
            id: validId(detail?.id) ? detail.id : `${id.slice(0, 60)}-field-${detailIndex}`,
            label: text(detail?.label, 100), value: text(detail?.value, 2000),
          })).filter((detail) => detail.label || detail.value),
        }];
      }),
    }];
  });
}

export function normalizeSkillNames(items) {
  return (Array.isArray(items) ? items : []).flatMap((item) => {
    const title = text(item?.title, 200);
    return title ? [{ ...(item.id != null ? { id: item.id } : {}), ...(item._id ? { _id: item._id } : {}), title }] : [];
  });
}
