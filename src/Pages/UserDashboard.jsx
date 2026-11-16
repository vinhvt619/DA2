import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  BookmarkIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from "../Components/SettingsLayout.jsx";
import ApplicationStatusBadge from "../Components/ApplicationStatusBadge.jsx";
import { useMyApplications } from "../hooks/useMyApplications.js";
import { getApplicationJobInfo } from "../utils/applicationSubmission.js";
import { formatRelativeDay } from "../utils/dateTime.js";

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

function RecentApplicationRow({ job }) {
  const companyColorClass = getCompanyColor(job.company);
  return (
    <div className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50/20 transition-colors">
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
            {job.isJobDeleted ? " · Tin đã xoá" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
        <span className="text-xs text-gray-400 font-medium">{job.date}</span>
        <ApplicationStatusBadge status={job.status} size="xs" />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle = "so với tháng trước",
  bgClass,
  textClass,
  borderClass,
}) {
  return (
    <div
      className={`group flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md ${borderClass}`}
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
        <div className={`shrink-0 rounded-lg p-2.5 ${bgClass} ${textClass}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-450 font-medium">
        {trend ? <span className={`${textClass} font-bold mr-1`}>{trend}</span> : null}
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    applications,
    isLoading: loadingApps,
    isError: loadError,
    refetch,
  } = useMyApplications();

  const recentApplications = useMemo(
    () =>
      applications.map((app) => {
        const jobInfo = getApplicationJobInfo(app);
        return {
          _id: app._id,
          company: jobInfo.company,
          role: jobInfo.title,
          isJobDeleted: jobInfo.isJobDeleted,
          status: app.status,
          date: formatRelativeDay(app.createdAt, "Không rõ"),
        };
      }),
    [applications],
  );

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
            value={loadingApps ? "..." : String(applications.length)}
            icon={<BriefcaseIcon className="size-5" />}
            trend="Đồng bộ"
            subtitle="theo tài khoản hiện tại"
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

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4.5 py-3.5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Công việc ứng tuyển gần đây
            </h2>
            <Link
              to="/my-applications"
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-violet-100/40">
            {loadingApps ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                Đang tải dữ liệu...
              </div>
            ) : loadError ? (
              <div className="py-8 text-center text-red-500 text-sm flex flex-col items-center gap-2">
                <BriefcaseIcon className="w-8 h-8 text-red-300" />
                <span>Đã xảy ra lỗi khi tải danh sách ứng tuyển.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Thử lại
                </button>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <BriefcaseIcon className="w-8 h-8 text-gray-300" />
                Bạn chưa ứng tuyển công việc nào.
              </div>
            ) : (
              <>
                {displayedApps.map((job, index) => (
                  <RecentApplicationRow
                    key={job._id || `${job.company}-${index}`}
                    job={job}
                  />
                ))}

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isExpanded
                      ? `${(recentApplications.length - LIMIT) * 80}px`
                      : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="divide-y divide-violet-100/40 border-t border-violet-100/40 animate-fadeIn">
                    {recentApplications.slice(LIMIT).map((job, index) => (
                      <RecentApplicationRow
                        key={job._id || `${job.company}-${index}`}
                        job={job}
                      />
                    ))}
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
