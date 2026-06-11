import React, { useState } from "react";
import { DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const tabs = [
  { key: "t1", label: "Dùng nhiều nhất" },
  { key: "t2", label: "Xem nhiều nhất" },
  { key: "t3", label: "Mới nhất" },
  { key: "t4", label: "Phổ biến" },
];

const cvTemplates = [
  { rank: 1, name: "Thanh lịch & Hiện đại", uses: 2520, views: 18400, template: "modern" },
  { rank: 2, name: "Tối giản chuyên nghiệp", uses: 1980, views: 14200, template: "classic" },
  { rank: 3, name: "Sáng tạo & Nổi bật", uses: 1543, views: 11300, template: "modern" },
  { rank: 4, name: "Cổ điển kỹ sư", uses: 1320, views: 9800, template: "classic" },
  { rank: 5, name: "Marketing Pro", uses: 1100, views: 8200, template: "modern" },
  { rank: 6, name: "Đơn giản & Gọn", uses: 980, views: 7400, template: "classic" },
  { rank: 7, name: "Gradient Hiện đại", uses: 870, views: 6900, template: "modern" },
  { rank: 8, name: "IT & Dev", uses: 760, views: 5800, template: "classic" },
  { rank: 9, name: "Thiết kế UI/UX", uses: 680, views: 5100, template: "modern" },
  { rank: 10, name: "Tài chính & Kế toán", uses: 620, views: 4600, template: "classic" },
];

const rankColors = [
  "text-yellow-500 font-black",
  "text-slate-400 font-black",
  "text-amber-600 font-black",
];

function CVRow({ cv }) {
  const navigate = useNavigate();
  const rankClass = rankColors[cv.rank - 1] || "text-gray-400 font-bold";
  return (
    <div
      onClick={() => navigate("/ResumeSelection")}
      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition-colors group cursor-pointer"
    >
      <span className={`w-7 text-sm text-right shrink-0 ${rankClass}`}>
        {cv.rank}
      </span>
      <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 group-hover:border-[#9346F5]/40 transition-colors">
        <DocumentTextIcon className="w-4 h-4 text-violet-400 group-hover:text-[#9346F5] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate group-hover:text-[#9346F5] transition-colors">
          {cv.name}
        </div>
        <div className="text-[11px] text-gray-400 font-medium">
          {cv.uses.toLocaleString()} lượt dùng
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 text-gray-400">
        <EyeIcon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">{(cv.views / 1000).toFixed(1)}k</span>
      </div>
    </div>
  );
}

export default function TopCVList() {
  const [active, setActive] = useState("t1");
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-extrabold text-gray-900">
          Mẫu CV chuyên nghiệp nhất
        </h2>
        <button
          onClick={() => navigate("/ResumeSelection")}
          className="text-[11px] font-bold text-[#9346F5] hover:text-[#7e34d6] transition-colors"
        >
          Xem tất cả →
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
              active === tab.key
                ? "bg-[#9346F5] text-white shadow-sm shadow-[#9346F5]/20"
                : "bg-white text-gray-500 hover:text-[#9346F5] border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>{cvTemplates.slice(0, 5).map((cv) => <CVRow key={cv.rank} cv={cv} />)}</div>
        <div>{cvTemplates.slice(5, 10).map((cv) => <CVRow key={cv.rank} cv={cv} />)}</div>
      </div>
    </div>
  );
}
