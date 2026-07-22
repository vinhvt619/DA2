import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  BookmarkIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import { useSavedJobs } from "../context/SavedJobsContext.jsx";
import { getJobById } from "../data/jobsData";

function SavedJobSkeleton() {
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

function ErrorJobCard({ jobId, onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await onRetry(jobId);
    setRetrying(false);
  };

  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-center">
      <p className="text-xs font-semibold text-rose-700">Không tải được thông tin công việc.</p>
      <button
        type="button"
        onClick={retry}
        disabled={retrying}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
      >
        <ArrowPathIcon className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
        Thử lại
      </button>
    </div>
  );
}

export default function SavedJobs() {
  const navigate = useNavigate();
  const {
    savedJobIdList,
    isLoadingSavedIds,
    toggleSave,
    pendingIds,
  } = useSavedJobs();
  const [resolvedJobs, setResolvedJobs] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(new Set());
  const [errorJobs, setErrorJobs] = useState(new Set());

  const resolveJob = async (jobId) => {
    const staticJob = getJobById(jobId);
    if (staticJob) {
      setResolvedJobs((current) => ({ ...current, [jobId]: staticJob }));
      setErrorJobs((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.status === 404 || response.status === 410) {
        setResolvedJobs((current) => ({
          ...current,
          [jobId]: {
            id: jobId,
            title: "Tin tuyển dụng không còn tồn tại",
            company: "Không còn thông tin công ty",
            status: "Deleted",
            isLegacyDeleted: true,
          },
        }));
        setErrorJobs((current) => {
          const next = new Set(current);
          next.delete(jobId);
          return next;
        });
        return;
      }
      if (!response.ok) throw new Error("Không thể tải công việc");
      const data = await response.json();
      setResolvedJobs((current) => ({
        ...current,
        [jobId]: {
          ...data,
          id: data._id,
        },
      }));
      setErrorJobs((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
    } catch {
      setErrorJobs((current) => new Set([...current, jobId]));
    }
  };

  useEffect(() => {
    if (isLoadingSavedIds) return;

    const jobsToLoad = savedJobIdList.filter(
      (jobId) => !resolvedJobs[jobId] && !errorJobs.has(jobId),
    );
    if (jobsToLoad.length === 0) return;

    setLoadingJobs((current) => new Set([...current, ...jobsToLoad]));
    Promise.allSettled(jobsToLoad.map(resolveJob)).finally(() => {
      setLoadingJobs((current) => {
        const next = new Set(current);
        jobsToLoad.forEach((jobId) => next.delete(jobId));
        return next;
      });
    });
    // resolvedJobs and errorJobs are intentionally excluded to avoid repeated requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingSavedIds, savedJobIdList]);

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
                  <BookmarkIcon className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-bold text-slate-950">Việc làm đã lưu</h1>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Xem lại những cơ hội bạn đã lưu để ứng tuyển sau.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <span className="text-xs font-semibold text-slate-700">Danh sách đã lưu</span>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                {savedJobIdList.length} công việc
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {isLoadingSavedIds ? (
                <div className="grid items-stretch gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => <SavedJobSkeleton key={index} />)}
                </div>
              ) : savedJobIdList.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                    <BookmarkIcon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-sm font-bold text-slate-900">Bạn chưa lưu công việc nào</h2>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Lưu lại những công việc phù hợp để dễ dàng xem và ứng tuyển sau.
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
                  {savedJobIdList.map((jobId) => {
                    if (loadingJobs.has(jobId) || (!resolvedJobs[jobId] && !errorJobs.has(jobId))) {
                      return <SavedJobSkeleton key={jobId} />;
                    }
                    if (errorJobs.has(jobId)) {
                      return <ErrorJobCard key={jobId} jobId={jobId} onRetry={resolveJob} />;
                    }

                    const job = resolvedJobs[jobId];
                    const isDeleted = job.status === "Deleted" || Boolean(job.deletedAt);
                    const isClosed = isDeleted || job.status === "Expired" || job.status === "closed";
                    const isPending = pendingIds.has(jobId);

                    return (
                      <article
                        key={jobId}
                        className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-[0_8px_24px_rgba(76,29,149,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                            <BuildingOffice2Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-900">{job.title}</h2>
                              <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${isClosed ? "border-slate-200 bg-slate-50 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                {isDeleted ? "Tin đã xoá" : isClosed ? "Đã đóng" : "Đang tuyển"}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{job.company}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex min-h-4 flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-500">
                          {job.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5 text-violet-400" />
                              {job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="inline-flex items-center gap-1">
                              <CurrencyDollarIcon className="h-3.5 w-3.5 text-violet-400" />
                              {job.salary}
                            </span>
                          )}
                          {!job.location && !job.salary && (
                            <span className="text-slate-400">Thông tin chi tiết không còn khả dụng</span>
                          )}
                        </div>

                        <div className={`mt-3 flex min-h-[56px] items-start gap-2 rounded-lg border px-3 py-2.5 text-[11px] leading-4 ${
                          isDeleted
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : isClosed
                              ? "border-slate-200 bg-slate-50 text-slate-600"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                        }`}>
                          {isDeleted || isClosed ? (
                            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>
                            {isDeleted
                              ? "Công việc này đã bị xoá và không thể ứng tuyển. Bạn vẫn có thể bỏ lưu."
                              : isClosed
                                ? "Tin tuyển dụng đã đóng và hiện không còn nhận hồ sơ mới."
                                : "Tin tuyển dụng đang nhận hồ sơ. Bạn có thể xem chi tiết và ứng tuyển ngay."}
                          </span>
                        </div>

                        <div className="mt-2 flex min-h-8 items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => toggleSave(jobId)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
                          >
                            <BookmarkIcon className="h-4 w-4" />
                            Bỏ lưu
                          </button>
                          {!isDeleted && (
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${job.id || job._id}`)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                              Xem công việc
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
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
