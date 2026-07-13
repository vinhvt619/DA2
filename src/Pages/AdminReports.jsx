import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "react-router-dom";

export default function AdminReports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all"); // all, pending, resolved, dismissed

  // Sync filter when URL search parameters change (e.g. clicking right sidebar action items)
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // TODO: replace with real API reports list if available
  const mockReports = [
    {
      _id: "rep1",
      reporter: { name: "Nguyễn Văn A", email: "vana@gmail.com" },
      target: { name: "Nguyễn Văn B (Ứng viên)", type: "user" },
      reason: "Đăng tải CV có chứa thông tin không chính xác và xúc phạm nhà tuyển dụng.",
      status: "pending",
      createdAt: "2026-07-06T10:00:00Z",
    },
    {
      _id: "rep2",
      reporter: { name: "Trần Thị C", email: "thic@gmail.com" },
      target: { name: "Senior Frontend tại VinaCorp (Việc làm)", type: "job" },
      reason: "Tin tuyển dụng lừa đảo ứng viên đóng phí giữ chỗ khi đi phỏng vấn.",
      status: "pending",
      createdAt: "2026-07-05T08:30:00Z",
    },
    {
      _id: "rep3",
      reporter: { name: "Hoàng Văn D", email: "vand@gmail.com" },
      target: { name: "Công ty DevCorp (Doanh nghiệp)", type: "company" },
      reason: "Công ty mạo danh thương hiệu của tập đoàn công nghệ lớn để lừa đảo.",
      status: "resolved",
      createdAt: "2026-07-01T15:20:00Z",
    },
    {
      _id: "rep4",
      reporter: { name: "Phạm Thị E", email: "thie@gmail.com" },
      target: { name: "Cộng tác viên nhập liệu (Việc làm)", type: "job" },
      reason: "Yêu cầu tham gia nhóm Telegram làm nhiệm vụ nạp tiền lừa đảo đặt đơn.",
      status: "pending",
      createdAt: "2026-07-06T17:10:00Z",
    },
    {
      _id: "rep5",
      reporter: { name: "Đỗ Văn F", email: "vanf@gmail.com" },
      target: { name: "Lê Văn G (Ứng viên)", type: "user" },
      reason: "Spam tin nhắn gạ gẫm và quảng cáo dịch vụ tài chính trái phép.",
      status: "dismissed",
      createdAt: "2026-06-29T11:45:00Z",
    },
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch report data from API
      const res = await fetch("/api/admin/reports", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        // Fallback to mock data for demo / TODO: replace with real API
        setReports(mockReports);
        console.warn("Using mock reports fallback data. Connect to real API later.");
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách tố cáo:", err);
      // Fallback
      setReports(mockReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Resolve report action
  const handleResolveReport = async (id) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchReports();
      } else {
        // Fallback local update
        setReports((prev) =>
          prev.map((rep) => (rep._id === id ? { ...rep, status: "resolved" } : rep))
        );
        console.warn("API resolve failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi xử lý tố cáo:", err);
      setReports((prev) =>
        prev.map((rep) => (rep._id === id ? { ...rep, status: "resolved" } : rep))
      );
    }
  };

  // Dismiss report action
  const handleDismissReport = async (id) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}/dismiss`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchReports();
      } else {
        // Fallback local update
        setReports((prev) =>
          prev.map((rep) => (rep._id === id ? { ...rep, status: "dismissed" } : rep))
        );
        console.warn("API dismiss failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi bỏ qua tố cáo:", err);
      setReports((prev) =>
        prev.map((rep) => (rep._id === id ? { ...rep, status: "dismissed" } : rep))
      );
    }
  };

  // Filter logic (client-side)
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      (rep.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.reporter?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.target?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || rep.status === statusFilter;
    
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
            placeholder="Tìm theo lý do hoặc người tố cáo..."
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
            <option value="pending">Chờ xử lý (Pending)</option>
            <option value="resolved">Đã xử lý (Resolved)</option>
            <option value="dismissed">Đã bỏ qua (Dismissed)</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading ? (
          // Skeleton loader
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="p-4 flex items-center justify-between animate-pulse">
                <div className="flex-1 space-y-2 w-1/3">
                  <div className="h-3.5 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-slate-100 rounded w-2/3 flex-1 mx-4"></div>
                <div className="h-3 bg-slate-100 rounded w-20"></div>
                <div className="h-3.5 bg-slate-100 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          // Empty State
          <div className="p-12 text-center text-slate-400 font-medium">
            Không tìm thấy tố cáo nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b-[0.5px] border-slate-200/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3 font-bold">Người tố cáo</th>
                  <th className="px-6 py-3 font-bold">Đối tượng bị tố cáo</th>
                  <th className="px-6 py-3 font-bold w-1/3">Lý do báo cáo</th>
                  <th className="px-6 py-3 font-bold">Trạng thái</th>
                  <th className="px-6 py-3 font-bold">Ngày gửi</th>
                  <th className="px-6 py-3 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((rep) => {
                  // Status badge styling
                  let statusBadge = "bg-slate-50 text-slate-500 border-slate-200/50";
                  let statusText = "Đã bỏ qua";
                  if (rep.status === "pending") {
                    statusBadge = "bg-amber-50 text-amber-700 border-amber-100/30";
                    statusText = "Chờ xử lý";
                  } else if (rep.status === "resolved") {
                    statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100/30";
                    statusText = "Đã giải quyết";
                  }

                  // Target Type Badge
                  let typeBadge = "bg-blue-50 text-blue-600 border-blue-100/30";
                  if (rep.target?.type === "job") {
                    typeBadge = "bg-amber-50 text-amber-600 border-amber-100/30";
                  } else if (rep.target?.type === "company") {
                    typeBadge = "bg-purple-50 text-purple-600 border-purple-100/30";
                  }

                  const formattedDate = new Date(rep.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={rep._id}
                      className="hover:bg-slate-50/30 transition-colors text-slate-600"
                    >
                      {/* Reporter Info */}
                      <td className="px-6 py-3.5">
                        <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">
                          {rep.reporter?.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {rep.reporter?.email}
                        </p>
                      </td>
                      
                      {/* Target Info with Badge */}
                      <td className="px-6 py-3.5">
                        <h4 className="font-semibold text-slate-800 text-[12px] leading-tight">
                          {rep.target?.name}
                        </h4>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-sm border mt-1 capitalize ${typeBadge}`}>
                          {rep.target?.type}
                        </span>
                      </td>

                      {/* Reason Description */}
                      <td className="px-6 py-3.5 text-[12px] leading-relaxed text-slate-500">
                        {rep.reason}
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
                        {rep.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResolveReport(rep._id)}
                              className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Giải quyết báo cáo"
                            >
                              <CheckIcon className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDismissReport(rep._id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Bỏ qua báo cáo"
                            >
                              <XMarkIcon className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px] font-medium italic">Đã xử lý</span>
                        )}
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
