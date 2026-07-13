import { useState, useEffect, useMemo } from "react";
import "../App.css";
import Jobs from "../Components/ListJob.jsx";
import Header from "../Components/Header.jsx";
import FilterDropdown from "../Components/FilterDropdown.jsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { jobsData } from "../data/jobsData";
import { useNavigate, useLocation } from "react-router-dom";

const filterOptions = [
  { value: "", label: "Tất cả tiêu chí" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

const JOBS_PER_PAGE = 8;

function AllJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(
    location.state?.searchKeyword || "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [dbJobs, setDbJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          const mappedJobs = data.map((job) => ({
            ...job,
            id: job._id,
            postedAt: new Date(job.createdAt).toLocaleDateString("vi-VN"),
            tags: job.tags || [],
          }));
          setDbJobs(mappedJobs);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách công việc từ DB:", err);
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
        job.tags?.some((t) =>
          t.toLowerCase().includes(selectedFilter.toLowerCase()),
        ) ||
        job.title.toLowerCase().includes(selectedFilter.toLowerCase()) ||
        job.company.toLowerCase().includes(selectedFilter.toLowerCase());

      const matchesKeyword =
        !searchKeyword ||
        job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.company.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.tags?.some((t) =>
          t.toLowerCase().includes(searchKeyword.toLowerCase()),
        );

      return matchesFilter && matchesKeyword;
    });
  }, [allJobs, selectedFilter, searchKeyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / JOBS_PER_PAGE),
  );
  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(
      (currentPage - 1) * JOBS_PER_PAGE,
      currentPage * JOBS_PER_PAGE,
    );
  }, [filteredJobs, currentPage]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-gray-900 text-sm">
      <Header />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex-1 min-w-0 space-y-3">
          <button
            onClick={() => navigate("/MainMenu")}
            className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors mb-2 w-fit"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại trang chủ
          </button>

          <div className="bg-white border border-violet-200 rounded-lg shadow-md shadow-violet-200/30 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-0.5">
                  Tất cả việc làm
                </h1>
                <p className="text-xs text-gray-500">
                  Khám phá hàng ngàn cơ hội việc làm mới nhất.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm vị trí, công ty, ngành..."
                    className="w-full sm:w-60 pl-9 pr-3 py-1.5 border border-violet-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 bg-white"
                  />
                </div>

                <FilterDropdown
                  options={filterOptions}
                  value={selectedFilter}
                  onChange={(val) => {
                    setSelectedFilter(val);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <hr className="border-t border-violet-100 mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {isLoading ? (
                <div className="col-span-full py-8 text-center text-sm font-medium text-gray-500">
                  Đang tải danh sách công việc...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 text-[#9346F5] bg-violet-50 p-2.5 rounded-full mb-3 flex items-center justify-center border border-violet-100/50">
                    <BriefcaseIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">
                    Không tìm thấy tin tuyển dụng
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để khám phá các cơ
                    hội khác.
                  </p>
                </div>
              ) : (
                paginatedJobs.map((job, index) => (
                  <Jobs
                    key={`page-${currentPage}-${job.id}-${index}`}
                    job={job}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && filteredJobs.length > 0 && (
              <div className="flex items-center justify-between border-t border-violet-100 pt-4 mt-2">
                <span className="text-xs text-gray-500">
                  Trang{" "}
                  <span className="font-semibold text-gray-700">
                    {currentPage}
                  </span>{" "}
                  / {totalPages}
                  &nbsp;·&nbsp;
                  <span className="font-semibold text-gray-700">
                    {filteredJobs.length}
                  </span>{" "}
                  công việc
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-violet-600" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                            currentPage === page
                              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                              : "border border-violet-200 text-violet-700 hover:bg-violet-100 bg-white"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-violet-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllJobs;
