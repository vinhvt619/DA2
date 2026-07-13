import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, pending, closed

  // Mock jobs list as a fallback
  const mockJobs = [
    {
      _id: "job1",
      title: "Senior React Developer",
      company: { name: "TechCorp JSC" },
      location: "Hà Nội",
      type: "Full-time",
      status: "active",
      createdAt: "2026-07-01T10:00:00Z",
      applicantCount: 14,
    },
    {
      _id: "job2",
      title: "Backend Node.js Engineer",
      company: { name: "VinaGroup" },
      location: "TP. Hồ Chí Minh",
      type: "Full-time",
      status: "active",
      createdAt: "2026-07-03T09:30:00Z",
      applicantCount: 8,
    },
    {
      _id: "job3",
      title: "UI/UX Designer",
      company: { name: "FPT Software" },
      location: "Đà Nẵng",
      type: "Part-time",
      status: "pending",
      createdAt: "2026-07-06T14:20:00Z",
      applicantCount: 0,
    },
    {
      _id: "job4",
      title: "Product Owner",
      company: { name: "Shopee Vietnam" },
      location: "TP. Hồ Chí Minh",
      type: "Full-time",
      status: "closed",
      createdAt: "2026-06-15T08:00:00Z",
      applicantCount: 27,
    },
    {
      _id: "job5",
      title: "DevOps Engineer",
      company: { name: "Viettel Telecom" },
      location: "Hà Nội",
      type: "Full-time",
      status: "active",
      createdAt: "2026-07-02T11:00:00Z",
      applicantCount: 5,
    },
    {
      _id: "job6",
      title: "Intern Mobile Developer (iOS/Android)",
      company: { name: "VNG Corporation" },
      location: "TP. Hồ Chí Minh",
      type: "Part-time",
      status: "active",
      createdAt: "2026-07-05T16:45:00Z",
      applicantCount: 3,
    },
  ];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/jobs", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        // Fallback to mock data for demo / TODO: replace with real API
        setJobs(mockJobs);
        console.warn("Using mock jobs fallback data. Connect to real API later.");
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách việc làm:", err);
      // Fallback
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Hide job action
  const handleHideJob = async (id) => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/hide`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchJobs();
      } else {
        // Fallback local update
        setJobs((prev) =>
          prev.map((job) => (job._id === id ? { ...job, status: "closed" } : job))
        );
        console.warn("API hide failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi ẩn việc làm:", err);
      setJobs((prev) =>
        prev.map((job) => (job._id === id ? { ...job, status: "closed" } : job))
      );
    }
  };

  // Delete job action
  const handleDeleteJob = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này không?")) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchJobs();
      } else {
        // Fallback local delete
        setJobs((prev) => prev.filter((job) => job._id !== id));
        console.warn("API delete failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi xóa việc làm:", err);
      setJobs((prev) => prev.filter((job) => job._id !== id));
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
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge}`}>
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
