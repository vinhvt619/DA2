import React, { useState } from "react";

function NewsItem() {
  return (
    <div className="w-[95%] pt-4 group cursor-pointer transition-all pl-3">
      <div className="border border-gray-200 bg-gray-100 rounded-xl mb-3 group-hover:bg-gray-200 py-10 transition-colors flex items-center justify-center">
        <div className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center opacity-20 "></div>
      </div>
      <div className="px-0.5">
        <h3 className="text-[14px] font-bold text-gray-800 group-hover:text-[#9346F5] transition-colors line-clamp-2 leading-snug">
          Hướng dẫn viết CV dành cho người mới ứng tuyển 2024
        </h3>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 block">
          07/05/2026
        </span>
        <p className="line-clamp-2 text-[11px] text-gray-500 mt-2.5 font-medium leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </div>
  );
}

export default function ListNews() {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg text-gray-900 pl-3">
          Tin tức & Bài viết
        </div>
        <button className="text-[10px] font-bold text-[#9346F5] hover:underline uppercase tracking-widest">
          Xem tất cả bài viết &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <NewsItem key={i} />
        ))}
      </div>
    </div>
  );
}
