import React from "react";
import Header from "../Components/Header.jsx";
import {
  BriefcaseIcon,
  BookmarkIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-3 bg-gray-50 rounded-2xl text-gray-600 border border-gray-100">
          {icon}
        </div>
      </div>
      <div className="mt-5 flex items-center text-xs">
        <span className="text-green-600 font-semibold">{trend}</span>
        <span className="text-gray-400 ml-1.5 font-medium">
          so với tháng trước
        </span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <Header />

      <div className="pt-10 flex items-start max-w-6xl mx-auto w-full px-4 lg:px-8 gap-8 pb-20">
        <div className="top-0 bg-white rounded-3xl pr-2 pl-7 pb-5 shrink-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-[#ffffff]">
          <StickyProfileSettings />
        </div>

        <div className="flex-1 min-w-0 flex justify-center relative">
          <div className="w-full max-w-[800px] bg-white rounded-3xl border border-gray-50 shadow-[0_2px_20px_rgba(0,0,0,0.03)] overflow-hidden pb-12">
            <div className="px-10 pt-10">
              <div className="mb-10 pl-2">
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Tổng quan hoạt động
                </h1>
                <p className="text-gray-500 text-sm mt-2 font-medium">
                  Theo dõi tiến độ tìm việc và hồ sơ của bạn một cách nhanh
                  chóng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <StatCard
                  title="Đã ứng tuyển"
                  value="12"
                  icon={<BriefcaseIcon className="size-6" />}
                  trend="+2"
                />
                <StatCard
                  title="Việc làm đã lưu"
                  value="24"
                  icon={<BookmarkIcon className="size-6" />}
                  trend="+5"
                />
                <StatCard
                  title="Lượt xem hồ sơ"
                  value="142"
                  icon={<EyeIcon className="size-6" />}
                  trend="+18%"
                />
                <StatCard
                  title="CV đã tạo"
                  value="3"
                  icon={<DocumentTextIcon className="size-6" />}
                  trend="+1"
                />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Công việc ứng tuyển gần đây
                  </h2>
                  <button className="text-sm font-semibold text-gray-500 hover:text-black outline-none">
                    Xem tất cả
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    {
                      company: "VNG Corporation",
                      role: "Frontend Developer",
                      status: "Đang xử lý",
                      date: "Hôm nay",
                      color: "text-amber-600 bg-amber-50",
                    },
                    {
                      company: "FPT Software",
                      role: "ReactJS Fresher",
                      status: "Phỏng vấn",
                      date: "Hôm qua",
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      company: "Tiki JSC",
                      role: "UI/UX Designer",
                      status: "Từ chối",
                      date: "3 ngày trước",
                      color: "text-red-600 bg-red-50",
                    },
                    {
                      company: "Momo (M_Service)",
                      role: "Software Engineer",
                      status: "Chấp nhận",
                      date: "1 tuần trước",
                      color: "text-green-600 bg-green-50",
                    },
                  ].map((job, i) => (
                    <div
                      key={i}
                      className="px-8 py-6 flex items-center justify-between hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100"></div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-[15px]">
                            {job.role}
                          </h4>
                          <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {job.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-sm text-gray-400 font-medium w-24 text-right">
                          {job.date}
                        </span>
                        <span
                          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold w-28 text-center ${job.color}`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
