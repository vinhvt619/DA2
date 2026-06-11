import React, { useState } from "react";
import "../App.css";
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
import { jobsData } from "../data/jobsData";
import { useNavigate } from "react-router-dom";

const filterOptions = [
  { value: "", label: "Tất cả tiêu chí" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

function MainMenu() {
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();

  const allJobs = jobsData.concat(jobsData);

  // Filter jobs based on selected filter and search keyword
  const filteredJobs = allJobs.filter((job) => {
    const matchesFilter =
      !selectedFilter ||
      job.tags?.some((t) => t.toLowerCase().includes(selectedFilter)) ||
      job.title.toLowerCase().includes(selectedFilter) ||
      job.company.toLowerCase().includes(selectedFilter);
    const matchesKeyword =
      !searchKeyword ||
      job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.company.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.location.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesFilter && matchesKeyword;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Sidebar */}
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
            <StickyProfile />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-5 pb-12 min-w-0 w-full">
            {/* Search Box */}
            <div
              className="relative bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 transition-all duration-300 hover:shadow-md"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-violet-100/80 border border-violet-200/50 text-[#9346F5] px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
                    <SparklesIcon className="w-3 h-3" />
                    Khám Phá Cơ Hội
                  </div>
                  <h1 className="text-xl font-extrabold bg-linear-to-r from-[#9346F5] to-violet-850 bg-clip-text text-transparent mt-2 mb-0.5">
                    Tìm kiếm công việc mơ ước
                  </h1>
                  <p className="text-xs text-gray-500">
                    Khám phá hàng ngàn cơ hội việc làm hấp dẫn và phù hợp với hồ
                    sơ của bạn.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2.5 items-stretch">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Vị trí tuyển dụng, công việc, ngành nghề..."
                    className="block w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#9346F5]/10 focus:border-[#9346F5] transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedFilter("");
                      setSearchKeyword("");
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-gray-600 bg-white/80 hover:bg-violet-50/50 border border-slate-200 rounded-xl text-xs font-semibold transition-all hover:text-[#9346F5]"
                  >
                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                    Lọc lại
                  </button>
                  <button className="flex-1 md:flex-none bg-linear-to-r from-[#9346F5] to-[#7A34D8] hover:from-[#7A34D8] hover:to-[#6023C3] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-[#9346F5]/25 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    Tìm kiếm
                  </button>
                </div>
              </div>

              {/* Quick Tags */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium mr-1">
                  Tìm kiếm phổ biến:
                </span>
                {filterOptions.slice(1).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedFilter(opt.value);
                      setSearchKeyword(opt.value === "it" ? "IT" : opt.label);
                    }}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-violet-50/60 hover:bg-violet-100/85 border border-violet-100 text-violet-750 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="relative z-10 hover:z-50 bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 transition-all duration-300 hover:shadow-md"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-violet-100 text-[#9346F5]">
                    <SparklesIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Gợi ý cho bạn
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Phù hợp nhất với kỹ năng và học vấn của bạn
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#9346F5] font-semibold transition-colors bg-white/60 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200/50 shadow-xs">
                  <ArrowPathIcon className="w-3 h-3" />
                  Làm mới
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobsData.slice(0, 4).map((job) => (
                  <Jobs key={`recommend-${job.id}`} job={job} />
                ))}
              </div>
            </div>

            <div
              className="relative z-10 hover:z-50 bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 transition-all duration-300 hover:shadow-md"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                    <FireIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Tin tuyển dụng mới nhất
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Cập nhật liên tục mỗi giờ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/AllJobs")}
                  className="flex items-center gap-1 text-[11px] text-[#9346F5] hover:text-[#7e34d6] font-bold transition-all bg-violet-55/60 hover:bg-violet-100/80 px-3 py-1.5 rounded-lg border border-violet-100 shadow-xs"
                >
                  Xem tất cả
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {jobsData.map((job) => (
                  <Jobs key={`latest-${job.id}`} job={job} />
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-[11px] text-gray-400 font-medium">
                  Trang 1 / 5
                </span>
                <div className="flex gap-1.5">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-violet-50 hover:border-violet-200 transition-colors shadow-xs">
                    <ChevronLeftIcon className="w-3.5 h-3.5" text-gray-500 />
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-violet-50 hover:border-violet-200 transition-colors shadow-xs">
                    <ChevronRightIcon className="w-3.5 h-3.5" text-gray-500 />
                  </button>
                </div>
              </div>
            </div>

            {/* Tất cả việc làm */}
            <div
              className="relative z-10 hover:z-50 bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 transition-all duration-300 hover:shadow-md"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                    <BriefcaseIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Danh sách việc làm
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Lọc theo ngành nghề bạn mong muốn
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                  <AdjustmentsHorizontalIcon
                    className="w-3.5 h-3.5"
                    text-gray-400
                  />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="text-[11px] font-semibold h-7 border-0 bg-transparent outline-none text-slate-700 pr-5 cursor-pointer focus:ring-0"
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
                  <div className="col-span-full rounded-xl border border-dashed border-violet-200 bg-violet-50/10 p-8 text-center">
                    <p className="font-semibold text-gray-800 text-xs">
                      Không tìm thấy công việc phù hợp
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Vui lòng thay đổi tiêu chí lọc hoặc từ khóa tìm kiếm
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center border-t border-slate-100 pt-4">
                <button
                  onClick={() => navigate("/AllJobs")}
                  className="text-xs font-bold text-[#9346F5] hover:text-white border border-violet-200 hover:border-[#9346F5] bg-violet-50/20 hover:bg-[#9346F5] shadow-xs px-6 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Xem toàn bộ tin tuyển dụng ({filteredJobs.length} tin)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
