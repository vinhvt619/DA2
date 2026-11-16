import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import usePublicJobs from "../hooks/usePublicJobs.js";
import {
  CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  WORK_TYPE_OPTIONS,
  parsePublicJobsSearchParams,
  toPublicJobsSearchParams,
} from "../../shared/jobQueryPolicy.js";

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
          <div className="h-3.5 w-3/5 rounded bg-slate-200" />
          <div className="h-3 w-2/5 rounded bg-slate-100" />
          <div className="h-5 w-4/5 rounded bg-slate-100" />
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
            <span className="max-w-52 truncate">
              {getShortLocation(job.location)}
            </span>
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

      <div className="flex flex-col items-end justify-between">
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
      </div>
    </article>
  );
}

function AllJobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlValidation = useMemo(
    () => parsePublicJobsSearchParams(searchParams),
    [searchParams],
  );
  const {
    keyword: urlKeyword,
    location: urlLocation,
    category: urlCategory,
    workTypes: urlWorkTypes,
    sort: urlSort,
    page: currentPage,
    limit: urlLimit,
    companyId: urlCompanyId,
  } = urlValidation.params;

  // Local state for debounced keyword input
  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [showFilters, setShowFilters] = useState(true);
  const [showWorkTypeOptions, setShowWorkTypeOptions] = useState(false);

  useEffect(() => {
    setKeywordInput(urlKeyword);
  }, [urlKeyword]);

  // Centralized URL search params updater
  const updateUrlFilters = useCallback(
    (updates = {}, resetPage = true, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const current = parsePublicJobsSearchParams(prev).params;
          const nextKeyword =
            updates.keyword !== undefined ? updates.keyword : current.keyword;
          const nextLocation =
            updates.location !== undefined ? updates.location : current.location;
          const nextCategory =
            updates.category !== undefined ? updates.category : current.category;
          const nextWorkTypes =
            updates.workTypes !== undefined ? updates.workTypes : current.workTypes;
          const nextSort =
            updates.sort !== undefined ? updates.sort : current.sort;
          const nextPage = resetPage
            ? 1
            : updates.page !== undefined
              ? updates.page
              : current.page;
          const nextLimit =
            updates.limit !== undefined ? updates.limit : current.limit;
          const nextCompanyId =
            updates.companyId !== undefined ? updates.companyId : current.companyId;

          return toPublicJobsSearchParams({
            keyword: nextKeyword,
            location: nextLocation,
            category: nextCategory,
            workTypes: nextWorkTypes,
            sort: nextSort,
            page: nextPage,
            limit: nextLimit,
            companyId: nextCompanyId,
          });
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  // Debounce free typing (~300ms) to avoid request per keystroke
  useEffect(() => {
    if (!urlValidation.isValid) return;
    if (keywordInput.normalize("NFC").trim() === urlKeyword.normalize("NFC").trim()) {
      return;
    }
    const timer = setTimeout(() => {
      updateUrlFilters({ keyword: keywordInput.normalize("NFC").trim() }, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput, urlKeyword, urlValidation.isValid, updateUrlFilters]);

  // Server-side filtered, sorted, and paginated query
  const {
    jobs: paginatedJobs,
    total,
    totalPages,
    isLoading,
    isFetching,
    isPlaceholderData,
    isMatchingSuccess,
    error: jobsError,
    refetch: refetchJobs,
  } = usePublicJobs({
    keyword: urlKeyword,
    location: urlLocation,
    category: urlCategory,
    workTypes: urlWorkTypes,
    sort: urlSort,
    page: currentPage,
    limit: urlLimit,
    companyId: urlCompanyId,
    enabled: urlValidation.isValid,
  });

  // Out-of-bounds page correction only on matching verified server success
  useEffect(() => {
    if (
      urlValidation.isValid &&
      isMatchingSuccess &&
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      updateUrlFilters({ page: totalPages }, false, { replace: true });
    }
  }, [
    urlValidation.isValid,
    isMatchingSuccess,
    totalPages,
    currentPage,
    updateUrlFilters,
  ]);

  const activeFilterCount =
    Number(Boolean(urlLocation)) +
    Number(Boolean(urlCategory)) +
    urlWorkTypes.length;

  const hasActiveFilters = Boolean(
    urlKeyword || urlLocation || urlCategory || urlWorkTypes.length,
  );

  const selectedWorkTypeLabel = useMemo(() => {
    if (urlWorkTypes.length === 0) return "Tất cả hình thức";
    if (urlWorkTypes.length === 1) {
      return WORK_TYPE_OPTIONS.find(
        (option) => option.value === urlWorkTypes[0],
      )?.label;
    }
    return `${urlWorkTypes.length} hình thức đã chọn`;
  }, [urlWorkTypes]);

  const toggleWorkType = (value) => {
    const nextList = urlWorkTypes.includes(value)
      ? urlWorkTypes.filter((workType) => workType !== value)
      : [...urlWorkTypes, value];
    updateUrlFilters({ workTypes: nextList }, true);
  };

  const resetFilters = () => {
    setKeywordInput("");
    setSearchParams(new URLSearchParams(), { replace: false });
    setShowWorkTypeOptions(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateUrlFilters({ keyword: keywordInput.normalize("NFC").trim() }, true);
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
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
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
                        value={urlLocation}
                        onChange={(event) =>
                          updateUrlFilters({ location: event.target.value }, true)
                        }
                        className="h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-[11px] text-slate-700 outline-none focus:border-violet-400"
                      >
                        {LOCATION_OPTIONS.map((option) => (
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
                        value={urlCategory}
                        onChange={(event) =>
                          updateUrlFilters({ category: event.target.value }, true)
                        }
                        className="h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-7 text-[11px] text-slate-700 outline-none focus:border-violet-400"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
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
                        {WORK_TYPE_OPTIONS.map((option) => {
                          const checked = urlWorkTypes.includes(option.value);
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

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Danh sách việc làm
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {!urlValidation.isValid
                  ? "Tham số lọc không hợp lệ"
                  : isLoading
                    ? "Đang tải danh sách việc làm..."
                    : isPlaceholderData && isFetching
                      ? `Đang tải trang ${currentPage}...`
                      : jobsError
                        ? "Không thể tải danh sách việc làm"
                        : `${total} cơ hội việc làm khả dụng`}
              </p>
            </div>

            <label className="relative">
              <span className="sr-only">Sắp xếp việc làm</span>
              <select
                value={urlSort}
                onChange={(event) =>
                  updateUrlFilters({ sort: event.target.value }, true)
                }
                disabled={!urlValidation.isValid}
                className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-[11px] font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="newest">Mới nhất</option>
                <option value="salary">Lương cao</option>
                <option value="match">Phù hợp nhất</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          </div>

          <div
            aria-busy={urlValidation.isValid && (isLoading || isFetching)}
            className={isPlaceholderData ? "opacity-75 transition-opacity" : ""}
          >
            {!urlValidation.isValid ? (
              <div role="alert" className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-red-700">
                  Tham số tìm kiếm trong đường dẫn không hợp lệ
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {urlValidation.error}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  Đặt lại bộ lọc mặc định
                </button>
              </div>
            ) : isLoading ? (
              <>
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </>
            ) : jobsError ? (
              <div
                role="alert"
                className="px-5 py-8 text-center text-sm text-red-700"
              >
                Không thể tải danh sách việc làm.
                <button
                  type="button"
                  onClick={() => refetchJobs()}
                  className="ml-2 font-semibold underline"
                >
                  Thử lại
                </button>
              </div>
            ) : paginatedJobs.length > 0 ? (
              paginatedJobs.map((job, index) => (
                <AllJobRow
                  key={job.id}
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

          {urlValidation.isValid && !isLoading && !jobsError && total > 0 && (
            <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
              <span className="text-[10px] text-slate-500">
                Trang{" "}
                <strong className="font-semibold text-slate-700">
                  {currentPage}
                </strong>{" "}
                / {totalPages}
                <span className="mx-1.5">·</span>
                <strong className="font-semibold text-slate-700">
                  {total}
                </strong>{" "}
                công việc
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateUrlFilters({ page: Math.max(1, currentPage - 1) }, false)
                  }
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => updateUrlFilters({ page }, false)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                        currentPage === page
                          ? "bg-violet-600 text-white"
                          : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateUrlFilters(
                      { page: Math.min(totalPages, currentPage + 1) },
                      false,
                    )
                  }
                  disabled={currentPage >= totalPages}
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
