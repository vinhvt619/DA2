import React, { useState } from "react";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mr-3 rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-wider ${
        active
          ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
          : "bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

const ListCompany = React.memo(({ rank }) => {
  return (
    <div className="mt-4 w-120 rounded-2xl border-2 border-black bg-white p-2.5">
      <div className="flex items-center space-x-3">
        <div className="w-12 pl-4 text-sm font-black text-gray-500">{rank}</div>
        <div className="ml-2.5 mr-4 h-10 w-10 shrink-0 rounded-full border border-black bg-gray-300" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-gray-800">
            Công ty TNHH Sorimachi VN
          </div>
          <div className="mt-0.5 flex items-center space-x-2 text-[11px]">
            <div className="font-semibold text-gray-500">Review</div>
            <div className="font-bold text-yellow-500">★★★★★</div>
            <div className="font-bold text-gray-600">4.8</div>
            <div className="font-semibold text-gray-400">(2520 đánh giá)</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function TopCompany() {
  const [active, setActive] = useState("t1");

  return (
    <div className="w-full rounded-3xl border border-gray-300 bg-[#E8DEF5] p-5 shadow-sm">
      <div className="pl-3 text-lg font-bold tracking-tight text-gray-900">
        Top Công ty / Doanh nghiệp tiêu biểu
      </div>
      <div className="pl-13 pb-5 pt-2">
        <div className="mt-3 flex">
          <TabButton active={active === "t1"} onClick={() => setActive("t1")}>
            Theo lượt đánh giá
          </TabButton>
          <TabButton active={active === "t2"} onClick={() => setActive("t2")}>
            Theo số lượng sử dụng
          </TabButton>
          <TabButton active={active === "t3"} onClick={() => setActive("t3")}>
            Mới được cập nhật
          </TabButton>
        </div>

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
          <ListCompany key={item} rank={item} />
        ))}
      </div>
    </div>
  );
}
