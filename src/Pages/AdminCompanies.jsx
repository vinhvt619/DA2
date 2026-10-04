import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { companyAccountStatus, isVerifiedCompany } from '../../shared/companyPolicy.js';
import { fetchJson } from '../utils/http.js';
import { showToast } from '../utils/toast.js';
import { useConfirmDialog } from '../context/ConfirmDialogContext.jsx';
import AdminDetailDialog from '../Components/AdminDetailDialog.jsx';

const labels = { pending: 'Chờ duyệt tài khoản', approved: 'Đã duyệt tài khoản', rejected: 'Tài khoản bị từ chối' };
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100';
const buttonClass = 'rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600 disabled:opacity-50';
const blankForm = { fullName: '', username: '', email: '', password: '', companyTaxCode: '', companyWebsite: '', verified: false };
function companyStatus(company) {
  if (company.isBanned) return 'suspended';
  const account = companyAccountStatus(company);
  return account === 'approved' ? isVerifiedCompany(company) ? 'verified' : 'unverified' : account;
}
export default function AdminCompanies() {
  const [params] = useSearchParams();
  const confirm = useConfirmDialog();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(params.get('status') || 'all');
  const [selectedId, setSelectedId] = useState('');
  const [reason, setReason] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blankForm);
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try { const data = await fetchJson('/api/admin/companies', { credentials: 'include' }); setCompanies(data.companies || []); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setFilter(params.get('status') || 'all'); }, [params]);
  const selected = companies.find((company) => company._id === selectedId);
  const visible = useMemo(() => companies.filter((company) => `${company.fullName || ''} ${company.username} ${company.email}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || companyStatus(company) === filter)), [companies, search, filter]);
  async function update(action) {
    if (action === 'reject' && !reason.trim()) { setError('Vui lòng nhập lý do từ chối tài khoản.'); return; }
    if (action === 'verify' && !await confirm('Xác minh doanh nghiệp này? Tin tuyển dụng mới và nội dung chỉnh sửa sẽ được công khai ngay, không cần duyệt từng tin.')) return;
    setBusy(selectedId); setError('');
    try {
      await fetchJson(`/api/admin/companies/${selectedId}/verification`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) });
      setReason(''); await fetchCompanies(); showToast('Đã cập nhật doanh nghiệp.', 'success');
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }
  async function create(event) {
    event.preventDefault(); setBusy('create'); setError('');
    try {
      await fetchJson('/api/admin/companies', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setForm(blankForm); setShowCreate(false); await fetchCompanies(); showToast('Đã tạo tài khoản doanh nghiệp.', 'success');
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  }
  return <div className="space-y-5 p-4 sm:p-8">
    <section className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-lg font-bold text-slate-900">Quản lý doanh nghiệp</h1><p className="mt-1 text-xs text-slate-500">Duyệt tài khoản và xác minh doanh nghiệp là hai bước độc lập.</p></div>
        <div className="flex gap-2"><button className={buttonClass} onClick={fetchCompanies}>Làm mới</button><button className={buttonClass} onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Đóng biểu mẫu' : 'Tạo tài khoản doanh nghiệp'}</button></div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input aria-label="Tìm doanh nghiệp" className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm doanh nghiệp hoặc email..." />
        <select aria-label="Lọc trạng thái doanh nghiệp" className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="pending">Chờ duyệt tài khoản</option><option value="unverified">Đã duyệt, chưa xác minh</option><option value="verified">Đã xác minh</option><option value="rejected">Tài khoản bị từ chối</option><option value="suspended">Đã khóa</option></select>
      </div>
    </section>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {showCreate && <form onSubmit={create} className="space-y-4 rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
      <h2 className="font-bold">Tạo tài khoản doanh nghiệp</h2><p className="text-xs text-slate-500">Tài khoản do admin tạo được duyệt ngay. Chỉ gắn nhãn xác minh khi đã kiểm tra thông tin doanh nghiệp.</p>
      <div className="grid gap-4 sm:grid-cols-2">{[['fullName', 'Tên doanh nghiệp', 'text', true], ['username', 'Tên đăng nhập', 'text', true], ['email', 'Email', 'email', true], ['password', 'Mật khẩu ban đầu', 'password', true], ['companyTaxCode', 'Mã số thuế', 'text', false], ['companyWebsite', 'Website', 'url', false]].map(([name, label, type, required]) => <label key={name} className="space-y-1 text-sm"><span>{label}{required ? ' *' : ''}</span><input className={inputClass} type={type} required={required} minLength={name === 'password' ? 8 : undefined} maxLength={name === 'password' ? 72 : undefined} autoComplete={name === 'password' ? 'new-password' : 'off'} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>)}</div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} /><span>Gắn nhãn đã xác minh — cho phép đăng tin ngay</span></label>
      <button disabled={Boolean(busy)} className={buttonClass} type="submit">{busy === 'create' ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
    </form>}
    {selected && <AdminDetailDialog title={selected.fullName || selected.username} busy={Boolean(busy)} onClose={() => setSelectedId('')}><div className="space-y-4">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">{[['Tên đăng nhập', selected.username], ['Email', selected.email], ['Mã số thuế', selected.companyTaxCode], ['Website', selected.companyWebsite], ['Địa chỉ', selected.address], ['Điện thoại', selected.phoneNumber]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="break-words">{value || 'Chưa cập nhật'}</dd></div>)}</dl>
      <p className="text-sm">{labels[companyAccountStatus(selected)]} · {isVerifiedCompany(selected) ? 'Đã xác minh: đăng tin ngay' : 'Chưa xác minh: tin cần admin duyệt'}</p>
      {selected.companyAccountRejectionReason && <p className="text-sm text-red-600">Lý do: {selected.companyAccountRejectionReason}</p>}
      {companyAccountStatus(selected) !== 'approved' && <label className="block space-y-1 text-sm"><span>Lý do từ chối tài khoản</span><textarea name="company-rejection-reason" className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} /></label>}
      <div className="flex flex-wrap gap-2">
        {companyAccountStatus(selected) !== 'approved' && <><button disabled={Boolean(busy)} className={buttonClass} onClick={() => update('approve')}>Duyệt tài khoản</button><button disabled={Boolean(busy)} className={buttonClass} onClick={() => update('reject')}>Từ chối tài khoản</button></>}
        {companyAccountStatus(selected) === 'approved' && !selected.isBanned && <button disabled={Boolean(busy)} className={buttonClass} onClick={() => update(isVerifiedCompany(selected) ? 'unverify' : 'verify')}>{isVerifiedCompany(selected) ? 'Thu hồi xác minh' : 'Xác minh doanh nghiệp'}</button>}
        <button disabled={Boolean(busy)} className={buttonClass} onClick={() => update(selected.isBanned ? 'restore' : 'suspend')}>{selected.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</button>
      </div>
    </div></AdminDetailDialog>}
    <section className="rounded-xl border border-violet-100 bg-white shadow-sm">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải doanh nghiệp...</p> : !visible.length ? <p className="p-8 text-center text-sm text-slate-500">Không có doanh nghiệp phù hợp.</p> : <ul className="divide-y divide-slate-100">{visible.map((company) => <li key={company._id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0"><p className="font-semibold">{company.fullName || company.username}</p><p className="break-words text-xs text-slate-500">{company.email}</p><p className="mt-2 text-xs text-slate-600">{company.isBanned ? 'Đã khóa' : labels[companyAccountStatus(company)]} · {isVerifiedCompany(company) ? 'Đã xác minh' : 'Chưa xác minh'} · {company.jobCount || 0} tin</p></div>
        <button className={buttonClass} onClick={() => { setSelectedId(company._id); setReason(''); setError(''); }}>Xem hồ sơ</button>
      </li>)}</ul>}
    </section>
  </div>;
}
