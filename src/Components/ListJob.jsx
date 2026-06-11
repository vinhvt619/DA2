import React, { useState } from "react";
import {
  MapPinIcon,
  HeartIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

const tagColors = [
  "bg-violet-100 text-violet-700 border border-violet-200",
  "bg-sky-100 text-sky-700 border border-sky-200",
  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "bg-amber-100 text-amber-700 border border-amber-200",
  "bg-pink-100 text-pink-700 border border-pink-200",
  "bg-indigo-100 text-indigo-700 border border-indigo-200",
];

const typeColor = (type) => {
  if (!type) return "bg-slate-100 text-slate-600 border border-slate-200";
  const t = type.toLowerCase();
  if (t.includes("intern"))
    return "bg-amber-100 text-amber-700 border border-amber-200";
  if (t.includes("full"))
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (t.includes("part"))
    return "bg-sky-100 text-sky-700 border border-sky-200";
  return "bg-violet-100 text-violet-700 border border-violet-200";
};

const defaultJob = {
  id: "castus-it-de",
  title: "Dịch thuật văn bản IT sang tiếng Đức",
  company: "Castus Corporation",
  location: "Quận 1, HCM",
  type: "Full-time",
  salary: "12-18 triệu",
  postedAt: "1 ngày trước",
  tags: ["Full-time", "Hợp đồng", "Tại văn phòng"],
};

export default function Jobs({ job = defaultJob }) {
  const [showDetail, setShowDetail] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tooltipPos, setTooltipPos] = useState("bottom");
  const cardRef = React.useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 280) {
        setTooltipPos("top");
      } else {
        setTooltipPos("bottom");
      }
    }
    setShowDetail(true);
  };

  return (
    <div className={`relative ${showDetail ? "z-50" : "z-0"}`} ref={cardRef}>
      <div
        onClick={() => navigate(`/jobs/${job.id}`)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowDetail(false)}
        className={`group relative w-full cursor-pointer rounded-lg border text-left transition-all hover:border-[#9346F5]/40 hover:shadow-sm ${
          showDetail
            ? "border-[#9346F5]/40 shadow-sm bg-slate-50/50"
            : "border-slate-200 bg-white"
        }`}
        style={{ padding: "12px 14px" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 transition-colors group-hover:border-[#9346F5]/30 group-hover:bg-[#9346F5]/5">
            C
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="inline-block max-w-full rounded-md bg-slate-100 px-2.5 py-1 text-sm font-bold leading-5 text-slate-900 line-clamp-2 transition-colors group-hover:text-[#9346F5]">
              {job.title}
            </div>
            <div className="mt-0.5 text-xs text-gray-500 truncate">
              {job.company}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <MapPinIcon className="h-3 w-3 shrink-0" />
                {job.location}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeColor(job.type)}`}
              >
                {job.type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CurrencyDollarIcon className="h-3 w-3 shrink-0" />
                {job.salary}
              </span>
            </div>
            {job.tags?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {job.tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${tagColors[i % tagColors.length]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
          }}
          className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          {saved ? (
            <HeartSolid className="h-4 w-4 text-[#9346F5]" />
          ) : (
            <HeartIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
          )}
        </button>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-gray-400">
          <ClockIcon className="h-3 w-3" />
          {job.postedAt}
        </div>
      </div>

      {showDetail && (
        <div
          className={`pointer-events-none absolute w-full rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-xl shadow-slate-200/50 ${
            tooltipPos === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
              C
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">
                {job.company}
              </div>
              <div className="text-xs text-gray-500">{job.location}</div>
            </div>
          </div>

          <div className="mb-2 inline-block rounded-md bg-slate-100 px-2 py-1 font-bold text-slate-900">
            {job.title}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {[job.type, ...(job.tags ?? [])].map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-xs text-gray-500 leading-5 mb-3 bg-gray-50 rounded-lg p-2.5">
            {job.description}
          </p>

          <div className="rounded-md bg-[#9346F5]/10 px-3 py-2 text-[11px] font-bold text-[#9346F5]">
            Nhấn vào thẻ để xem chi tiết và nộp CV.
          </div>
        </div>
      )}
    </div>
  );
}
