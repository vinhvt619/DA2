import React, { useState } from "react";
import "../App.css";
import Jobs from "../Components/ListJob.jsx";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const filters = [
  { value: "", label: "Tất cả lựa chọn" },
  { value: "it", label: "Công nghệ thông tin" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
  { value: "parttime", label: "Bán thời gian" },
];

function FindJobs() {
  const [selectedFilter, setSelectedFilter] = useState("");

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA]">
      <Header />
      <div className="flex items-start gap-8 px-8 pt-10">
        <StickyProfile />
        <main className="w-full pb-20">
          <div className="flex justify-center">
            <label className="flex h-10 w-[85%] items-center rounded-3xl border-2 border-black bg-white">
              <input
                placeholder="Vị trí tuyển dụng, công việc, ngành nghề..."
                className="ml-7 h-10 w-[75%] border-0 outline-0"
              />
              <div className="flex w-[25%] items-center justify-center gap-2 text-gray-400">
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>Search</span>
              </div>
            </label>
          </div>

          <section className="mt-10 flex justify-center">
            <div className="h-auto w-[85%] rounded-3xl border-2 border-black bg-white p-5">
              <div className="flex items-center font-semibold">
                Recommend for you
                <button className="ml-3 flex h-6 w-10 items-center justify-center rounded-xl hover:bg-gray-300">
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="ml-5 grid grid-cols-2 gap-3 p-3">
                {[...Array(8)].map((_, i) => (
                  <Jobs key={i} color="bg-[#F8F4FC]" />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 flex justify-center">
            <div className="w-[85%] rounded-2xl border-2 border-gray-300 p-5">
              <div className="flex place-content-between">
                <div className="text-lg font-semibold">Newest posts</div>
                <button className="flex text-sm text-gray-400">
                  Show all
                  <ArrowRightIcon className="ml-1 h-5 w-5" />
                </button>
              </div>
              <div className="ml-5 mt-5 grid grid-cols-2 gap-5 p-3">
                {[...Array(8)].map((_, i) => (
                  <Jobs key={i} color="bg-white" />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 flex justify-center">
            <div className="h-auto w-[85%] rounded-3xl border-2 border-black bg-white p-5">
              <div className="flex items-center">
                <Bars3Icon className="mr-3 h-5 w-5 text-gray-400" />
                <div className="text-gray-400">Lọc theo:</div>
                <select
                  value={selectedFilter}
                  onChange={(event) => setSelectedFilter(event.target.value)}
                  className="ml-5 h-12 w-70 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none"
                >
                  {filters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-5 mt-5 grid grid-cols-2 gap-5 p-3">
                {[...Array(8)].map((_, i) => (
                  <Jobs key={i} color="bg-[#F8F4FC]" />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default FindJobs;
