import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../utils/http.js';
import { NEWS_CATEGORIES, NEWS_CONTENT_LIMIT, newsSectionsToHtml } from '../../shared/newsContent.js';
import NewsEditor from '../Components/RichText/NewsEditor.jsx';
import AdminDetailDialog from '../Components/AdminDetailDialog.jsx';
import { publicNewsKey } from '../hooks/usePublicNews.js';
import { useConfirmDialog } from '../context/ConfirmDialogContext.jsx';
import { showToast } from '../utils/toast.js';
const blank = { title: '', category: '', summary: '', intro: '', content: '', status: 'Draft' };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500';
export default function AdminNews() {
  const client = useQueryClient();
  const confirm = useConfirmDialog();
  const [form, setForm] = useState(blank);
  const [slug, setSlug] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');
  const { data, isLoading, error: loadError } = useQuery({ queryKey: ['admin-news'], queryFn: () => fetchJson('/api/admin/news') });
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ['admin-news'] }), client.invalidateQueries({ queryKey: publicNewsKey })]);
  const startEdit = (article) => { setError(''); setSlug(article?.slug || null); setForm(article ? { ...blank, ...article, content: article.content || newsSectionsToHtml(article.sections) } : blank); setEditing(true); };
  const save = async (event) => {
    event.preventDefault();
    if (imageBusy || busy) return;
    if (new Blob([form.content]).size > NEWS_CONTENT_LIMIT) { setError('Nội dung và ảnh vượt quá 3 MB.'); return; }
    setBusy(true); setError('');
    try {
      const { title, category, summary, intro, content, status } = form;
      await fetchJson(slug ? `/api/admin/news/${slug}` : '/api/admin/news', { method: slug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, category, summary, intro, content, status }) });
      setEditing(false); await refresh(); showToast('Đã lưu bài viết.', 'success');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const remove = async (article) => {
    if (!(await confirm(`Xóa bài viết “${article.title}”?`))) return;
    setBusy(true);
    try { await fetchJson(`/api/admin/news/${article.slug}`, { method: 'DELETE' }); await refresh(); if (slug === article.slug) setEditing(false); }
    catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };
  const field = (name) => ({ name, id: `news-${name}`, value: form[name], onChange: (e) => setForm((old) => ({ ...old, [name]: e.target.value })) });
  return <div className="space-y-5 p-4 sm:p-8">
    <div className="flex items-center justify-between gap-3"><p className="text-slate-500">Đăng tin tức, cẩm nang nghề nghiệp và quản lý bài viết.</p><button type="button" disabled={busy} onClick={() => startEdit(null)} className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-white">Viết bài mới</button></div>
    {editing && <AdminDetailDialog title={slug ? 'Chỉnh sửa bài viết' : 'Bài viết mới'} busy={busy || imageBusy} onClose={() => setEditing(false)}><form onSubmit={save} className="space-y-4">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <fieldset disabled={busy || imageBusy} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><label>Tiêu đề<input required maxLength={250} className={inputClass} {...field('title')} /></label><label>Danh mục<select required className={inputClass} {...field('category')}><option value="" disabled>Chọn danh mục</option>{NEWS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
      <label className="block">Tóm tắt<textarea required maxLength={1500} rows={2} className={inputClass} {...field('summary')} /></label>
      <label className="block">Mở đầu<textarea maxLength={2000} rows={2} className={inputClass} {...field('intro')} /></label>
      </fieldset>
      <div className="space-y-2"><p className="font-medium">Nội dung</p><NewsEditor key={slug || 'new'} content={form.content} disabled={busy} onChange={(content) => setForm((old) => ({ ...old, content }))} onBusyChange={setImageBusy} /></div>
      <div><label htmlFor="news-status" className="block">Trạng thái</label><select disabled={busy || imageBusy} className={inputClass} {...field('status')}><option value="Draft">Bản nháp / Ẩn</option><option value="Published">Công khai</option></select></div>
      <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white py-3"><button disabled={busy || imageBusy} type="submit" className="rounded-lg bg-violet-600 px-5 py-2 text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu bài viết'}</button><button disabled={busy || imageBusy} type="button" onClick={() => setEditing(false)} className="rounded-lg border px-5 py-2">Hủy</button></div>
    </form></AdminDetailDialog>}
    {isLoading ? <p>Đang tải tin tức...</p> : loadError ? <p role="alert" className="text-red-700">{loadError.message}</p> : <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left"><thead className="bg-violet-50"><tr><th className="p-4">Bài viết</th><th className="p-4">Danh mục</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr></thead><tbody>{(data?.articles || []).map((article) => <tr key={article.slug} className="border-t"><td className="p-4"><button type="button" disabled={busy} onClick={() => startEdit(article)} className="font-semibold text-violet-700 hover:underline">{article.title}</button><p className="mt-1 max-w-lg text-xs text-slate-500">{article.summary}</p></td><td className="p-4">{article.category}</td><td className="p-4">{article.status === 'Published' ? 'Công khai' : 'Bản nháp / Ẩn'}</td><td className="p-4"><div className="flex gap-3"><button type="button" disabled={busy} onClick={() => startEdit(article)} className="text-violet-700">Sửa</button><button type="button" disabled={busy} onClick={() => remove(article)} className="text-red-700" aria-label={`Xóa ${article.title}`}>Xóa</button></div></td></tr>)}</tbody></table>{!data?.articles?.length && <p className="p-8 text-center text-slate-500">Chưa có bài viết.</p>}</div>}
  </div>;
}
