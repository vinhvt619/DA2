import React, { useState } from "react";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const tabs = [
  { key: "t1", label: "Dùng nhiều nhất" },
  { key: "t2", label: "Xem nhiều nhất" },
  { key: "t3", label: "Mới nhất" },
  { key: "t4", label: "Phổ biến" },
];

const cvTemplates = [
  { rank: 1, name: "Thanh lịch & Hiện đại", uses: 2520, views: 18400 },
  { rank: 2, name: "Tối giản chuyên nghiệp", uses: 1980, views: 14200 },
  { rank: 3, name: "Sáng tạo & Nổi bật", uses: 1543, views: 11300 },
  { rank: 4, name: "Cổ điển kỹ sư", uses: 1320, views: 9800 },
  { rank: 5, name: "Marketing Pro", uses: 1100, views: 8200 },
  { rank: 6, name: "Đơn giản & Gọn", uses: 980, views: 7400 },
  { rank: 7, name: "Gradient Hiện đại", uses: 870, views: 6900 },
  { rank: 8, name: "IT & Dev", uses: 760, views: 5800 },
  { rank: 9, name: "Thiết kế UI/UX", uses: 680, views: 5100 },
  { rank: 10, name: "Tài chính & Kế toán", uses: 620, views: 4600 },
];

const getCvTag = (name) => {
  const n = name.toLowerCase();
  if (
    n.includes("thanh lịch") ||
    n.includes("sáng tạo") ||
    n.includes("gradient") ||
    n.includes("hiện đại") ||
    n.includes("thiết kế")
  ) {
    return { label: "Modern", bg: "bg-violet-50", text: "text-violet-600" };
  }
  if (
    n.includes("tối giản") ||
    n.includes("đơn giản") ||
    n.includes("cổ điển")
  ) {
    return { label: "Classic", bg: "bg-slate-100", text: "text-slate-600" };
  }
  return { label: "Professional", bg: "bg-blue-50", text: "text-blue-600" };
};

function CVRow({ cv }) {
  const navigate = useNavigate();
  const tag = getCvTag(cv.name);

  const rankStyle =
    cv.rank === 1
      ? "bg-amber-100 text-amber-700"
      : cv.rank === 2
      ? "bg-slate-100 text-slate-600"
      : cv.rank === 3
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div
      onClick={() => navigate("/ResumeSelection")}
      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg cursor-pointer group"
    >
      <div className="w-6 shrink-0 flex justify-center">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${rankStyle}`}>
          {cv.rank}
        </span>
      </div>

      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-violet-50/50 text-violet-500 flex items-center justify-center shrink-0">
        <DocumentTextIcon className="w-4.5 h-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-violet-600 flex items-center gap-2">
          <span>{cv.name}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tag.bg} ${tag.text}`}>
            {tag.label}
          </span>
        </div>
        <div className="text-[11px] text-gray-400">
          Đã dùng: {cv.uses.toLocaleString()} lượt · Lượt xem: {(cv.views / 1000).toFixed(1)}k
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 text-slate-400">
        <EyeIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold text-slate-600">
          {(cv.views / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
}

export default function TopCVList({ isSingleColumn = false }) {
  const [active, setActive] = useState("t1");
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={
                active === tab.key
                  ? "rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-white text-slate-800 shadow-sm transition-all duration-150 cursor-pointer"
                  : "rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors duration-150 cursor-pointer"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/ResumeSelection")}
          className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-violet-600 ml-1 cursor-pointer"
        >
          Xem tất cả
          <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>

      <div className="border-t border-gray-50" />

      <div className="px-4 pb-4">
        {isSingleColumn ? (
          <div>
            {cvTemplates.map((cv) => (
              <CVRow key={cv.rank} cv={cv} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              {cvTemplates.slice(0, 5).map((cv) => (
                <CVRow key={cv.rank} cv={cv} />
              ))}
            </div>
            <div>
              {cvTemplates.slice(5, 10).map((cv) => (
                <CVRow key={cv.rank} cv={cv} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
