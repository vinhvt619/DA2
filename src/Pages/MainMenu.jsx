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
import { jobsData } from "../data/jobsData.js";
import { newsArticles } from "../data/newsArticles.js";

const categoryOptions = [
  { value: "", label: "Tất cả ngành nghề" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
];

const quickFilters = [
  { value: "full-time", label: "Toàn thời gian" },
  { value: "intern", label: "Thực tập" },
  { value: "remote", label: "Làm từ xa" },
  { value: "part-time", label: "Bán thời gian" },
];

function normalizeText(value = "") {
  return value.toLocaleLowerCase("vi-VN");
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
    <article className="group flex items-start gap-3 border-b border-slate-100 px-4 py-4 transition-colors last:border-0 hover:bg-slate-50/80">
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
    <article className="flex items-start gap-2.5 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
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

function MainMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState(location.state?.searchKeyword || "");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");
  const [sortMode, setSortMode] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [dbJobs, setDbJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.searchKeyword !== undefined) {
      setSearchKeyword(location.state.searchKeyword);
    }
  }, [location.state?.searchKeyword]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) return;

        const data = await response.json();
        setDbJobs(
          data.map((job) => ({
            ...job,
            id: job._id,
            postedAt: new Date(job.createdAt).toLocaleDateString("vi-VN"),
            tags: job.tags || [],
          })),
        );
      } catch (error) {
        console.error("Lỗi khi tải danh sách công việc:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const allJobs = useMemo(() => {
    const seen = new Set();
    return [...dbJobs, ...jobsData].filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  }, [dbJobs]);

  const refreshRecommendedJobs = useCallback(() => {
    if (allJobs.length > 0) {
      setRecommendedJobs(shuffleArray(allJobs).slice(0, 3));
    }
  }, [allJobs]);

  useEffect(() => {
    refreshRecommendedJobs();
  }, [refreshRecommendedJobs]);

  const filteredJobs = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());
    const place = normalizeText(searchLocation.trim());

    return allJobs.filter((job) => {
      const searchableText = normalizeText(
        [job.title, job.company, ...(job.tags ?? [])].filter(Boolean).join(" "),
      );
      const jobLocation = normalizeText(job.location);
      const jobType = normalizeText(
        [job.type, job.workModel, ...(job.tags ?? [])].filter(Boolean).join(" "),
      );

      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesLocation = !place || jobLocation.includes(place);
      const matchesCategory = !selectedCategory || searchableText.includes(selectedCategory);
      const matchesWorkType = !selectedWorkType || jobType.includes(selectedWorkType);

      return matchesKeyword && matchesLocation && matchesCategory && matchesWorkType;
    });
  }, [allJobs, searchKeyword, searchLocation, selectedCategory, selectedWorkType]);

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

  const profileFields = [
    currentUser?.fullName,
    currentUser?.experiences?.[0]?.position,
    currentUser?.address || currentUser?.hometown,
    currentUser?.phoneNumber,
    currentUser?.educations?.length > 0,
    currentUser?.experiences?.length > 0,
  ];
  const profileProgress = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );

  const hasActiveFilters = Boolean(
    searchKeyword || searchLocation || selectedCategory || selectedWorkType,
  );

  const resetFilters = () => {
    setSearchKeyword("");
    setSearchLocation("");
    setSelectedCategory("");
    setSelectedWorkType("");
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const searchTerm = [searchKeyword.trim(), searchLocation.trim()].filter(Boolean).join(" ");
    navigate("/AllJobs", { state: { searchKeyword: searchTerm } });
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <div className="mx-auto w-full max-w-[1360px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="grid justify-center items-start gap-4 lg:grid-cols-[224px_minmax(0,720px)] xl:grid-cols-[224px_minmax(0,680px)_300px]">
          <div className="order-2 min-w-0 lg:order-none lg:sticky lg:top-20">
            <StickyProfile />
          </div>

          <main className="order-1 min-w-0 space-y-3.5 lg:order-none">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
              <div>
                <h1 className="text-lg font-semibold tracking-[-0.015em] text-slate-950 sm:text-xl">
                  Tìm công việc phù hợp
                </h1>
                <p className="mt-1 text-[11px] leading-4.5 text-slate-500 sm:text-xs">
                  Tìm theo kỹ năng, công ty hoặc địa điểm bạn muốn làm việc.
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
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500"
                    />
                  </label>

                  <label className="relative sm:w-44">
                    <span className="sr-only">Địa điểm làm việc</span>
                    <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchLocation}
                      onChange={(event) => setSearchLocation(event.target.value)}
                      placeholder="Địa điểm"
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500"
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
                    onClick={() => setShowFilters((current) => !current)}
                    aria-expanded={showFilters}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium focus:outline-none ${
                      showFilters || selectedCategory
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Bộ lọc
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {quickFilters.map((filter) => {
                    const active = selectedWorkType === filter.value;
                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setSelectedWorkType(active ? "" : filter.value)}
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition ${
                          active
                            ? "border-violet-300 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {showFilters && (
                  <div className="mt-2.5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-end">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium text-slate-500">
                      Ngành nghề
                      <select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400"
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="self-end rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-violet-700"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                )}
              </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
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
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
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

            <section className="border-l border-slate-300 py-0.5 pl-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <NewspaperIcon className="h-4 w-4 text-slate-500" />
                  Tin mới nhất
                </h2>
                <Link to="/News" className="text-[10px] font-medium text-slate-400 hover:text-violet-700">
                  Xem tất cả
                </Link>
              </div>
              <div className="space-y-4">
                {newsArticles.slice(0, 3).map((article) => (
                  <Link
                    key={article.slug}
                    to={`/News/${article.slug}`}
                    className="group relative block"
                  >
                    <span className="absolute -left-[20.5px] top-1.5 h-2 w-2 rounded-full border-2 border-[#f6f5f8] bg-slate-400 transition group-hover:bg-violet-600" />
                    <span className="block min-w-0">
                      <span className="line-clamp-2 text-[11px] font-medium leading-4.5 text-slate-700 transition group-hover:text-violet-700">
                        {article.title}
                      </span>
                      <span className="mt-1 block text-[9px] text-slate-400">{article.date}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-violet-200/80 bg-violet-50/60 p-4">
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
                to="/Profile"
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

export default MainMenu;
