import React, { useState, useEffect } from "react";
import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: replace with real API backend logs endpoint later
  const mockLogs = [
    {
      _id: "log1",
      timestamp: "2026-07-07T03:45:12Z",
      level: "error",
      message: "Kết nối MongoDB thất bại: Hết thời gian chờ sau 30 giây. Đang tự động kết nối lại sau 5 giây.",
      source: "Dịch vụ Cơ sở dữ liệu"
    },
    {
      _id: "log2",
      timestamp: "2026-07-07T03:30:45Z",
      level: "warn",
      message: "Cấu hình SMTP Mailer thiếu khóa 'auth.pass'. Các thông báo từ hệ thống sẽ không thể gửi đi.",
      source: "Bộ máy Thông báo"
    },
    {
      _id: "log3",
      timestamp: "2026-07-07T02:15:00Z",
      level: "error",
      message: "Xác thực chữ ký JWT thất bại. Xác thực token hết hạn không thành công trên route /api/me.",
      source: "Middleware Xác thực"
    },
    {
      _id: "log4",
      timestamp: "2026-07-07T01:00:22Z",
      level: "info",
      message: "Tác vụ dọn dẹp cron hàng ngày được thực thi thành công. Đã xóa 142 phiên tìm kiếm hết hạn.",
      source: "Dịch vụ Cron"
    }
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/logs?type=error", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        // Fallback to mock logs for demo / TODO: replace with real API
        setLogs(mockLogs);
        console.warn("Using mock logs fallback data. Connect to real API later.");
      }
    } catch (err) {
      console.error("Lỗi lấy logs hệ thống:", err);
      // Fallback
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 flex flex-col gap-6">
      
      {/* Title & Refresh */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div>
          <h2 className="text-[14px] font-bold text-slate-800">
            Nhật ký Lỗi & Hệ thống
          </h2>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Lịch sử hoạt động và ghi nhận ngoại lệ real-time.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 border-[0.5px] border-slate-200 hover:border-violet-300 hover:text-violet-600 transition-colors text-slate-500 rounded-[6px] flex items-center gap-1.5 cursor-pointer bg-slate-50/50"
        >
          <ArrowPathIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-semibold">Làm mới</span>
        </button>
      </div>

      {/* Logs list card container */}
      <div className="bg-white rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading ? (
          // Skeleton loading
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="p-4.5 animate-pulse flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          // Empty State
          <div className="p-12 text-center text-slate-400 font-medium">
            Không tìm thấy logs hệ thống nào.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              // Level Badge coloring
              let levelBadge = "bg-slate-50 text-slate-500 border-slate-200/50";
              let LevelIcon = CheckCircleIcon;
              if (log.level === "error") {
                levelBadge = "bg-red-50 text-red-600 border-red-100/30";
                LevelIcon = ExclamationTriangleIcon;
              } else if (log.level === "warn") {
                levelBadge = "bg-amber-50 text-amber-600 border-amber-100/30";
                LevelIcon = ExclamationCircleIcon;
              }

              const formattedDate = new Date(log.timestamp).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              });

              return (
                <div key={log._id} className="p-4.5 flex items-start gap-4 hover:bg-slate-50/20 transition-colors">
                  {/* Status icon indicators */}
                  <div className={`p-2 rounded-[6px] border ${levelBadge} shrink-0`}>
                    <LevelIcon className="size-4" />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-[12px]">
                        [{log.source}]
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm border uppercase ${levelBadge}`}>
                        {log.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-auto shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-[12px] text-slate-600 font-medium leading-relaxed mt-2 bg-slate-50/50 p-2.5 rounded-[6px] border border-slate-100">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
