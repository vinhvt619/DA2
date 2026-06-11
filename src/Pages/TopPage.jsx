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
      <div className="flex-1 max-w-360 mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex items-start gap-8">
        
        {/* <div className="hidden lg:block sticky top-24 z-10 2xl:w-64">
           <StickySettings />
        </div> */}

        <div className="flex-1 flex flex-col gap-12 max-w-5xl mx-auto w-full pb-20">
          
          <div className="flex flex-col items-center justify-center text-center space-y-4 mb-2">
             <h1 className="text-4xl font-extrabold text-[#9346F5] drop-shadow-sm">
                Nổi bật hôm nay
             </h1>
             <p className="text-gray-600 text-lg max-w-2xl">
                Khám phá các công ty hàng đầu, những hồ sơ chuyên nghiệp và tin tức mới nhất về tuyển dụng.
             </p>
          </div>

          <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-6 lg:p-8">
            <TopCompany />
          </div>
          
          <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-6 lg:p-8">
            <TopCVList />
          </div>
          
          <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-6 lg:p-8">
            <ListNews />
          </div>

        </div>
      </div>
    </div>
  );
}

export default TopPage;
