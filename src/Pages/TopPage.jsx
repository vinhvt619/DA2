import React from "react";
import Header from "../Components/Header.jsx";
import { TrophyIcon, BuildingOffice2Icon, DocumentTextIcon, NewspaperIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import TopCompany from "../Components/TopCompany.jsx";
import { Link } from "react-router-dom";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";

function TopPage() {
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-gray-900 text-sm page-transition">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-20 flex flex-col gap-5">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50/50 border border-violet-200/60 text-violet-750 px-3.5 py-1.5 text-xs font-bold mb-4 shadow-sm">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <TrophyIcon className="w-4 h-4 text-amber-500 mr-1.5 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.2)]" />
            Bảng xếp hạng tuần
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-700 to-purple-500 bg-clip-text text-transparent">
              Nổi bật hôm nay
            </span>
          </h1>

          <div className="text-xs font-semibold text-violet-600/70 mb-4 capitalize">
            Cập nhật mỗi tuần · {currentDate}
          </div>

          <p className="text-slate-500 text-sm leading-relaxed mx-auto max-w-lg">
            Các công ty hàng đầu, mẫu CV chuyên nghiệp và tin tức mới nhất về
            thị trường tuyển dụng.
          </p>

          <div className="flex gap-2 flex-wrap justify-center mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 border border-white/85 shadow-sm">
              🏢 Top công ty
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 border border-white/85 shadow-sm">
              📄 Mẫu CV nổi bật
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 border border-white/85 shadow-sm">
              📰 Tin tức mới
            </span>
          </div>
        </div>

        {/* Top Company Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3 bg-white/60">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <BuildingOffice2Icon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 leading-tight">Công ty nổi bật</h2>
              <p className="text-xs text-slate-400 mt-0.5">Nhà tuyển dụng được ứng viên tin tưởng nhất tuần này</p>
            </div>
          </div>
          <TopCompany />
        </div>

        {/* Top CV Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3 bg-white/60">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <DocumentTextIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 leading-tight">Mẫu CV được yêu thích</h2>
              <p className="text-xs text-slate-400 mt-0.5">Thiết kế chuyên nghiệp, sẵn sàng để ứng tuyển</p>
            </div>
          </div>
          <TopCVList isSingleColumn={false} />
        </div>

        {/* News Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between bg-white/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <NewspaperIcon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800 leading-tight">Tin tức tuyển dụng</h2>
                <p className="text-xs text-slate-400 mt-0.5">Cập nhật thị trường lao động mới nhất</p>
              </div>
            </div>
            <Link
              to="/News"
              className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <ListNews />
        </div>
      </div>
    </div>
  );
}

export default TopPage;
