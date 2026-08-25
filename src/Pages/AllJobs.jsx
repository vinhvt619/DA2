import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import Header from "../Components/Header.jsx";
import { useSavedJobs } from "../context/SavedJobsContext.jsx";
import { jobsData } from "../data/jobsData.js";
import { formatDate } from "../utils/dateTime.js";

const locationOptions = [
  { value: "", label: "Tất cả địa điểm" },
  { value: "ho chi minh", label: "TP. Hồ Chí Minh" },
  { value: "ha noi", label: "Hà Nội" },
  { value: "da nang", label: "Đà Nẵng" },
  { value: "hai phong", label: "Hải Phòng" },
];

const categoryOptions = [
  { value: "", label: "Tất cả ngành nghề" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
];

const categoryKeywords = {
  it: [
    "it",
    "developer",
    "frontend",
    "backend",
    "software",
    "react",
    "node",
    "java",
    "python",
    "devops",
    "data",
    "qa",
  ],
  design: ["design", "designer", "ui/ux", "figma", "thiet ke"],
  marketing: ["marketing", "content", "seo", "social media"],
};

const workTypeOptions = [
  { value: "full-time", label: "Toàn thời gian" },
  { value: "intern", label: "Thực tập" },
  { value: "remote", label: "Làm từ xa" },
  { value: "part-time", label: "Bán thời gian" },
];

const JOBS_PER_PAGE = 8;

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
  const total = [...company].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return palette[total % palette.length];
}

