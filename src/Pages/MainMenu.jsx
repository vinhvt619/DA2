import React, { useEffect, useMemo, useState } from "react";
import Jobs from "../Components/ListJob.jsx";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  SparklesIcon,
  FireIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { jobsData } from "../data/jobsData.js";
import { useLocation, useNavigate } from "react-router-dom";

const filterOptions = [
  { value: "", label: "Tất cả tiêu chí" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

const LATEST_PER_PAGE = 4;

function SectionCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-violet-200 bg-white p-5 shadow-md shadow-violet-200/30 transition-shadow hover:shadow-lg hover:shadow-violet-200/35 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="p-2 rounded-lg bg-violet-200 text-violet-800">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function MainMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(location.state?.searchKeyword || "");
  const [dbJobs, setDbJobs] = useState([]);
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

  const recommendedJobs = useMemo(() => allJobs.slice(0, 4), [allJobs]);

  const latestTotalPages = Math.max(1, Math.ceil(allJobs.length / LATEST_PER_PAGE));
  const latestJobs = useMemo(() => {
    const start = (latestPage - 1) * LATEST_PER_PAGE;
    return allJobs.slice(start, start + LATEST_PER_PAGE);
  }, [allJobs, latestPage]);

  const handleReset = () => {
    setSelectedFilter("");
    setSearchKeyword("");
    setLatestPage(1);
  };

  const handleQuickTag = (opt) => {
    setSelectedFilter(opt.value);
    setSearchKeyword(opt.value === "it" ? "IT" : opt.label);
    setLatestPage(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
            <StickyProfile />
          </div>

          <div className="flex-1 space-y-5 pb-12 min-w-0 w-full">
            {/* Hero + Search */}
            <SectionCard>
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-[11px] font-semibold mb-3">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Khám phá cơ hội
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">
                  Tìm kiếm công việc mơ ước
                </h1>
                <p className="text-xs text-gray-600">
                  Khám phá hàng ngàn cơ hội việc làm hấp dẫn và phù hợp với hồ sơ của bạn.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-2.5 items-stretch">
                <label className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setLatestPage(1);
                    }}
                    placeholder="Vị trí tuyển dụng, công việc, ngành nghề..."
                    className="block w-full pl-10 pr-4 py-2.5 bg-white border border-violet-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                  />
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-gray-700 bg-white hover:bg-violet-100 border border-violet-200 rounded-xl text-xs font-semibold transition-all"
                  >
                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                    Lọc lại
                  </button>
                  <button
                    type="button"
                    className="flex-1 md:flex-none bg-violet-800 hover:bg-violet-900 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-medium mr-1">
                  Tìm kiếm phổ biến:
                </span>
                {filterOptions.slice(1).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleQuickTag(opt)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      selectedFilter === opt.value
                        ? "bg-violet-200 border-violet-300 text-violet-900"
                        : "bg-violet-100 border-violet-200 text-violet-800 hover:bg-violet-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Gợi ý */}
            <SectionCard>
              <SectionHeader
                icon={SparklesIcon}
                title="Gợi ý cho bạn"
                subtitle="Phù hợp nhất với kỹ năng và học vấn của bạn"
                action={
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-violet-800 font-semibold transition-colors bg-white hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Làm mới
                  </button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedJobs.map((job) => (
                  <Jobs key={`recommend-${job.id}`} job={job} />
                ))}
              </div>
            </SectionCard>

            {/* Tin mới nhất */}
            <SectionCard>
              <SectionHeader
                icon={FireIcon}
                title="Tin tuyển dụng mới nhất"
                subtitle="Cập nhật liên tục mỗi giờ"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/AllJobs")}
                    className="flex items-center gap-1 text-[11px] text-violet-800 hover:text-violet-950 font-semibold transition-all bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg border border-violet-200"
                  >
                    Xem tất cả
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {latestJobs.map((job) => (
                  <Jobs key={`latest-${job.id}-${latestPage}`} job={job} />
                ))}
              </div>

              {latestTotalPages > 1 && (
                <div className="flex justify-between items-center border-t border-violet-100 pt-3">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Trang {latestPage} / {latestTotalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={latestPage <= 1}
                      onClick={() => setLatestPage((p) => Math.max(1, p - 1))}
                      className="w-8 h-8 rounded-lg border border-violet-200 bg-white flex items-center justify-center hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      disabled={latestPage >= latestTotalPages}
                      onClick={() => setLatestPage((p) => Math.min(latestTotalPages, p + 1))}
                      className="w-8 h-8 rounded-lg border border-violet-200 bg-white flex items-center justify-center hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Danh sách lọc */}
            <SectionCard>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-violet-200 text-violet-800">
                    <BriefcaseIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Danh sách việc làm</h2>
                    <p className="text-[11px] text-gray-500">Lọc theo ngành nghề bạn mong muốn</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-violet-200">
                  <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 text-violet-600" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => {
                      setSelectedFilter(e.target.value);
                      setLatestPage(1);
                    }}
                    className="text-[11px] font-semibold h-7 border-0 bg-transparent outline-none text-gray-700 pr-5 cursor-pointer focus:ring-0"
                  >
                    {filterOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs
                    .slice(0, 4)
                    .map((job, index) => (
                      <Jobs key={`preview-${job.id}-${index}`} job={job} />
                    ))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-violet-300 bg-violet-100 p-8 text-center">
                    <p className="font-semibold text-gray-800 text-xs">
                      Không tìm thấy công việc phù hợp
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Vui lòng thay đổi tiêu chí lọc hoặc từ khóa tìm kiếm
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-3 text-xs font-semibold text-violet-800 hover:text-violet-950 transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-center border-t border-violet-100 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/AllJobs")}
                  className="text-xs font-semibold text-white bg-violet-800 hover:bg-violet-900 border border-violet-800 px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Xem toàn bộ tin tuyển dụng ({filteredJobs.length} tin)
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
