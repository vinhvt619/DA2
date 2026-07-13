import React, { useState, useEffect } from "react";
import {
  BriefcaseIcon,
  BookmarkIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from "../Components/SettingsLayout.jsx";

function mapStatusToClass(status) {
  switch (status) {
    case "Pending":
    case "Reviewing":
      return {
        text: "Đang xử lý",
        class: "bg-purple-50 text-purple-700 border-purple-100/60",
      };
    case "Interview":
      return {
        text: "Phỏng vấn",
        class: "bg-sky-50 text-sky-700 border-sky-100/60",
      };
    case "Offered":
    case "Accepted":
      return {
        text: "Thành công",
        class: "bg-green-50 text-green-700 border-green-100/60",
      };
    case "Rejected":
      return {
        text: "Từ chối",
        class: "bg-red-50 text-red-700 border-red-100/60",
      };
    default:
      return {
        text: status || "Không rõ",
        class: "bg-gray-50 text-gray-700 border-gray-100/60",
      };
  }
}

function formatDate(dateString) {
  if (!dateString) return "Không rõ";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return `${diffDays} ngày trước`;
}

function getCompanyColor(companyName) {
  const name = companyName || "Company";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-violet-50 text-violet-600 border-violet-100/60",
    "bg-blue-50 text-blue-600 border-blue-100/60",
    "bg-emerald-50 text-emerald-600 border-emerald-100/60",
    "bg-amber-50 text-amber-600 border-amber-100/60",
    "bg-rose-50 text-rose-600 border-rose-100/60",
    "bg-sky-50 text-sky-600 border-sky-100/60",
    "bg-indigo-50 text-indigo-600 border-indigo-100/60",
    "bg-teal-50 text-teal-600 border-teal-100/60",
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function StatCard({
  title,
  value,
  icon,
  trend,
  bgClass,
  textClass,
  borderClass,
}) {
  return (
    <div
      className={`bg-white/80 p-5 rounded-2xl border ${borderClass} shadow-[0_4px_20px_rgba(147,70,245,0.02)] flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none group-hover:text-[#9346F5] transition-colors">
            {value}
          </h3>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${bgClass} ${borderClass} ${textClass} shrink-0`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-450 font-medium">
        <span className={`${textClass} font-bold mr-1`}>{trend}</span>
        <span>so với tháng trước</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch("/api/jobs/applications/mine", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((app) => {
            const statusInfo = mapStatusToClass(app.status);
            return {
              _id: app._id,
              company: app.jobId
                ? app.jobId.company
                : "Công việc không còn tồn tại",
              role: app.jobId ? app.jobId.title : "Vị trí không xác định",
              status: statusInfo.text,
              statusClass: statusInfo.class,
              date: formatDate(app.createdAt),
            };
          });
          setRecentApplications(mapped);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.error(err);
        setLoadError(true);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApps();
  }, []);

  const LIMIT = 3;
  const hasMore = recentApplications.length > LIMIT;
  const displayedApps = isExpanded
    ? recentApplications
    : recentApplications.slice(0, LIMIT);

  return (
    <SettingsPageLayout>
      <SettingsCard>
        <SettingsPageHeader
          badge={
            <>
              <ChartBarIcon className="h-3.5 w-3.5" />
              Bảng điều khiển
            </>
          }
          title="Tổng quan hoạt động"
          description="Theo dõi tiến độ tìm việc và hồ sơ của bạn một cách nhanh chóng."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard
            title="Đã ứng tuyển"
            value="12"
            icon={<BriefcaseIcon className="size-5" />}
            trend="+2"
            bgClass="bg-violet-50"
            textClass="text-violet-600"
            borderClass="border-violet-100/60"
          />
          <StatCard
            title="Việc làm đã lưu"
            value="24"
            icon={<BookmarkIcon className="size-5" />}
            trend="+5"
            bgClass="bg-blue-50"
            textClass="text-blue-600"
            borderClass="border-blue-100/60"
          />
          <StatCard
            title="Lượt xem hồ sơ"
            value="142"
            icon={<EyeIcon className="size-5" />}
            trend="+18%"
            bgClass="bg-emerald-50"
            textClass="text-emerald-600"
            borderClass="border-emerald-100/60"
          />
          <StatCard
            title="CV đã tạo"
            value="3"
            icon={<DocumentTextIcon className="size-5" />}
            trend="+1"
            bgClass="bg-amber-50"
            textClass="text-amber-600"
            borderClass="border-amber-100/60"
          />
        </div>

        <div className="rounded-2xl border border-violet-100/50 bg-white/70 overflow-hidden shadow-xs">
          <div className="px-4.5 py-3.5 border-b border-violet-100/50 bg-violet-50/30 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Công việc ứng tuyển gần đây
            </h2>
          </div>
          <div className="divide-y divide-violet-100/40">
            {loadingApps ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                Đang tải dữ liệu...
              </div>
            ) : loadError ? (
              <div className="py-8 text-center text-red-500 text-sm flex flex-col items-center gap-2">
                <BriefcaseIcon className="w-8 h-8 text-red-300" />
                Đã xảy ra lỗi khi tải danh sách ứng tuyển.
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <BriefcaseIcon className="w-8 h-8 text-gray-300" />
                Bạn chưa ứng tuyển công việc nào.
              </div>
            ) : (
              <>
                {displayedApps.map((job, index) => {
                  const companyColorClass = getCompanyColor(job.company);
                  return (
                    <div
                      key={job._id || `${job.company}-${index}`}
                      className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/20 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs ${companyColorClass}`}
                        >
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 text-xs truncate">
                            {job.role}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {job.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <span className="text-xs text-gray-400 font-medium">
                          {job.date}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold leading-normal border uppercase tracking-wider ${job.statusClass}`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isExpanded
                      ? `${(recentApplications.length - LIMIT) * 80}px`
                      : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="divide-y divide-violet-100/40 border-t border-violet-100/40">
                    {recentApplications.slice(LIMIT).map((job, index) => {
                      const companyColorClass = getCompanyColor(job.company);
                      return (
                        <div
                          key={job._id || `${job.company}-${index}`}
                          className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/20 transition-colors animate-fadeIn"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs ${companyColorClass}`}
                            >
                              {job.company.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-800 text-xs truncate">
                                {job.role}
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {job.company}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                            <span className="text-xs text-gray-400 font-medium">
                              {job.date}
                            </span>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold leading-normal border uppercase tracking-wider ${job.statusClass}`}
                            >
                              {job.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hasMore && (
                  <div className="px-4.5 py-3 border-t border-violet-100/40 bg-gray-50/50">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 py-1.5 px-3 rounded-lg hover:bg-violet-100/50 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Thu gọn
                          <ChevronUpIcon className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Xem thêm ({recentApplications.length - LIMIT} công
                          việc khác)
                          <ChevronDownIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
