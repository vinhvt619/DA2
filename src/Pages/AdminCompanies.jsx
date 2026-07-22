import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BuildingOffice2Icon,
  CheckIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "react-router-dom";

const statusMeta = {
  pending: { label: "Chờ xác minh", className: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Đã xác minh", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Từ chối", className: "bg-rose-50 text-rose-700 border-rose-200" },
  suspended: { label: "Đã khóa", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function AdminCompanies() {
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("status") || "all");

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies", { credentials: "include" });
      if (!response.ok) throw new Error("Không thể tải danh sách doanh nghiệp");
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Lỗi tải danh sách doanh nghiệp:", error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setFilter(searchParams.get("status") || "all"); }, [searchParams]);

  const getCompanyStatus = (company) => {
    if (company.isBanned) return company.verificationStatus === "rejected" ? "rejected" : "suspended";
    return company.verificationStatus || "verified";
  };

  const updateCompany = async (id, action) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/companies/${id}/verification`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Không thể cập nhật doanh nghiệp");
      await fetchCompanies();
    } catch (error) {
      console.error("Lỗi cập nhật doanh nghiệp:", error);
    } finally {
      setProcessingId("");
    }
  };

  const visibleCompanies = useMemo(() => companies.filter((company) => {
    const name = (company.fullName || company.username || "").toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || (company.email || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "all" || getCompanyStatus(company) === filter);
  }), [companies, filter, search]);

  return (
    <div className="space-y-6 p-8">
      <section className="rounded-[10px] border border-violet-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><BuildingOffice2Icon className="h-5 w-5" /></span><h2 className="text-base font-bold text-slate-900">Danh sách doanh nghiệp</h2></div>
            <p className="mt-2 text-xs text-slate-500">Duyệt tài khoản mới, khóa tài khoản vi phạm và theo dõi tin tuyển dụng đang hoạt động.</p>
          </div>
          <button type="button" onClick={fetchCompanies} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-violet-200 hover:text-violet-700"><ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm doanh nghiệp hoặc email..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-violet-300 focus:bg-white" /></label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-300"><option value="all">Tất cả trạng thái</option><option value="pending">Chờ xác minh</option><option value="verified">Đã xác minh</option><option value="suspended">Đã khóa</option><option value="rejected">Từ chối</option></select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-violet-100 bg-white shadow-sm">
        {loading ? <div className="grid min-h-56 place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div> : visibleCompanies.length === 0 ? <div className="p-12 text-center text-sm font-medium text-slate-400">Không có doanh nghiệp phù hợp.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-6 py-3">Doanh nghiệp</th><th className="px-6 py-3">Lĩnh vực</th><th className="px-6 py-3 text-center">Tin đang đăng</th><th className="px-6 py-3">Trạng thái</th><th className="px-6 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleCompanies.map((company) => { const status = getCompanyStatus(company); const meta = statusMeta[status]; const busy = processingId === company._id; return <tr key={company._id} className="hover:bg-violet-50/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">{(company.fullName || company.username || "DN").slice(0, 2).toUpperCase()}</span><span><span className="block text-[13px] font-bold text-slate-800">{company.fullName || company.username}</span><span className="mt-0.5 block text-[11px] text-slate-400">{company.email}</span></span></div></td><td className="px-6 py-4 text-xs text-slate-600">{company.companyIndustry || "Chưa cập nhật"}<span className="mt-0.5 block text-[10px] text-slate-400">{company.companySize || "Chưa cập nhật quy mô"}</span></td><td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{company.jobCount}</td><td className="px-6 py-4"><span className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold ${meta.className}`}>{meta.label}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-2">{status === "pending" && <><button disabled={busy} onClick={() => updateCompany(company._id, "approve")} className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 disabled:opacity-50"><CheckIcon className="h-3.5 w-3.5" />Duyệt</button><button disabled={busy} onClick={() => updateCompany(company._id, "reject")} className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-[10px] font-bold text-rose-700 disabled:opacity-50"><NoSymbolIcon className="h-3.5 w-3.5" />Từ chối</button></>}{status === "verified" && <button disabled={busy} onClick={() => updateCompany(company._id, "suspend")} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 disabled:opacity-50"><NoSymbolIcon className="h-3.5 w-3.5" />Khóa</button>}{(status === "suspended" || status === "rejected") && <button disabled={busy} onClick={() => updateCompany(company._id, "restore")} className="inline-flex h-8 items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 text-[10px] font-bold text-violet-700 disabled:opacity-50"><ShieldCheckIcon className="h-3.5 w-3.5" />Mở lại</button>}</div></td></tr>; })}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
