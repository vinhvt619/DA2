import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeNewsCatalogue, sanitizeNews } from '../server/services/newsService.js';
import { formatNewsContent, parseNewsContent, newsSectionsToHtml, NEWS_CONTENT_LIMIT } from '../shared/newsContent.js';
const legacy = [{ slug: 'old', title: 'Old', sections: [] }];
test('draft and deleted overrides never resurrect legacy public news', () => {
  for (const status of ['Draft', 'Deleted']) assert.deepEqual(mergeNewsCatalogue(legacy, [{ slug: 'old', status }]), []);
  assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', status: 'Draft' }], true).length, 1);
  assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', status: 'Deleted' }], true).length, 0);
});
test('published news overrides static catalogue and appears publicly', () => { assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', title: 'Edited', status: 'Published' }])[0].title, 'Edited'); });
test('news sanitization strips executable HTML and rejects invalid status/empty content', () => {
  const body = { title: '<script>alert(1)</script>Tin', summary: 'Tóm tắt', category: 'Kỹ năng nghề nghiệp', status: 'Published', sections: [{ heading: 'Mục', paragraphs: ['<b>Nội dung</b>'], bullets: [] }] };
  const safe = sanitizeNews(body); assert.equal(safe.title, 'Tin'); assert.equal(safe.sections[0].paragraphs[0], 'Nội dung');
  assert.throws(() => sanitizeNews({ ...body, status: 'Deleted' })); assert.throws(() => sanitizeNews({ ...body, sections: [] }));
});
test('news editor round trips headings paragraphs and bullet lists', () => {
  const sections = [{ heading: 'Mục', paragraphs: ['Đoạn văn'], bullets: ['Ý một', 'Ý hai'] }];
  assert.deepEqual(parseNewsContent(formatNewsContent(sections)), sections);
});

test('rich news preserves formatting and ordered images while removing executable content', () => {
  const body = { title: 'Tin', summary: 'Tóm tắt', category: 'Hướng dẫn CV', status: 'Published', content: '<h2>Tiêu đề</h2><p><strong>Trước ảnh</strong></p><img src="data:image/png;base64,aGVsbG8=" alt="Minh họa" onerror="alert(1)"><p><em>Sau ảnh</em></p><script>alert(1)</script><img src="javascript:alert(1)"><img src="data:image/svg+xml;base64,aGVsbG8="><a href="javascript:alert(1)">Link</a>' };
  const safe = sanitizeNews(body);
  assert.match(safe.content, /<h2>Tiêu đề<\/h2>/);
  assert.match(safe.content, /<strong>Trước ảnh<\/strong>.*<img.*<em>Sau ảnh<\/em>/);
  assert.match(safe.content, /alt="Minh họa"/);
  assert.doesNotMatch(safe.content, /script|onerror|javascript|svg/);
  assert.deepEqual(safe.sections, []);
});

test('news validates category, empty rich text and content payload size', () => {
  const body = { title: 'Tin', summary: 'Tóm tắt', category: 'Phỏng vấn', status: 'Draft', content: '<p>Nội dung</p>' };
  assert.throws(() => sanitizeNews({ ...body, category: 'Tự viết danh mục' }), /danh mục/);
  assert.throws(() => sanitizeNews({ ...body, content: '<p><br></p>' }), /nội dung/);
  assert.throws(() => sanitizeNews({ ...body, content: 'a'.repeat(NEWS_CONTENT_LIMIT + 1) }), /3 MB/);
});

test('legacy sections convert to rich text without interpreting text as HTML', () => {
  const html = newsSectionsToHtml([{ heading: 'Mục', paragraphs: ['<script>ví dụ</script>'], bullets: ['Một & hai'] }]);
  assert.equal(html, '<h2>Mục</h2><p>&lt;script&gt;ví dụ&lt;/script&gt;</p><ul><li><p>Một &amp; hai</p></li></ul>');
});
