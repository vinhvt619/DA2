import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSavedJobs } from "../context/SavedJobsContext.jsx";
import usePublicJobs from "../hooks/usePublicJobs.js";
import usePublicNews from '../hooks/usePublicNews.js';
import { getProfileCompletion } from "../utils/profileCompletion.js";

const categoryOptions = [
  { value: "", label: "Tất cả ngành nghề" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
];

const locationOptions = [
  { value: "", label: "Tất cả địa điểm" },
  { value: "ho chi minh", label: "TP. Hồ Chí Minh" },
  { value: "ha noi", label: "Hà Nội" },
  { value: "da nang", label: "Đà Nẵng" },
  { value: "hai phong", label: "Hải Phòng" },
];

const workTypeOptions = [
  { value: "full-time", label: "Toàn thời gian" },
  { value: "intern", label: "Thực tập" },
  { value: "remote", label: "Làm từ xa" },
  { value: "part-time", label: "Bán thời gian" },
];

function normalizeText(value = "") {
  return value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
}

function normalizeLocation(value = "") {
  return normalizeText(value).replace(/\btp\.?\s*hcm\b/g, "ho chi minh");
}

function shuffleArray(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getSalaryMaximum(salary = "") {
  const values = salary.match(/\d+/g)?.map(Number) ?? [0];
  return Math.max(...values);
}

function getShortLocation(location = "") {
  if (location.includes("Hồ Chí Minh") || location.includes("HCM")) {
    return "TP. Hồ Chí Minh";
  }
  if (location.includes("Hà Nội")) return "Hà Nội";
  if (location.includes("Đà Nẵng")) return "Đà Nẵng";
  return location.split(",").slice(-2).join(", ").trim() || "Việt Nam";
}

function getCompanyColor(company = "") {
  const palette = ["#2563eb", "#7c3aed", "#059669", "#ea580c", "#db2777"];
  const total = [...company].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function JobSkeleton() {
  return (
    <div className="animate-pulse border-b border-slate-100 px-4 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3.5 w-3/5 rounded bg-slate-200" />
          <div className="h-3 w-2/5 rounded bg-slate-100" />
          <div className="h-5 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function MainJobCard({ job, isNew = false }) {
  const { isSaved, pendingIds, toggleSave } = useSavedJobs();
  const saved = isSaved(job.id);
  const pending = pendingIds.has(job.id);
  const companyColor = getCompanyColor(job.company);

  return (
    <article className="group flex items-start gap-3 border-b border-slate-100 px-4 py-4 transition-colors last:border-0 hover:bg-violet-50/70">
      <Link to={`/jobs/${job.id}`} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold"
          style={{
            color: companyColor,
            borderColor: `${companyColor}33`,
            backgroundColor: `${companyColor}0d`,
          }}
        >
          {job.company?.slice(0, 2).toUpperCase() || "CV"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-violet-700">
              {job.title}
            </span>
            {isNew && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                Mới
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-500">{job.company}</span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="max-w-48 truncate">{getShortLocation(job.location)}</span>
            </span>
            <span className="font-medium text-slate-600">{job.type}</span>
            <span className="font-semibold text-emerald-600">{job.salary}</span>
          </span>

          {job.tags?.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                  {tag}
                </span>
              ))}
            </span>
          )}
        </span>
      </Link>

      <span className="flex shrink-0 flex-col items-end gap-5">
        <button
          type="button"
          disabled={pending}
          onClick={() => toggleSave(job.id)}
          aria-label={saved ? "Bỏ lưu công việc" : "Lưu công việc"}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? (
            <HeartSolidIcon className="h-4 w-4 text-violet-600" />
          ) : (
            <HeartIcon className="h-4 w-4" />
          )}
        </button>
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] text-slate-400">
          <ClockIcon className="h-3 w-3" />
          {job.postedAt}
        </span>
      </span>
    </article>
  );
}

