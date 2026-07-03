import React from "react";
import Header from "../Components/Header.jsx";
import { TrophyIcon } from "@heroicons/react/24/outline";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";

function TopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-gray-900 text-sm page-transition">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-20 flex flex-col gap-6">
        <div className="text-center max-w-xl mx-auto mb-2">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-600 px-3 py-1 text-[11px] font-semibold mb-4">
            <TrophyIcon className="w-3.5 h-3.5 text-slate-500" />
            Bảng xếp hạng tuần
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Nổi bật hôm nay
          </h1>

          <p className="text-slate-500 text-sm leading-relaxed mx-auto max-w-md">
            Các công ty hàng đầu, mẫu CV chuyên nghiệp và tin tức mới nhất
            về thị trường tuyển dụng.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TopCompany />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TopCVList isSingleColumn={false} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ListNews />
        </div>
      </div>
    </div>
  );
}

export default TopPage;
