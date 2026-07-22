const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "hr",
]);

const BLOCKED_CONTENT_TAGS = [
  "script", "style", "iframe", "object", "embed", "svg", "math", "form",
];

export const sanitizeRichText = (value) => {
  if (typeof value !== "string") return "";

  let sanitized = value.replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of BLOCKED_CONTENT_TAGS) {
    const blockPattern = new RegExp(
      `<\\s*${tag}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${tag}\\s*>`,
      "gi",
    );
    sanitized = sanitized.replace(blockPattern, "");
  }

  return sanitized.replace(
    /<\s*(\/?)\s*([a-z][a-z0-9-]*)\b[^>]*>/gi,
    (match, closing, rawTag) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (["br", "hr"].includes(tag)) return `<${tag}>`;
      return closing ? `</${tag}>` : `<${tag}>`;
    },
  );
};
