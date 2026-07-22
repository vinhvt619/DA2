import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";

const ACTIVE_STATUSES = new Set(["Pending", "Reviewing", "Interview", "Offered"]);
const COMPLETED_STATUSES = new Set(["Accepted", "Rejected"]);

const STATUS_CONFIG = {
  Pending: {
    label: "Chờ xử lý",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    description: "Hồ sơ đã được gửi và đang chờ nhà tuyển dụng xử lý.",
  },
  Reviewing: {
    label: "Đang xem xét",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    description: "Nhà tuyển dụng đang xem xét hồ sơ của bạn.",
  },
  Interview: {
    label: "Phỏng vấn",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    description: "Hồ sơ đã chuyển sang giai đoạn phỏng vấn.",
  },
  Offered: {
    label: "Đã đề nghị",
    className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    description: "Nhà tuyển dụng đã gửi đề nghị cho vị trí này.",
  },
  Accepted: {
    label: "Đã nhận",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "Bạn đã được nhận vào vị trí này.",
  },
  Rejected: {
    label: "Từ chối",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    description: "Hồ sơ chưa phù hợp với vị trí tuyển dụng.",
  },
};

const tabs = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang ứng tuyển" },
  { id: "completed", label: "Đã kết thúc" },
];

function ApplicationSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-7 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/jobs/applications/mine", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Không thể tải hồ sơ ứng tuyển.");
      }
      setApplications(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Không thể tải hồ sơ ứng tuyển.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const counts = useMemo(() => ({
    all: applications.length,
    active: applications.filter((application) => ACTIVE_STATUSES.has(application.status)).length,
    completed: applications.filter((application) => COMPLETED_STATUSES.has(application.status)).length,
  }), [applications]);

  const visibleApplications = useMemo(() => {
    if (activeTab === "active") {
      return applications.filter((application) => ACTIVE_STATUSES.has(application.status));
    }
    if (activeTab === "completed") {
      return applications.filter((application) => COMPLETED_STATUSES.has(application.status));
    }
    return applications;
  }, [activeTab, applications]);

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <main className="mx-auto w-full max-w-[1360px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="flex w-full flex-col items-start gap-4 lg:mx-auto lg:max-w-[960px] lg:flex-row xl:max-w-[1236px]">
          <div className="order-2 w-full shrink-0 lg:sticky lg:top-20 lg:order-none lg:w-56">
            <StickyProfile />
          </div>

          <section className="order-1 min-w-0 flex-1 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_30px_rgba(76,29,149,0.06)] lg:order-none">
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <BriefcaseIcon className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold text-slate-950">Công việc của tôi</h1>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Theo dõi các vị trí đã ứng tuyển và trạng thái hồ sơ hiện tại.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 px-3 sm:px-5">
              <div className="flex gap-1 overflow-x-auto py-2" role="tablist" aria-label="Lọc hồ sơ ứng tuyển">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      activeTab === tab.id
                        ? "bg-violet-100 text-violet-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? "bg-white text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                      {counts[tab.id]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="grid items-stretch gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => <ApplicationSkeleton key={index} />)}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-rose-700">{error}</p>
                  <button
                    type="button"
                    onClick={fetchApplications}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Thử lại
                  </button>
                </div>
              ) : visibleApplications.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                    <BriefcaseIcon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-sm font-bold text-slate-900">
                    {activeTab === "active" ? "Bạn chưa có hồ sơ đang ứng tuyển" : "Chưa có hồ sơ trong mục này"}
                  </h2>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Khám phá các công việc phù hợp và nộp CV để theo dõi tiến trình tại đây.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/Jobs")}
                    className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                  >
                    Tìm công việc
                  </button>
                </div>
              ) : (
                <div className="grid items-start gap-3 md:grid-cols-2">
                  {visibleApplications.map((application) => {
                    const job = application.jobId || application.jobSnapshot;
                    const isDeleted = !application.jobId || job?.status === "Deleted" || Boolean(job?.deletedAt);
                    const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.Pending;

                    return (
                      <article
                        key={application._id}
                        className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-[0_8px_24px_rgba(76,29,149,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                            <BuildingOffice2Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-900">
                                {job?.title || "Tin tuyển dụng đã bị xoá"}
                              </h2>
                              <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{job?.company || "Không còn thông tin công ty"}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-500">
                          {job?.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5 text-violet-400" />
                              {job.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5 text-violet-400" />
                            Ứng tuyển {formatDate(application.createdAt)}
                          </span>
                        </div>

                        <div className={`mt-3 flex min-h-[56px] items-start rounded-lg px-3 py-2.5 text-[11px] leading-4 ${
                          isDeleted
                            ? "gap-2 border border-amber-200 bg-amber-50 text-amber-800"
                            : "bg-slate-50 text-slate-600"
                        }`}>
                          {isDeleted && (
                            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>
                            {isDeleted
                              ? `${status.description} Tin đã bị xoá nhưng lịch sử ứng tuyển vẫn được giữ lại.`
                              : status.description}
                          </span>
                        </div>

                        <div className="mt-2 flex min-h-8 items-center justify-end">
                          {job?._id && !isDeleted ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${job._id}`)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                              Xem công việc
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">Chỉ xem lịch sử</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
