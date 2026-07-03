import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const recentApplications = [
  {
    company: "VNG Corporation",
    role: "Frontend Developer",
    status: "Đang xử lý",
    date: "Hôm nay",
    statusClass: "bg-purple-50 text-purple-700 border-purple-100/60",
  },
  {
    company: "FPT Software",
    role: "ReactJS Fresher",
    status: "Phỏng vấn",
    date: "Hôm qua",
    statusClass: "bg-sky-50 text-sky-700 border-sky-100/60",
  },
  {
    company: "Tiki JSC",
    role: "UI/UX Designer",
    status: "Từ chối",
    date: "3 ngày trước",
    statusClass: "bg-red-50 text-red-700 border-red-100/60",
  },
  {
    company: "Momo (M_Service)",
    role: "Software Engineer",
    status: "Chấp nhận",
    date: "1 tuần trước",
    statusClass: "bg-emerald-50 text-emerald-700 border-emerald-100/60",
  },
];

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
    "bg-teal-50 text-teal-600 border-teal-100/60"
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function StatCard({ title, value, icon, trend, bgClass, textClass, borderClass }) {
  return (
    <div className={`bg-white/80 p-5 rounded-2xl border ${borderClass} shadow-[0_4px_20px_rgba(147,70,245,0.02)] flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none group-hover:text-[#9346F5] transition-colors">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${bgClass} ${borderClass} ${textClass} shrink-0`}>
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
  const LIMIT = 3;
  const hasMore = recentApplications.length > LIMIT;
  const displayedApps = isExpanded ? recentApplications : recentApplications.slice(0, LIMIT);

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
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công việc ứng tuyển gần đây</h2>
          </div>
          <div className="bg-white/50">
            {/* First 3 items */}
            <div className="divide-y divide-violet-100/40">
              {recentApplications.slice(0, LIMIT).map((job) => {
                const companyColorClass = getCompanyColor(job.company);
                return (
                  <div
                    key={`${job.company}-${job.role}`}
                    className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs ${companyColorClass}`}>
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">{job.role}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <span className="text-xs text-gray-400 font-medium">{job.date}</span>
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

            {/* Extra items with smooth transition */}
            <div
              className="transition-all duration-500 ease-in-out overflow-hidden"
              style={{
                maxHeight: isExpanded ? `${(recentApplications.length - LIMIT) * 80}px` : "0px",
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <div className="divide-y divide-violet-100/40 border-t border-violet-100/40">
                {recentApplications.slice(LIMIT).map((job) => {
                  const companyColorClass = getCompanyColor(job.company);
                  return (
                    <div
                      key={`${job.company}-${job.role}`}
                      className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/20 transition-colors animate-fadeIn"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs ${companyColorClass}`}>
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 text-xs truncate">{job.role}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">{job.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <span className="text-xs text-gray-400 font-medium">{job.date}</span>
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
          </div>
          
          {hasMore && (
            <div className="border-t border-violet-100/50 bg-violet-50/5 text-center">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-[#9346F5] hover:bg-violet-50/20 hover:text-[#7c38c9] transition-all duration-300 outline-none"
              >
                {isExpanded ? (
                  <>
                    Thu gọn
                    <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Xem thêm ({recentApplications.length - LIMIT} công việc khác)
                    <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
