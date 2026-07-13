import React, { useEffect, useMemo, useState, useCallback } from "react";
import Jobs from "../Components/ListJob.jsx";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import FilterDropdown from "../Components/FilterDropdown.jsx";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  FireIcon,
  BriefcaseIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { jobsData } from "../data/jobsData.js";
import { useLocation, useNavigate } from "react-router-dom";

const filterOptions = [
  { value: "", label: "Tất cả" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

const LATEST_PER_PAGE = 4;

const JobSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 p-4 bg-white/60">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  </div>
);

function MainMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(
    location.state?.searchKeyword || "",
  );
  const [dbJobs, setDbJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestPage, setLatestPage] = useState(1);

  useEffect(() => {
    if (location.state?.searchKeyword !== undefined) {
      setSearchKeyword(location.state.searchKeyword);
      setLatestPage(1);
    }
  }, [location.state?.searchKeyword]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setDbJobs(
            data.map((job) => ({
              ...job,
              id: job._id,
              postedAt: new Date(job.createdAt).toLocaleDateString("vi-VN"),
              tags: job.tags || [],
            })),
          );
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách công việc:", err);
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

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const matchesFilter =
        !selectedFilter ||
        job.tags?.some((t) => t.toLowerCase().includes(selectedFilter)) ||
        job.title.toLowerCase().includes(selectedFilter) ||
        job.company.toLowerCase().includes(selectedFilter);
      const matchesKeyword =
        !searchKeyword ||
        job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.company.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchesFilter && matchesKeyword;
    });
  }, [allJobs, selectedFilter, searchKeyword]);

  const [recommendedJobs, setRecommendedJobs] = useState([]);

  const handleRefreshRecommended = useCallback(() => {
    if (allJobs.length > 0) {
      const shuffled = shuffleArray(allJobs);
      setRecommendedJobs(shuffled.slice(0, 4));
    }
  }, [allJobs]);

  useEffect(() => {
    handleRefreshRecommended();
  }, [handleRefreshRecommended]);

  const latestTotalPages = Math.max(
    1,
    Math.ceil(allJobs.length / LATEST_PER_PAGE),
  );
  const latestJobs = useMemo(() => {
    const start = (latestPage - 1) * LATEST_PER_PAGE;
    return allJobs.slice(start, start + LATEST_PER_PAGE);
  }, [allJobs, latestPage]);

  const handleReset = () => {
    setSelectedFilter("");
    setSearchKeyword("");
    setLatestPage(1);
  };

  const handleSearchClick = () => {
    navigate("/AllJobs", { state: { searchKeyword } });
  };

  const handleQuickTag = (opt) => {
    setSelectedFilter(opt.value);
    setSearchKeyword(opt.value === "it" ? "IT" : opt.label);
    setLatestPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-gray-900 text-sm page-transition">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-[30px] lg:left-0">
            <StickyProfile />
          </div>

          <div className="flex-1 min-w-0 space-y-4">

            {/* Search Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-violet-50/50 to-transparent">
                <h1 className="text-lg font-semibold mb-0.5">
                  <span className="bg-gradient-to-r from-violet-700 to-purple-500 bg-clip-text text-transparent">
                    Tìm kiếm việc làm
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  Khám phá hàng ngàn cơ hội phù hợp với hồ sơ của bạn
                </p>
              </div>

              <div className="border-t border-gray-100/80" />

              <div className="px-4 py-3 flex flex-col sm:flex-row gap-2 items-stretch">
                <label className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setLatestPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchClick();
                      }
                    }}
                    placeholder="Tìm theo vị trí, công ty, ngành nghề..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 bg-white"
                  />
                </label>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 font-medium hover:bg-gray-50 cursor-pointer"
                  >
                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                    Lọc lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchClick}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-gray-400 mr-1">Phổ biến:</span>
                {filterOptions.slice(1).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleQuickTag(opt)}
                    className={`text-xs px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      selectedFilter === opt.value
                        ? "bg-violet-100 border-violet-200 text-violet-800 font-semibold shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-600 hover:bg-gray-50 font-medium"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gợi ý cho bạn */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 hover:z-20">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <SparklesIcon className="w-4 h-4 text-violet-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Gợi ý cho bạn
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshRecommended}
                  className="inline-flex items-center gap-1 text-xs text-violet-600 font-medium hover:underline cursor-pointer"
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  Làm mới
                </button>
              </div>

              <div className="border-t border-gray-100/80" />

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {isLoading ? (
                  <>
                    <JobSkeleton />
                    <JobSkeleton />
                  </>
                ) : (
                  recommendedJobs.map((job) => (
                    <Jobs key={`recommend-${job.id}`} job={job} />
                  ))
                )}
              </div>
            </div>

            {/* Tin mới nhất */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 hover:z-20">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <FireIcon className="w-4 h-4 text-orange-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Tin mới nhất
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/AllJobs")}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-violet-600 cursor-pointer"
                >
                  Xem tất cả
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>

              <div className="border-t border-gray-100/80" />

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {isLoading ? (
                  <>
                    <JobSkeleton />
                    <JobSkeleton />
                  </>
                ) : (
                  latestJobs.map((job) => (
                    <Jobs key={`latest-${job.id}-${latestPage}`} job={job} />
                  ))
                )}
              </div>

              {latestTotalPages > 1 && (
                <>
                  <div className="border-t border-gray-100/80" />
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Trang {latestPage} / {latestTotalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={latestPage <= 1}
                        onClick={() => setLatestPage((p) => Math.max(1, p - 1))}
                        className="w-7 h-7 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        disabled={latestPage >= latestTotalPages}
                        onClick={() =>
                          setLatestPage((p) =>
                            Math.min(latestTotalPages, p + 1),
                          )
                        }
                        className="w-7 h-7 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Danh sách việc làm */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 hover:z-20">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <BriefcaseIcon className="w-4 h-4 text-violet-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Danh sách việc làm
                  </h2>
                </div>

                <FilterDropdown
                  options={filterOptions}
                  value={selectedFilter}
                  onChange={(val) => {
                    setSelectedFilter(val);
                    setLatestPage(1);
                  }}
                />
              </div>

              <div className="border-t border-gray-100/80" />

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {isLoading ? (
                  <>
                    <JobSkeleton />
                    <JobSkeleton />
                  </>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs
                    .slice(0, 4)
                    .map((job, index) => (
                      <Jobs key={`preview-${job.id}-${index}`} job={job} />
                    ))
                ) : (
                  <div className="col-span-full py-10 text-center">
                    <BriefcaseIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Không tìm thấy công việc phù hợp
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Thay đổi tiêu chí lọc hoặc từ khóa tìm kiếm
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-3 text-xs font-medium text-violet-600 hover:underline cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>

              {!isLoading && filteredJobs.length > 0 && (
                <>
                  <div className="border-t border-gray-100/80" />
                  <div className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/AllJobs")}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"
                    >
                      Xem toàn bộ {filteredJobs.length} tin tuyển dụng
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
