import React, { useState } from "react";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mr-2 rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-wider ${
        active
          ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
          : "bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

const ListCV = React.memo(({ rank }) => {
  return (
    <div className="mt-4 w-80 cursor-pointer rounded-2xl border-2 border-gray-600 bg-white p-2.5 text-sm hover:bg-[#FEEFFB]">
      <div className="flex items-center space-x-3">
        <div className="w-12 pl-4 text-sm font-bold text-gray-600">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-gray-900">
            Thanh lịch & Hiện đại
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400">
              Đã dùng:
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              2,520 lượt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function TopCVList() {
  const [active, setActive] = useState("t1");

  return (
    <div className="w-full rounded-3xl border-2 border-gray-300 bg-[#F5F1FB] p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="pl-3 text-lg font-bold tracking-tight text-gray-900">
          Những mẫu CV chuyên nghiệp nhất
        </div>
        <button className="px-2 text-[11px] font-bold uppercase tracking-widest text-[#9346F5] hover:underline">
          Xem tất cả mẫu CV &rarr;
        </button>
      </div>
      <div className="pl-13 pb-5 pt-2">
        <div className="mt-3 flex flex-wrap gap-2">
          <TabButton active={active === "t1"} onClick={() => setActive("t1")}>
            Dùng nhiều nhất
          </TabButton>
          <TabButton active={active === "t2"} onClick={() => setActive("t2")}>
            Xem nhiều nhất
          </TabButton>
          <TabButton active={active === "t3"} onClick={() => setActive("t3")}>
            Mới nhất
          </TabButton>
          <TabButton active={active === "t4"} onClick={() => setActive("t4")}>
            Phổ biến
          </TabButton>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3">
          {[
            "1st",
            "2nd",
            "3rd",
            "4th",
            "5th",
            "6th",
            "7th",
            "8th",
            "9th",
            "10th",
          ].map((item) => (
            <ListCV key={item} rank={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
