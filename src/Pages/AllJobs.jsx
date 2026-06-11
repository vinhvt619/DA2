import { useState, useEffect } from "react";
import "../App.css";
import Jobs from "../Components/ListJob.jsx";
import Header from "../Components/Header.jsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { jobsData } from "../data/jobsData";
import { useNavigate } from "react-router-dom";

const filterOptions = [
  { value: "", label: "Tất cả tiêu chí" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

const JOBS_PER_PAGE = 8;

function AllJobs() {
  const [selectedFilter, setSelectedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dbJobs, setDbJobs] = useState([]);
  const navigate = useNavigate();

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
      }
    };
    fetchJobs();
  }, []);

  const allJobs = dbJobs.concat(jobsData);
  const totalPages = Math.ceil(allJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = allJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] via-[#F2EFFF] to-[#EDE4FA] flex flex-col font-sans antialiased text-slate-900">
      <Header />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-8 py-8 lg:py-10">
        <button
          onClick={() => navigate("/MainMenu")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#9346F5] transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại trang chủ
        </button>

        <div
          className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 sm:p-8"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Tất cả việc làm</h1>
              <p className="text-sm text-gray-500">Khám phá hàng ngàn cơ hội việc làm mới nhất.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => { setSelectedFilter(e.target.value); setCurrentPage(1); }}
                className="text-sm font-medium h-10 border border-slate-200 rounded-xl bg-slate-50 px-3 outline-none text-slate-700 focus:ring-2 focus:ring-[#9346F5]/20 focus:border-[#9346F5] transition-all"
              >
                {filterOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {paginatedJobs.map((job, index) => (
              <Jobs key={`page-${currentPage}-${job.id}-${index}`} job={job} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
            <span className="text-sm text-slate-500">
              Trang <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages}
              &nbsp;·&nbsp;
              <span className="font-bold text-slate-700">{allJobs.length}</span> tin tuyển dụng
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-[#9346F5] text-white shadow-md shadow-[#9346F5]/25"
                      : "border border-slate-200 text-slate-600 hover:border-[#9346F5]/40 hover:text-[#9346F5]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AllJobs;
