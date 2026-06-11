import React from "react";
import Header from "../Components/Header.jsx";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";
import StickySettings from "../Components/StickySettings.jsx";

function TopPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex items-start gap-8">
        {/* Sticky sidebar bên trái */}
        {/* <div className="hidden xl:block sticky top-6 shrink-0 w-64">
          <StickySettings />
        </div> */}

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full pb-20">
          {/* Hero header */}
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-4">
              ✦ Bảng xếp hạng
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
              Nổi bật hôm nay
            </h1>
            <p className="text-gray-500 text-base max-w-xl leading-relaxed">
              Khám phá các công ty hàng đầu, những mẫu CV chuyên nghiệp nhất và tin tức mới nhất về tuyển dụng.
            </p>
          </div>

          {/* Top Company */}
          <div
            className="w-full bg-white rounded-3xl shadow-md shadow-violet-200/30 border border-violet-200 p-6 lg:p-8"
          >
            <TopCompany />
          </div>

          {/* Top CV */}
          <div
            className="w-full bg-white rounded-3xl shadow-md shadow-violet-200/30 border border-violet-200 p-6 lg:p-8"
          >
            <TopCVList />
          </div>

          {/* News */}
          <div
            className="w-full bg-white rounded-3xl shadow-md shadow-violet-200/30 border border-violet-200 p-6 lg:p-8"
          >
            <ListNews />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopPage;
