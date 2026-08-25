import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "hr",
];

export const sanitizeRichText = (value) => {
  if (typeof value !== "string") return "";

  return sanitizeHtml(value, {
    allowedAttributes: {},
    allowedTags: ALLOWED_TAGS,
    disallowedTagsMode: "discard",
    nonTextTags: [
      "script",
      "style",
      "textarea",
      "option",
      "xmp",
      "iframe",
      "object",
      "embed",
      "svg",
      "math",
      "form",
    ],
  });
};
