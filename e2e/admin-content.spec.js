import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { sanitizeNews } from '../server/services/newsService.js';
import { NEWS_CATEGORIES } from '../shared/newsContent.js';

const respond = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const legacyArticle = (index) => ({ slug: `article-${index}`, title: `Bài viết ${index}`, category: 'Hướng dẫn CV', summary: 'Tóm tắt bài viết', intro: '', status: 'Published', sections: [{ heading: 'Nội dung cũ', paragraphs: ['Trước hình ảnh', 'Sau hình ảnh'], bullets: ['Ý thứ nhất'] }] });
async function mockAdmin(page) {
  const state = { articles: Array.from({ length: 35 }, (_, index) => legacyArticle(index)), saved: null, role: 'admin' };
  await page.route('**/socket.io/**', (route) => route.abort());
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/me') return respond(route, { user: { _id: 'admin-test', role: state.role, fullName: 'Quản trị viên', username: 'admin' } });
    if (path.startsWith('/api/admin/news') && ['POST', 'PUT'].includes(request.method())) {
      const fields = sanitizeNews(request.postDataJSON());
      state.saved = request.postDataJSON();
      const article = { ...fields, slug: path.split('/')[4] || 'new-article', date: '04/10/2026' };
      state.articles = [article, ...state.articles.filter((item) => item.slug !== article.slug)];
      return respond(route, { article });
    }
    if (path === '/api/admin/news') return respond(route, { articles: state.articles });
    if (path === '/api/news') return respond(route, state.articles);
    if (path === '/api/admin/jobs') return respond(route, { jobs: Array.from({ length: 35 }, (_, index) => ({ _id: `job-${index}`, title: `Công việc ${index}`, company: { name: 'Doanh nghiệp' }, description: 'Mô tả công việc cần xem ngay tại đây.', status: 'Active', approvalStatus: 'Approved', createdAt: '2026-10-01' })) });
    if (path === '/api/admin/companies') return respond(route, { companies: Array.from({ length: 35 }, (_, index) => ({ _id: `company-${index}`, fullName: `Doanh nghiệp ${index}`, username: `company-${index}`, email: `company${index}@example.test`, role: 'company', companyAccountStatus: 'Approved', status: 'active' })) });
    if (path.endsWith('/verification')) return respond(route, { message: 'Đã xác minh' });
    if (path.endsWith('unread-count')) return respond(route, { count: 0 });
    return respond(route, {});
  });
  return state;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Soạn rich text, chèn ảnh giữa nội dung và lưu bài viết (${viewport.width}px)`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const state = await mockAdmin(page);
    await page.goto('/admin/news');
    await page.getByRole('button', { name: 'Bài viết 0', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Chỉnh sửa bài viết' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Danh mục')).toHaveJSProperty('tagName', 'SELECT');
    await expect(dialog.getByLabel('Danh mục').locator('option')).toHaveCount(NEWS_CATEGORIES.length + 1);
    await expect(dialog.getByText('Dùng “# Tiêu đề mục”', { exact: false })).toHaveCount(0);
    const editor = dialog.getByRole('textbox', { name: 'Nội dung bài viết' });
    await expect(editor.locator('h2')).toHaveText('Nội dung cũ');
    await expect(editor.locator('li')).toHaveText('Ý thứ nhất');
    await editor.locator('p').filter({ hasText: 'Trước hình ảnh' }).click();
    await page.keyboard.press('End');
    await dialog.getByRole('button', { name: 'Chèn ảnh từ máy', exact: true }).click();
    await dialog.getByLabel('Chọn ảnh bài viết').setInputFiles({ name: 'rabbit-image.png', mimeType: 'image/png', buffer: readFileSync(new URL('../public/RabbitCV.png', import.meta.url)) });
    await expect(editor.locator('img')).toHaveCount(1);
    const blocks = await editor.evaluate((element) => [...element.children].map((node) => node.tagName === 'IMG' ? 'image' : node.textContent));
    expect(blocks.indexOf('image')).toBeGreaterThan(blocks.indexOf('Trước hình ảnh'));
    expect(blocks.indexOf('image')).toBeLessThan(blocks.indexOf('Sau hình ảnh'));
    await editor.locator('p').filter({ hasText: 'Sau hình ảnh' }).click();
    await page.keyboard.press('Home');
    await page.keyboard.down('Shift'); await page.keyboard.press('End'); await page.keyboard.up('Shift');
    await dialog.getByTitle('Bold', { exact: true }).click();
    await expect(editor.locator('strong')).toHaveText('Sau hình ảnh');
    await dialog.getByRole('button', { name: 'Lưu bài viết', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(state.saved.content).toContain('<img');
    expect(state.saved.content).toContain('<strong>Sau hình ảnh</strong>');
    await page.getByRole('button', { name: 'Bài viết 0', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Nội dung bài viết' }).locator('img')).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath(`news-editor-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
    state.role = 'employee';
    await page.goto('/News/article-0');
    await expect(page.locator('article .news-rich-text strong')).toHaveText('Sau hình ảnh', { timeout: 15000 });
    const image = page.locator('article .news-rich-text img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('article #section-0')).toHaveText('Nội dung cũ');
    await expect(page.getByRole('navigation', { name: 'Mục lục bài viết' }).getByRole('link', { name: 'Nội dung cũ' })).toHaveAttribute('href', '#section-0');
    await page.screenshot({ path: testInfo.outputPath(`news-public-${viewport.width}.png`) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });
}

