import React, { useCallback, useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import { showToast } from "../utils/toast.js";

export default function AdminJobs() {
  const confirmDialog = useConfirmDialog();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, pending, closed

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/jobs", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể tải danh sách việc làm.");
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách việc làm:", err);
      setJobs([]);
      setError(err.message || "Không thể tải danh sách việc làm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  // Hide job action
  const handleHideJob = async (id) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/hide`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        showToast("Không thể ẩn tin tuyển dụng.", "error");
      }
    } catch (err) {
      console.error("Lỗi ẩn việc làm:", err);
      showToast("Không thể ẩn tin tuyển dụng.", "error");
    }
  };

  const handleRestoreJob = async (id) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/unhide`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        showToast("Không thể khôi phục tin tuyển dụng.", "error");
      }
    } catch (err) {
      console.error("Lỗi hiện lại việc làm:", err);
      showToast("Không thể khôi phục tin tuyển dụng.", "error");
    }
  };

  // Delete job action
  const handleDeleteJob = async (id) => {
    if (!(await confirmDialog("Bạn có chắc chắn muốn xóa tin tuyển dụng này không?"))) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        showToast("Không thể xóa tin tuyển dụng.", "error");
      }
    } catch (err) {
      console.error("Lỗi xóa việc làm:", err);
      showToast("Không thể xóa tin tuyển dụng.", "error");
    }
  };

  // Filter logic (client-side)
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 flex flex-col gap-6">
      
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tin tuyển dụng hoặc công ty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-[0.5px] border-slate-200 rounded-[6px] outline-none text-xs focus:border-violet-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FunnelIcon className="size-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border-[0.5px] border-slate-200 rounded-[6px] outline-none text-xs bg-white text-slate-700 focus:border-violet-400 cursor-pointer min-w-[150px]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang mở (Active)</option>
            <option value="pending">Chờ duyệt (Pending)</option>
            <option value="closed">Đã đóng (Closed)</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading ? (
          // Skeleton loader
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="p-4 flex items-center justify-between animate-pulse">
                <div className="flex-1 space-y-2 w-1/3">
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-20"></div>
                <div className="h-3 bg-slate-100 rounded w-16"></div>
                <div className="h-3.5 bg-slate-100 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void fetchJobs()}
              className="mt-3 rounded-md border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
            >
              Thử lại
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          // Empty State
          <div className="p-12 text-center text-slate-400 font-medium">
            Không tìm thấy tin tuyển dụng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b-[0.5px] border-slate-200/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3 font-bold">Tin tuyển dụng</th>
                  <th className="px-6 py-3 font-bold">Địa điểm & Loại</th>
                  <th className="px-6 py-3 font-bold text-center">Ứng viên</th>
                  <th className="px-6 py-3 font-bold">Trạng thái</th>
                  <th className="px-6 py-3 font-bold">Ngày đăng</th>
                  <th className="px-6 py-3 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  // Status badge styling
                  let statusBadge = "bg-slate-50 text-slate-500 border-slate-200/50";
                  let statusText = "Đã đóng";
                  if (job.status === "active") {
                    statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100/30";
                    statusText = "Đang tuyển";
                  } else if (job.status === "pending") {
                    statusBadge = "bg-amber-50 text-amber-700 border-amber-100/30";
                    statusText = "Chờ duyệt";
                  }

                  const formattedDate = new Date(job.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50/30 transition-colors text-slate-600"
                    >
                      {/* Job Title & Company */}
                      <td className="px-6 py-3.5">
                        <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">
                          {job.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {job.company?.name}
                        </p>
                      </td>
                      
                      {/* Location & Type */}
                      <td className="px-6 py-3.5 text-[12px]">
                        <div>{job.location}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{job.type}</div>
                      </td>
                      
                      {/* Applicant Count */}
                      <td className="px-6 py-3.5 text-center font-semibold text-slate-700 text-[12px]">
                        {job.applicantCount || 0}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-3.5">
                        <span className={`whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-3.5 text-[11px] text-slate-400 font-medium">
                        {formattedDate}
                      </td>
                      
                      {/* Action buttons */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status !== "closed" && (
                            <button
                              onClick={() => handleHideJob(job._id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Ẩn tin tuyển dụng (đóng tuyển)"
                            >
                              <EyeSlashIcon className="size-4" />
                            </button>
                          )}
                          {job.isAdminHidden && (
                            <button
                              onClick={() => handleRestoreJob(job._id)}
                              className="p-1 text-violet-500 hover:bg-violet-50 hover:text-violet-700 rounded transition-colors"
                              title="Hiện lại tin tuyển dụng"
                            >
                              <EyeIcon className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa tin tuyển dụng"
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
