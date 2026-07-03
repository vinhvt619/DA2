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

function CVRow({ cv }) {
  const navigate = useNavigate();

  const rankStyle = cv.rank <= 3
    ? cv.rank === 1
      ? "bg-amber-500 text-white"
      : cv.rank === 2
        ? "bg-slate-400 text-white"
        : "bg-amber-700 text-white"
    : "text-slate-400 bg-slate-50 border border-slate-100";

  return (
    <div
      onClick={() => navigate("/ResumeSelection")}
      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg cursor-pointer group"
    >
      <div className="w-6 shrink-0 flex justify-center">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankStyle}`}>
          {cv.rank}
        </span>
      </div>

      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-violet-50/50 text-violet-500 flex items-center justify-center shrink-0">
        <DocumentTextIcon className="w-4.5 h-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-violet-600">
          {cv.name}
        </div>
        <div className="text-[11px] text-slate-400">
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
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-violet-500 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900">
            Mẫu CV được yêu thích
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  active === tab.key
                    ? "bg-violet-600 text-white"
                    : "text-gray-500 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/ResumeSelection")}
            className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-violet-600 ml-1"
          >
            Xem tất cả
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-50" />

      <div className="px-4 py-2">
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
