import sanitizeHtml from "sanitize-html";
import { isNewsImageSource, NEWS_CONTENT_LIMIT } from '../../shared/newsContent.js';

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

export function sanitizeNewsRichText(value) {
  if (typeof value !== 'string') return '';
  if (Buffer.byteLength(value, 'utf8') > NEWS_CONTENT_LIMIT) throw new Error('Nội dung và ảnh vượt quá 3 MB. Hãy giảm số lượng hoặc kích thước ảnh.');
  return sanitizeHtml(value, {
    allowedTags: [...ALLOWED_TAGS, 'a', 'img'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
    exclusiveFilter: (frame) => frame.tag === 'img' && !isNewsImageSource(frame.attribs.src),
  });
}