for (const kind of ['news', 'jobs', 'companies']) {
  test(`Chi tiết admin ${kind} mở tại vị trí hiện tại và giữ vị trí danh sách khi đóng`, async ({ page }, testInfo) => {
    await mockAdmin(page);
    await page.goto(`/admin/${kind}`);
    const opener = kind === 'news' ? page.getByRole('button', { name: 'Bài viết 34', exact: true }) : kind === 'jobs' ? page.getByRole('button', { name: 'Công việc 34', exact: true }) : page.getByRole('button', { name: 'Xem hồ sơ', exact: true }).last();
    await opener.scrollIntoViewIfNeeded();
    const scroll = page.locator('main > div.overflow-y-auto');
    const before = await scroll.evaluate((element) => element.scrollTop);
    expect(before).toBeGreaterThan(300);
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(720);
    if (kind === 'companies') {
      await dialog.getByRole('button', { name: 'Xác minh doanh nghiệp', exact: true }).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
      await expect(dialog).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`admin-${kind}-dialog.png`) });
    await dialog.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(Math.abs(await scroll.evaluate((element) => element.scrollTop) - before)).toBeLessThan(2);
    await expect(opener).toBeFocused();
  });
}

test('Tạo bài mới bằng rich text và chèn ảnh từ URL', async ({ page }) => {
  const state = await mockAdmin(page);
  await page.goto('/admin/news');
  await page.getByRole('button', { name: 'Viết bài mới' }).click();
  const dialog = page.getByRole('dialog', { name: 'Bài viết mới' });
  await dialog.getByLabel('Tiêu đề', { exact: true }).fill('Bài viết mới có ảnh');
  await dialog.getByLabel('Danh mục').selectOption('Phỏng vấn');
  await dialog.getByLabel('Tóm tắt').fill('Chuẩn bị trước buổi phỏng vấn.');
  await dialog.getByRole('textbox', { name: 'Nội dung bài viết' }).fill('Nội dung phỏng vấn');
  await dialog.getByRole('button', { name: 'Chèn ảnh từ đường dẫn' }).click();
  await dialog.getByLabel('Đường dẫn ảnh').fill('javascript:alert(1)');
  await dialog.getByRole('button', { name: 'Chèn ảnh', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('hợp lệ');
  await dialog.getByLabel('Đường dẫn ảnh').fill(new URL('/RabbitCV.png', page.url()).href);
  await dialog.getByLabel('Mô tả ảnh').fill('RabbitCV');
  await dialog.getByRole('button', { name: 'Chèn ảnh', exact: true }).click();
  await expect(dialog.locator('.ProseMirror img')).toHaveAttribute('alt', 'RabbitCV');
  await dialog.getByRole('button', { name: 'Lưu bài viết' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.saved.category).toBe('Phỏng vấn');
  expect(state.saved.content).toContain('alt="RabbitCV"');
});