function SuggestedJob({ job }) {
  const navigate = useNavigate();
  const { isSaved, pendingIds, toggleSave } = useSavedJobs();
  const saved = isSaved(job.id);
  const pending = pendingIds.has(job.id);

  return (
    <article className="flex items-start gap-2.5 rounded-lg border-b border-slate-100 px-2 py-3 transition-colors first:pt-2 last:border-0 last:pb-2 hover:bg-violet-50/70">
      <button
        type="button"
        onClick={() => navigate(`/jobs/${job.id}`)}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-[10px] font-bold"
          style={{ color: getCompanyColor(job.company), borderColor: `${getCompanyColor(job.company)}33` }}
        >
          {job.company?.slice(0, 2).toUpperCase() || "CV"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-slate-900 transition-colors hover:text-violet-700">
            {job.title}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
            {job.company}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2 text-[9px]">
            <span className="shrink-0 font-semibold text-emerald-600">{job.salary}</span>
            <span className="truncate text-slate-400">{getShortLocation(job.location)}</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => toggleSave(job.id)}
        aria-label={saved ? "Bỏ lưu công việc" : "Lưu công việc"}
        className="mt-0.5 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saved ? (
          <HeartSolidIcon className="h-4 w-4 text-violet-600" />
        ) : (
          <HeartIcon className="h-4 w-4" />
        )}
      </button>
    </article>
  );
}

