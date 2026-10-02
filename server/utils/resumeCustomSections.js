import { sanitizeRichText } from "./richTextSanitizer.js";
import { normalizeCustomSections } from "../../shared/resumeCustomSections.js";

export function sanitizeCustomSections(items) {
  return normalizeCustomSections(items).map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      description: sanitizeRichText(item.description),
      link: cleanLink(item.link),
    })),
  }));
}

function cleanLink(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