function JobSkeleton() {
  return (
    <div className="animate-pulse border-b border-slate-100 px-4 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3.5 w-2/5 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-5 w-3/5 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function AllJobRow({ job, isNew = false }) {
  const { isSaved, pendingIds, toggleSave } = useSavedJobs();
  const saved = isSaved(job.id);
  const pending = pendingIds.has(job.id);
  const companyColor = getCompanyColor(job.company);

  return (
    <article className="group grid grid-cols-[42px_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-4 transition-colors last:border-0 hover:bg-slate-50/80">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg border text-[11px] font-bold"
        style={{
          color: companyColor,
          borderColor: `${companyColor}33`,
          backgroundColor: `${companyColor}0d`,
        }}
      >
        {job.company?.slice(0, 2).toUpperCase() || "CV"}
      </span>

      <Link to={`/jobs/${job.id}`} className="min-w-0 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-violet-700">
            {job.title}
          </span>
          {isNew && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
              Mới
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-500">
          {job.company}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="max-w-52 truncate">{getShortLocation(job.location)}</span>
          </span>
          <span className="font-medium text-slate-600">{job.type}</span>
          <span className="font-semibold text-emerald-600">{job.salary}</span>
        </span>

        {job.tags?.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </Link>

      <span className="flex shrink-0 flex-col items-end justify-between gap-5">
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

function AllJobs() {
  const location = useLocation();
  const [searchKeyword, setSearchKeyword] = useState(
    location.state?.searchKeyword || "",
  );
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWorkTypes, setSelectedWorkTypes] = useState([]);
  const [sortMode, setSortMode] = useState("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [showWorkTypeOptions, setShowWorkTypeOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dbJobs, setDbJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.searchKeyword !== undefined) {
      setSearchKeyword(location.state.searchKeyword);
      setCurrentPage(1);
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
            postedAt: formatDate(job.createdAt),
            tags: job.tags || [],
          })),
        );
      } catch (error) {
        console.error("Lỗi khi tải danh sách công việc từ DB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const allJobs = useMemo(() => {
    const seen = new Set();
    return [...dbJobs, ...jobsData].filter((job) => {
      const identity = `${job.company || ""}::${job.title || ""}`.toLocaleLowerCase("vi");
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }, [dbJobs]);

  const filteredJobs = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());
    const place = normalizeLocation(searchLocation);

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
      const matchesCategory =
        !selectedCategory ||
        categoryKeywords[selectedCategory].some((categoryKeyword) =>
          searchableText.includes(categoryKeyword),
        );
      const matchesWorkType =
        selectedWorkTypes.length === 0 ||
        selectedWorkTypes.some((workType) => jobType.includes(workType));

      return (
        matchesKeyword &&
        matchesLocation &&
        matchesCategory &&
        matchesWorkType
      );
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

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(
    () =>
      sortedJobs.slice(
        (currentPage - 1) * JOBS_PER_PAGE,
        currentPage * JOBS_PER_PAGE,
      ),
    [sortedJobs, currentPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeFilterCount =
    Number(Boolean(searchLocation)) +
    Number(Boolean(selectedCategory)) +
    selectedWorkTypes.length;
  const hasActiveFilters = Boolean(
    searchKeyword || searchLocation || selectedCategory || selectedWorkTypes.length,
  );
  const selectedWorkTypeLabel = useMemo(() => {
    if (selectedWorkTypes.length === 0) return "Tất cả hình thức";
    if (selectedWorkTypes.length === 1) {
      return workTypeOptions.find(
        (option) => option.value === selectedWorkTypes[0],
      )?.label;
    }
    return `${selectedWorkTypes.length} hình thức đã chọn`;
  }, [selectedWorkTypes]);

  const toggleWorkType = (value) => {
    setSelectedWorkTypes((current) =>
      current.includes(value)
        ? current.filter((workType) => workType !== value)
        : [...current, value],
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchKeyword("");
    setSearchLocation("");
    setSelectedCategory("");
    setSelectedWorkTypes([]);
    setSortMode("newest");
    setCurrentPage(1);
    setShowWorkTypeOptions(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <main className="mx-auto w-full max-w-[960px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          <h1 className="text-lg font-semibold tracking-[-0.015em] text-slate-950 sm:text-xl">
            Tất cả việc làm
          </h1>
          <p className="mt-1 text-[11px] leading-4.5 text-slate-500 sm:text-xs">
            Khám phá cơ hội phù hợp theo kỹ năng, công ty và định hướng của bạn.
          </p>

          <form onSubmit={submitSearch} className="mt-3.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Tên công việc hoặc công ty</span>
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => {
                    setSearchKeyword(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tên công việc hoặc công ty"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
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
                className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
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
              <div className="mt-2.5 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium text-slate-600">
                    Địa điểm
                    <span className="relative">
                      <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <select
                        value={searchLocation}
                        onChange={(event) => {
                          setSearchLocation(event.target.value);
                          setCurrentPage(1);
                        }}
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
                        onChange={(event) => {
                          setSelectedCategory(event.target.value);
                          setCurrentPage(1);
                        }}
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
                        {workTypeOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-normal text-slate-700 transition hover:bg-violet-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedWorkTypes.includes(option.value)}
                              onChange={() => toggleWorkType(option.value)}
                              className="h-3.5 w-3.5 rounded border-slate-300 accent-violet-600"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
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

        <section className="mt-3.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Danh sách việc làm</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {filteredJobs.length} cơ hội đang mở
              </p>
            </div>
            <label className="relative">
              <span className="sr-only">Sắp xếp việc làm</span>
              <select
                value={sortMode}
                onChange={(event) => {
                  setSortMode(event.target.value);
                  setCurrentPage(1);
                }}
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
            ) : paginatedJobs.length > 0 ? (
              paginatedJobs.map((job, index) => (
                <AllJobRow
                  key={`page-${currentPage}-${job.id}`}
                  job={job}
                  isNew={currentPage === 1 && index < 2}
                />
              ))
            ) : (
              <div className="px-5 py-12 text-center">
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

          {!isLoading && filteredJobs.length > 0 && (
            <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
              <span className="text-[10px] text-slate-500">
                Trang <strong className="font-semibold text-slate-700">{currentPage}</strong> / {totalPages}
                <span className="mx-1.5">·</span>
                <strong className="font-semibold text-slate-700">{filteredJobs.length}</strong> công việc
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                          currentPage === page
                            ? "bg-violet-600 text-white"
                            : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AllJobs;