function Jobs() {
  const { articles: newsArticles } = usePublicNews();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState(location.state?.searchKeyword || "");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorkTypes, setSelectedWorkTypes] = useState([]);
  const [sortMode, setSortMode] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showWorkTypeOptions, setShowWorkTypeOptions] = useState(false);
  const { jobs: allJobs, isLoading, error: jobsError, refetch: refetchJobs } = usePublicJobs();
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    if (location.state?.searchKeyword !== undefined) {
      setSearchKeyword(location.state.searchKeyword);
    }
  }, [location.state?.searchKeyword]);

  const refreshRecommendedJobs = useCallback(() => {
    setRecommendedJobs(shuffleArray(allJobs).slice(0, 3));
  }, [allJobs]);

  useEffect(() => {
    refreshRecommendedJobs();
  }, [refreshRecommendedJobs]);

  const filteredJobs = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());
    const place = normalizeLocation(searchLocation.trim());

    return allJobs.filter((job) => {
      const searchableText = normalizeText(
        [job.title, job.company, ...(job.tags ?? [])].filter(Boolean).join(" "),
      );
      const jobLocation = normalizeLocation(job.location);
      const jobType = normalizeText(
        [job.type, job.workModel, ...(job.tags ?? [])].filter(Boolean).join(" "),
      );

      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesLocation = !place || jobLocation.includes(place);
      const matchesCategory = !selectedCategory || searchableText.includes(selectedCategory);
      const matchesWorkType =
        selectedWorkTypes.length === 0 ||
        selectedWorkTypes.some((workType) => jobType.includes(workType));

      return matchesKeyword && matchesLocation && matchesCategory && matchesWorkType;
    });
  }, [allJobs, searchKeyword, searchLocation, selectedCategory, selectedWorkTypes]);

  const sortedJobs = useMemo(() => {
    const next = [...filteredJobs];
    if (sortMode === "salary") {
      next.sort((a, b) => getSalaryMaximum(b.salary) - getSalaryMaximum(a.salary));
    }
    if (sortMode === "match") {
      next.sort((a, b) => (b.tags?.length ?? 0) - (a.tags?.length ?? 0));
    }
    return next;
  }, [filteredJobs, sortMode]);

  const profileProgress = getProfileCompletion(currentUser);

  const hasActiveFilters = Boolean(
    searchKeyword || searchLocation || selectedCategory || selectedWorkTypes.length,
  );
  const activeFilterCount =
    Number(Boolean(searchLocation)) +
    Number(Boolean(selectedCategory)) +
    selectedWorkTypes.length;

  const selectedWorkTypeLabel = useMemo(() => {
    if (selectedWorkTypes.length === 0) return "Tất cả hình thức";
    if (selectedWorkTypes.length === 1) {
      return workTypeOptions.find((option) => option.value === selectedWorkTypes[0])?.label;
    }
    return `${selectedWorkTypes.length} hình thức đã chọn`;
  }, [selectedWorkTypes]);

  const toggleWorkType = (value) => {
    setSelectedWorkTypes((current) =>
      current.includes(value)
        ? current.filter((workType) => workType !== value)
        : [...current, value],
    );
  };

  const resetFilters = () => {
    setSearchKeyword("");
    setSearchLocation("");
    setSelectedCategory("");
    setSelectedWorkTypes([]);
    setShowWorkTypeOptions(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    navigate("/AllJobs", { state: { searchKeyword: searchKeyword.trim() } });
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <div className="mx-auto w-full max-w-[1360px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="grid items-start justify-center gap-4 lg:grid-cols-[224px_minmax(0,720px)] xl:grid-cols-[224px_minmax(0,680px)_300px]">
          <div className="order-2 min-w-0 lg:order-none lg:sticky lg:top-20">
            <StickyProfile />
          </div>

          <main className="order-1 min-w-0 space-y-3.5 lg:order-none">
            <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-white via-white to-violet-50 p-4 shadow-[0_8px_24px_rgba(76,29,149,0.08)]">
              <div>
                <h1 className="text-lg font-semibold tracking-[-0.015em] text-slate-950 sm:text-xl">
                  Tìm công việc phù hợp
                </h1>
                <p className="mt-1 text-[11px] leading-4.5 text-slate-500 sm:text-xs">
                  Tìm theo tên công việc, kỹ năng hoặc công ty bạn quan tâm.
                </p>
              </div>

              <form onSubmit={submitSearch} className="mt-3.5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative flex-1">
                    <span className="sr-only">Vị trí, kỹ năng hoặc công ty</span>
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="Tên công việc hoặc công ty"
                      className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700 focus:outline-none"
                  >
                    Tìm kiếm
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowFilters((current) => !current);
                      setShowWorkTypeOptions(false);
                    }}
                    aria-expanded={showFilters}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium focus:outline-none ${
                      showFilters || activeFilterCount > 0
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Bộ lọc
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-2.5 rounded-lg border border-violet-200 bg-white p-3 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Địa điểm
                        <span className="relative">
                          <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <select
                            value={searchLocation}
                            onChange={(event) => setSearchLocation(event.target.value)}
                            className="h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-[11px] text-slate-700 outline-none focus:border-violet-400"
                          >
                            {locationOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </span>
                      </label>

                      <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
                        Ngành nghề
                        <span className="relative">
                          <select
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                            className="h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-7 text-[11px] text-slate-700 outline-none focus:border-violet-400"
                          >
                            {categoryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </span>
                      </label>

                      <div className="relative flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
                        <span>Hình thức công việc</span>
                        <button
                          type="button"
                          onClick={() => setShowWorkTypeOptions((current) => !current)}
                          aria-haspopup="listbox"
                          aria-expanded={showWorkTypeOptions}
                          className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-[11px] font-normal outline-none ${
                            showWorkTypeOptions
                              ? "border-violet-400 ring-2 ring-violet-100"
                              : "border-slate-300 text-slate-700"
                          }`}
                        >
                          <span className="truncate">{selectedWorkTypeLabel}</span>
                          <ChevronDownIcon
                            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                              showWorkTypeOptions ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {showWorkTypeOptions && (
                          <div
                            role="listbox"
                            aria-label="Chọn nhiều hình thức công việc"
                            aria-multiselectable="true"
                            className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-violet-100 bg-white p-1.5 shadow-[0_12px_28px_rgba(76,29,149,0.14)]"
                          >
                            {workTypeOptions.map((option) => {
                              const checked = selectedWorkTypes.includes(option.value);
                              return (
                                <label
                                  key={option.value}
                                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-normal text-slate-700 transition hover:bg-violet-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleWorkType(option.value)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 accent-violet-600"
                                  />
                                  <span>{option.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-2.5">
                      <p className="text-[10px] text-slate-400">
                        Có thể chọn đồng thời nhiều hình thức công việc.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 transition hover:bg-white"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.07)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Việc làm phù hợp</h2>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {filteredJobs.length} cơ hội đang mở
                  </p>
                </div>

                <label className="relative">
                  <span className="sr-only">Sắp xếp việc làm</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value)}
                    className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-[11px] font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-400"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="salary">Lương cao</option>
                    <option value="match">Phù hợp nhất</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </label>
              </div>

              <div>
                {isLoading ? (
                  <>
                    <JobSkeleton />
                    <JobSkeleton />
                    <JobSkeleton />
                  </>
                ) : jobsError ? (
                  <div role="alert" className="px-4 py-8 text-center text-sm text-red-700">
                    Không thể tải danh sách việc làm.
                    <button type="button" onClick={() => refetchJobs()} className="ml-2 font-semibold underline">Thử lại</button>
                  </div>
                ) : sortedJobs.length > 0 ? (
                  sortedJobs
                    .slice(0, 5)
                    .map((job, index) => <MainJobCard key={job.id} job={job} isNew={index < 2} />)
                ) : (
                  <div className="py-10 text-center">
                    <BriefcaseIcon className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Chưa tìm thấy công việc phù hợp
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Thử thay đổi từ khóa, địa điểm hoặc bộ lọc.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>

              {!isLoading && sortedJobs.length > 5 && (
                <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/AllJobs", { state: { searchKeyword } })}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                  >
                    Xem thêm việc làm
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </section>
          </main>

          <aside className="order-3 min-w-0 space-y-5 lg:col-start-2 lg:order-none xl:col-start-auto xl:sticky xl:top-20">
            <section className="rounded-xl border border-indigo-200 bg-[#fbfaff] p-4 shadow-[0_8px_22px_rgba(76,29,149,0.07)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-600">Dành cho bạn</p>
                  <h2 className="mt-0.5 text-sm font-semibold text-slate-900">Việc làm nên xem</h2>
                </div>
                <button
                  type="button"
                  onClick={refreshRecommendedJobs}
                  className="text-[10px] font-medium text-slate-400 hover:text-violet-700"
                >
                  Làm mới
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  <JobSkeleton />
                  <JobSkeleton />
                </div>
              ) : (
                recommendedJobs.map((job) => <SuggestedJob key={job.id} job={job} />)
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_8px_22px_rgba(76,29,149,0.07)]">
              <div className="flex items-center gap-2.5 border-b border-violet-100 bg-violet-50/70 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <NewspaperIcon className="h-4 w-4" />
                </span>
                <span>
                  <h2 className="text-sm font-semibold text-slate-900">Tin mới nhất</h2>
                  <p className="mt-0.5 text-[9px] text-slate-400">Kiến thức hữu ích cho hành trình nghề nghiệp</p>
                </span>
              </div>

              {newsArticles[0] && (
                <Link
                  to={`/News/${newsArticles[0].slug}`}
                  className="group block border-b border-slate-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-3.5"
                >
                  <span className="mb-2 inline-flex rounded-full bg-violet-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                    Nổi bật
                  </span>
                  <span className="line-clamp-2 text-[12px] font-semibold leading-4.5 text-slate-900 transition group-hover:text-violet-700">
                    {newsArticles[0].title}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                    {newsArticles[0].summary}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="font-medium text-violet-600">{newsArticles[0].category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{newsArticles[0].date}</span>
                  </span>
                </Link>
              )}

              <div className="px-4">
                {newsArticles.slice(1, 3).map((article) => (
                  <Link
                    key={article.slug}
                    to={`/News/${article.slug}`}
                    className="group block border-b border-slate-100 py-3 last:border-0"
                  >
                    <span className="line-clamp-2 text-[11px] font-medium leading-4.5 text-slate-700 transition group-hover:text-violet-700">
                      {article.title}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[9px] text-slate-400">
                      <span className="font-medium text-slate-500">{article.category}</span>
                      <span aria-hidden="true">•</span>
                      <span>{article.date}</span>
                    </span>
                  </Link>
                ))}
              </div>

              <Link
                to="/News"
                className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-2.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Xem tất cả tin tức
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="rounded-xl border border-violet-300 bg-gradient-to-br from-violet-100 via-violet-50 to-white p-4 shadow-[0_8px_22px_rgba(76,29,149,0.08)]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-semibold text-slate-800">Hồ sơ của bạn</h2>
                <span className="text-sm font-bold text-violet-700">{profileProgress}%</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all duration-500"
                  style={{ width: `${profileProgress}%` }}
                />
              </div>
              <p className="mt-2.5 text-[10px] leading-4 text-slate-500">
                Bổ sung kỹ năng và kinh nghiệm để hồ sơ dễ được chú ý hơn.
              </p>
              <Link
                to="/PersonalInformation"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-800"
              >
                Cập nhật hồ sơ
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Jobs;
