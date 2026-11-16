import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../Components/Header";
import JobApplicationWizard from "../Components/JobApplicationWizard.jsx";
import usePublicJobs from "../hooks/usePublicJobs.js";
import { useMyApplications } from "../hooks/useMyApplications.js";
import { showToast } from "../utils/toast.js";
import { formatDate } from "../utils/dateTime.js";
import {
  findApplicationForJob,
  getAccountId,
  getResumeFetchScope,
  isCandidateEligible,
  normalizeIdString,
  selectScopedResumeState,
} from "../utils/applicationSubmission.js";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  SignalIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { useSavedJobs } from "../context/SavedJobsContext";
import {
  formatJobDeadline,
  isJobDeleted,
  isJobExpired,
  isJobUnavailable,
} from "../utils/jobAvailability.js";

const normalizeJobDetails = (data) => ({
  ...data,
  deadline: formatJobDeadline(data),
  experience: data.experience || "Không yêu cầu",
  education: data.education || "Không yêu cầu",
  workModel: data.workModel || data.workMode || (data.type === "Remote" ? "Làm từ xa" : data.type === "Hybrid" ? "Kết hợp" : "Tại văn phòng"),
});

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthChecked } = useAuth();

  const accountId = getAccountId(currentUser);
  const isCandidate = isCandidateEligible(currentUser);

  const [resumesState, setResumesState] = useState({
    scope: null,
    items: [],
    loading: false,
    error: "",
  });
  const [resumesReloadToken, setResumesReloadToken] = useState(0);
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  const { jobs: publicJobs } = usePublicJobs({ limit: 8 });
  const { isSaved, toggleSave, pendingIds } = useSavedJobs();
  const {
    applications,
    isLoading: loadingApplications,
    error: applicationsQueryError,
    refetch: refetchApplications,
    invalidate: invalidateMyApplications,
  } = useMyApplications();

  const jobIsDeleted = isJobDeleted(job);
  const jobIsExpired = isJobExpired(job);
  const jobIsUnavailable = isJobUnavailable(job);
  const targetJobId = normalizeIdString(job?._id || job?.id || jobId);
  const resumeFetchScope = getResumeFetchScope({
    isAuthChecked,
    isCandidate,
    accountId,
    job,
    jobIsUnavailable,
  });
  const {
    resumes: savedResumes,
    loading: loadingResumes,
    error: resumesError,
  } = selectScopedResumeState(resumesState, resumeFetchScope);
  const wizardScopeKey = `${targetJobId || "none"}::${accountId || "guest"}::${currentUser?.role || "none"}`;

  const matchedApplication = useMemo(
    () => findApplicationForJob(applications, job?._id || job?.id || jobId),
    [applications, job?._id, job?.id, jobId],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const getJob = async () => {
      setLoadingJob(true);
      setJob(null);
      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("job not found");
        const data = await res.json();
        if (!active || controller.signal.aborted) return;
        setJob(
          normalizeJobDetails({
            ...data,
            id: data._id,
            postedAt: formatDate(data.createdAt),
            requirements: data.requirements || [],
            benefits: data.benefits || [],
            tags: data.tags || [],
          }),
        );
      } catch (error) {
        if (error?.name === "AbortError" || !active) return;
        setJob(null);
      } finally {
        if (active && !controller.signal.aborted) {
          setLoadingJob(false);
        }
      }
    };

    getJob();
    return () => {
      active = false;
      controller.abort();
    };
  }, [jobId]);

  // Only candidate accounts with an active job fetch /api/resumes; state is scoped by jobId::accountId.
  useEffect(() => {
    if (!resumeFetchScope) {
      setResumesState({
        scope: null,
        items: [],
        loading: false,
        error: "",
      });
      return undefined;
    }

    const activeScope = resumeFetchScope;
    const controller = new AbortController();
    let active = true;

    setResumesState({
      scope: activeScope,
      items: [],
      loading: true,
      error: "",
    });

    const fetchResumes = async () => {
      try {
        const res = await fetch("/api/resumes", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (!active || controller.signal.aborted) return;
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data?.message || "Không thể tải danh sách CV đã lưu.");
        }
        setResumesState({
          scope: activeScope,
          items: data,
          loading: false,
          error: "",
        });
      } catch (err) {
        if (err?.name === "AbortError" || !active || controller.signal.aborted) return;
        setResumesState({
          scope: activeScope,
          items: [],
          loading: false,
          error: err?.message || "Không thể tải danh sách CV đã lưu.",
        });
      }
    };

    fetchResumes();
    return () => {
      active = false;
      controller.abort();
    };
  }, [resumeFetchScope, resumesReloadToken]);

  const handleRetryResumes = useCallback(() => {
    setResumesReloadToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!job) {
      setSimilarJobs([]);
      return;
    }
      const scored = publicJobs
        .filter((j) => j.id !== job.id)
        .map((j) => {
          let score = 0;

          if (job.tags && j.tags) {
            const commonTags = j.tags.filter((t) => job.tags.includes(t));
            score += commonTags.length * 3;
          }

          if (job.location && j.location) {
            const loc1 = job.location.toLowerCase();
            const loc2 = j.location.toLowerCase();
            if (
        (loc1.includes("hồ chí minh") && loc2.includes("hồ chí minh")) ||
              (loc1.includes("hcm") && loc2.includes("hcm")) ||
        (loc1.includes("hà nội") && loc2.includes("hà nội")) ||
        (loc1.includes("đà nẵng") && loc2.includes("đà nẵng"))
            ) {
              score += 2;
            }
          }

          if (job.type && j.type && job.type === j.type) {
            score += 1;
          }

          return { job: j, score };
        });

      const top3 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.job);

      setSimilarJobs(top3);
  }, [job, publicJobs]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
      showToast("Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!", "success");
  };

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-[var(--page-background)] font-sans text-sm text-slate-900 antialiased">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 text-gray-400 font-medium">
            Đang tải thông tin tuyển dụng...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[var(--page-background)] font-sans text-sm text-slate-900 antialiased">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 w-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">
            Không tìm thấy tin tuyển dụng
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Tin tuyển dụng này có thể đã hết hạn hoặc không tồn tại.
            </p>
            <button
              type="button"
              onClick={() => navigate("/Jobs")}
              className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Quay lại danh sách việc làm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1080px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="mb-2.5 flex items-center justify-between">
          <button type="button" onClick={() => navigate("/AllJobs")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-violet-700">
            <ArrowLeftIcon className="h-4 w-4" /> Tất cả việc làm
          </button>
          <button type="button" onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-violet-700">
            <ShareIcon className="h-4 w-4" /> Chia sẻ
          </button>
        </div>

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-base font-bold text-violet-700 ring-1 ring-violet-200">
                {job.company?.slice(0, 2).toUpperCase() || "CV"}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">{job.title}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${jobIsUnavailable ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                    {jobIsUnavailable ? <ExclamationTriangleIcon className="h-3 w-3" /> : <SignalIcon className="h-3 w-3" />}
                    {jobIsDeleted ? "Tin đã xoá" : jobIsExpired ? "Đã hết hạn" : jobIsUnavailable ? "Đã đóng" : "Đang tuyển"}
                  </span>
                </div>
                <p className="font-semibold text-violet-700">{job.company}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />{job.location}</span>
                  <span className="inline-flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" />Đăng {job.postedAt}</span>
                  <span className="inline-flex items-center gap-1"><UserGroupIcon className="h-3.5 w-3.5" />{job.applicants} ứng viên</span>
                  <span className="inline-flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" />{job.views} lượt xem</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {isCandidate && !jobIsUnavailable && (
                <button
                  type="button"
                  onClick={() => navigate("/ai-interview?jobId=" + encodeURIComponent(jobId))}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:border-violet-400"
                >
                  Luyện phỏng vấn cho vị trí này
                </button>
              )}
              <button
                type="button"
                disabled={jobIsUnavailable && !matchedApplication}
                onClick={() => document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {matchedApplication
                  ? "Đã ứng tuyển"
                  : jobIsExpired
                    ? "Đã hết hạn"
                    : jobIsUnavailable
                      ? "Không còn nhận hồ sơ"
                      : "Ứng tuyển ngay"}
              </button>
              <button
                type="button"
                onClick={() => toggleSave(jobId)}
                disabled={pendingIds.has(jobId) || (jobIsUnavailable && !isSaved(jobId))}
                className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition " + (isSaved(jobId) ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700") + (pendingIds.has(jobId) ? " cursor-not-allowed opacity-50" : "")}
              >
                {isSaved(jobId) ? <BookmarkSolid className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
                {isSaved(jobId) ? "Đã lưu" : "Lưu"}
              </button>
            </div>
          </div>
        </section>

        {jobIsUnavailable && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{jobIsExpired ? "Tin tuyển dụng này đã hết hạn. Hệ thống không nhận thêm CV mới." : "Tin tuyển dụng này đã đóng hoặc đã bị xoá. Nội dung chỉ được giữ lại để người đã lưu hoặc đã ứng tuyển xem lịch sử; hệ thống không nhận hồ sơ mới."}</span>
          </div>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-base font-bold text-slate-950">Thông tin công việc</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm"><CurrencyDollarIcon className="h-5 w-5" /></div>
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Mức lương</p><p className="font-bold text-violet-700">{job.salary}</p></div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm"><CalendarDaysIcon className="h-5 w-5" /></div>
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Hạn nộp hồ sơ</p><p className="font-bold text-slate-900">{job.deadline}</p></div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  [BriefcaseIcon, "Loại công việc", job.type],
                  [UserGroupIcon, "Kinh nghiệm", job.experience],
                  [AcademicCapIcon, "Học vấn", job.education],
                  [ComputerDesktopIcon, "Mô hình làm việc", job.workModel],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-3">
                    <Icon className="h-4 w-4 shrink-0 text-violet-600" />
                    <div><p className="text-[11px] text-slate-500">{label}</p><p className="text-xs font-semibold text-slate-800">{value}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{tag}</span>)}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <h2 className="mb-2 text-base font-bold text-slate-950">Mô tả công việc</h2>
                <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{job.description}</p>
              </div>
              <div className="my-5 border-t border-slate-100" />
              <div>
                <h2 className="mb-2 text-base font-bold text-slate-950">Yêu cầu ứng viên</h2>
                <ul className="space-y-2">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-violet-600" /><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div className="my-5 border-t border-slate-100" />
              <div>
                <h2 className="mb-2 text-base font-bold text-slate-950">Quyền lợi</h2>
                <ul className="space-y-2">
                  {job.benefits.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><LightBulbIcon className="mt-1 h-4 w-4 shrink-0 text-amber-500" /><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div className="my-5 border-t border-slate-100" />
              <div>
                <h2 className="mb-2 text-base font-bold text-slate-950">Địa điểm làm việc</h2>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span>{job.address || job.location}</span></div>
              </div>
            </section>

            <section className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-white py-4 text-center shadow-sm">
              <div><p className="text-lg font-bold text-slate-950">{job.views}</p><p className="text-[11px] text-slate-500">Lượt xem</p></div>
              <div><p className="text-lg font-bold text-slate-950">{job.applicants}</p><p className="text-[11px] text-slate-500">Ứng viên</p></div>
              <div><p className="text-sm font-bold text-slate-950">{job.deadline}</p><p className="text-[11px] text-slate-500">Hạn ứng tuyển</p></div>
            </section>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
            <JobApplicationWizard
              key={wizardScopeKey}
              job={job}
              jobIdParam={jobId}
              jobIsUnavailable={jobIsUnavailable}
              jobIsExpired={jobIsExpired}
              currentUser={currentUser}
              isAuthChecked={isAuthChecked}
              isCandidate={isCandidate}
              accountId={accountId}
              savedResumes={savedResumes}
              loadingResumes={loadingResumes}
              resumesError={resumesError}
              onRetryResumes={handleRetryResumes}
              matchedApplication={matchedApplication}
              loadingApplications={loadingApplications}
              applicationsError={applicationsQueryError?.message || ""}
              onRetryApplications={refetchApplications}
              onApplicationConfirmed={invalidateMyApplications}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">{job.company?.slice(0, 2).toUpperCase() || "CV"}</div>
                <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-950">{job.company}</h2><p className="text-[11px] text-slate-500">{job.companySize || "Đang cập nhật quy mô"}</p></div>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <p className="flex items-start gap-2"><BuildingOfficeIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span>{job.companyIndustry || "Đang cập nhật lĩnh vực"}</span></p>
                <p className="flex items-start gap-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span>{job.location}</span></p>
                <p className="flex items-start gap-2"><GlobeAltIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span className="truncate">{job.companyWebsite || "Website đang cập nhật"}</span></p>
              </div>
              <button type="button" onClick={() => navigate(`/profile/${job.companyId}`)} disabled={!job.companyId} className="mt-3 w-full rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">Xem trang công ty</button>
            </section>

            {similarJobs.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2.5 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-950">Việc làm tương tự</h2><button type="button" onClick={() => navigate("/AllJobs")} className="text-[11px] font-semibold text-violet-700 hover:text-violet-800">Xem tất cả</button></div>
                <div className="space-y-2.5">
                  {similarJobs.slice(0, 3).map((similarJob) => (
                    <button
                      key={similarJob.id}
                      type="button"
                      onClick={() => {
                        navigate("/jobs/" + similarJob.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="block w-full rounded-xl border border-slate-100 p-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/50"
                    >
                      <p className="line-clamp-2 text-xs font-bold text-slate-800">{similarJob.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">{similarJob.company}</p>
                      <p className="mt-1 text-[11px] font-semibold text-violet-700">{similarJob.salary}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
