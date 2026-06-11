import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  BookmarkIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
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
    statusClass: "text-violet-800 bg-violet-100 border-violet-200",
  },
  {
    company: "FPT Software",
    role: "ReactJS Fresher",
    status: "Phỏng vấn",
    date: "Hôm qua",
    statusClass: "text-violet-900 bg-violet-200 border-violet-300",
  },
  {
    company: "Tiki JSC",
    role: "UI/UX Designer",
    status: "Từ chối",
    date: "3 ngày trước",
    statusClass: "text-gray-700 bg-gray-100 border-gray-200",
  },
  {
    company: "Momo (M_Service)",
    role: "Software Engineer",
    status: "Chấp nhận",
    date: "1 tuần trước",
    statusClass: "text-violet-900 bg-violet-200 border-violet-300",
  },
];

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-violet-200 shadow-sm hover:shadow-md hover:shadow-violet-200/30 transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-xs font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
        </div>
        <div className="p-2.5 bg-violet-100 rounded-xl text-violet-800 border border-violet-200">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        <span className="text-violet-800 font-semibold">{trend}</span>
        <span className="text-gray-500 ml-1.5">so với tháng trước</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatCard
            title="Đã ứng tuyển"
            value="12"
            icon={<BriefcaseIcon className="size-5" />}
            trend="+2"
          />
          <StatCard
            title="Việc làm đã lưu"
            value="24"
            icon={<BookmarkIcon className="size-5" />}
            trend="+5"
          />
          <StatCard
            title="Lượt xem hồ sơ"
            value="142"
            icon={<EyeIcon className="size-5" />}
            trend="+18%"
          />
          <StatCard
            title="CV đã tạo"
            value="3"
            icon={<DocumentTextIcon className="size-5" />}
            trend="+1"
          />
        </div>

        <div className="rounded-2xl border border-violet-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-100 bg-violet-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Công việc ứng tuyển gần đây</h2>
            <button
              type="button"
              onClick={() => navigate("/AllJobs")}
              className="text-xs font-semibold text-violet-800 hover:text-violet-950 transition-colors"
            >
              Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-violet-50 bg-white">
            {recentApplications.map((job) => (
              <div
                key={`${job.company}-${job.role}`}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl border border-violet-200 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{job.role}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">{job.date}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${job.statusClass}`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
