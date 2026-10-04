import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeNewsCatalogue, sanitizeNews } from '../server/services/newsService.js';
import { formatNewsContent, parseNewsContent } from '../shared/newsContent.js';
const legacy = [{ slug: 'old', title: 'Old', sections: [] }];
test('draft and deleted overrides never resurrect legacy public news', () => {
  for (const status of ['Draft', 'Deleted']) assert.deepEqual(mergeNewsCatalogue(legacy, [{ slug: 'old', status }]), []);
  assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', status: 'Draft' }], true).length, 1);
  assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', status: 'Deleted' }], true).length, 0);
});
test('published news overrides static catalogue and appears publicly', () => { assert.equal(mergeNewsCatalogue(legacy, [{ slug: 'old', title: 'Edited', status: 'Published' }])[0].title, 'Edited'); });
test('news sanitization strips executable HTML and rejects invalid status/empty content', () => {
  const body = { title: '<script>alert(1)</script>Tin', summary: 'Tóm tắt', category: 'Nghề nghiệp', status: 'Published', sections: [{ heading: 'Mục', paragraphs: ['<b>Nội dung</b>'], bullets: [] }] };
  const safe = sanitizeNews(body); assert.equal(safe.title, 'Tin'); assert.equal(safe.sections[0].paragraphs[0], 'Nội dung');
  assert.throws(() => sanitizeNews({ ...body, status: 'Deleted' })); assert.throws(() => sanitizeNews({ ...body, sections: [] }));
});
test('news editor round trips headings paragraphs and bullet lists', () => {
  const sections = [{ heading: 'Mục', paragraphs: ['Đoạn văn'], bullets: ['Ý một', 'Ý hai'] }];
  assert.deepEqual(parseNewsContent(formatNewsContent(sections)), sections);
});
