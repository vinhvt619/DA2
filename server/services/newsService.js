import { cleanAiText } from '../utils/aiDataSanitizer.js';
import { NEWS_CATEGORIES } from '../../shared/newsContent.js';
import { sanitizeNewsRichText } from '../utils/richTextSanitizer.js';
export function mergeNewsCatalogue(base, overrides, admin = false) {
  const articles = new Map(base.map((item) => [item.slug, { ...item, status: 'Published', legacy: true }]));
  for (const item of overrides) articles.set(item.slug, item);
  return [...articles.values()].filter((item) => item.status !== 'Deleted' && (admin || item.status === 'Published')).map((item) => ({
    ...item, sections: item.sections || [], intro: item.intro || '',
    date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : item.date || '',
  })).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
}
export function sanitizeNews(body = {}) {
  if (!['Draft', 'Published'].includes(body.status)) throw new Error('Trạng thái bài viết không hợp lệ.');
  const article = {
    title: cleanAiText(body.title, 250), summary: cleanAiText(body.summary, 1500), category: cleanAiText(body.category, 100), intro: cleanAiText(body.intro, 2000), status: body.status,
    content: sanitizeNewsRichText(body.content),
    sections: (Array.isArray(body.sections) ? body.sections : []).slice(0, 30).filter(Boolean).map((s) => ({
      heading: cleanAiText(s.heading, 250), paragraphs: (Array.isArray(s.paragraphs) ? s.paragraphs : []).slice(0, 50).map((p) => cleanAiText(p, 5000)).filter(Boolean), bullets: (Array.isArray(s.bullets) ? s.bullets : []).slice(0, 50).map((p) => cleanAiText(p, 2000)).filter(Boolean),
    })),
  };
  if (!NEWS_CATEGORIES.includes(article.category)) throw new Error('Vui lòng chọn danh mục bài viết hợp lệ.');
  const hasContent = article.content ? Boolean(cleanAiText(article.content, 5000).trim() || /<img\s/i.test(article.content)) : article.sections.some((s) => s.paragraphs.length || s.bullets.length);
  if (!article.title || !article.summary || !hasContent) throw new Error('Cần nhập tiêu đề, danh mục, tóm tắt và nội dung bài viết.');
  if (article.content) article.sections = [];
  return article;
}
