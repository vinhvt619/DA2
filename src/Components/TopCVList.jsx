import React, { useState } from "react";
import { Button } from "flowbite-react";

const ListCV = React.memo(({ rank }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-2.5 mt-4 w-80 text-sm cursor-pointer hover:bg-[#FEEFFB] group transition-all">
      <div className="flex items-center space-x-3">
        <div className="text-sm pl-4 w-12 text-gray-400 font-bold">{rank}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-gray-800 group-hover:text-[#9346F5] transition-colors truncate">
            Thanh lịch & Hiện đại
          </div>
          <div className="flex items-center gap-2 mt-0.5">
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
    <div className="w-full bg-[#F5F1FB] border-2 border-gray-300 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg text-gray-900 tracking-tight pl-3">
          Những mẫu CV chuyên nghiệp nhất
        </div>
        <button className="text-[11px] font-bold text-[#9346F5] hover:underline uppercase tracking-widest px-2">
          Xem tất cả mẫu CV &rarr;
        </button>
      </div>
      <div className="pl-13 pt-2 pb-5">
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            color="light"
            size="xs"
            className={`pill mr-2 shadow-sm transition-all ${
              active === "t1"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t1")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Dùng nhiều nhất
            </span>
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill mr-2 shadow-sm transition-all ${
              active === "t2"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t2")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Xem nhiều nhất
            </span>
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill mr-2 shadow-sm transition-all ${
              active === "t3"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t3")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Mới nhất
            </span>
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill shadow-sm transition-all ${
              active === "t4"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t4")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Phổ biến
            </span>
          </Button>
        </div>
        <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-1">
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
          ].map((rank) => (
            <ListCV key={rank} rank={rank} />
          ))}
        </div>
      </div>
    </div>
  );
}
