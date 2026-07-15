import React, { useState, useRef } from "react";
import {
  MapPinIcon,
  HeartIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useSavedJobs } from "../context/SavedJobsContext";

const getTagStyle = (tag) => {
  const t = tag.toLowerCase();
  if (
    [
      "react",
      "node",
      "python",
      "java",
      "typescript",
      "next.js",
      "javascript",
      "vue",
      "angular",
      "docker",
      "aws",
      "figma",
      "ui/ux",
      "devops",
      "sql",
      "mongodb",
      "redis",
      "graphql",
      "nestjs",
      "express",
      "git",
      "css",
      "html",
      "tailwind",
      "sass",
      "webpack",
      "vite",
      "flutter",
      "swift",
      "kotlin",
      "go",
      "rust",
      "c++",
      "c#",
      ".net",
      "php",
      "laravel",
      "django",
      "flask",
      "spring",
    ].some((s) => t.includes(s))
  )
    return "bg-indigo-50 text-indigo-700 border border-indigo-200/60";
  if (
    ["senior", "junior", "lead", "intern", "fresher", "manager", "trưởng nhóm", "thực tập"].some(
      (s) => t.includes(s),
    )
  )
    return "bg-amber-50 text-amber-700 border border-amber-200/60";
  if (
    [
      "remote",
      "hybrid",
      "onsite",
      "tại văn phòng",
      "từ xa",
      "linh hoạt",
      "work from home",
    ].some((s) => t.includes(s))
  )
    return "bg-sky-50 text-sky-700 border border-sky-200/60";
  return "bg-slate-50 text-slate-600 border border-slate-200/60";
};

const getTypeBg = (type) => {
  if (!type) return "bg-slate-100 text-slate-600 border border-slate-200";
  const t = type.toLowerCase();
  if (t.includes("intern"))
    return "bg-amber-100 text-amber-700 border border-amber-200";
  if (t.includes("full"))
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (t.includes("part"))
    return "bg-sky-100 text-sky-700 border border-sky-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
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

export default function Jobs({ job = defaultJob, featured = false }) {
  const [hovered, setHovered] = useState(false);
  const { isSaved, toggleSave, pendingIds } = useSavedJobs();
  const [pos, setPos] = useState("bottom");
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const saved = isSaved(job.id);
  const isPending = pendingIds.has(job.id);

  const onEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPos(window.innerHeight - rect.bottom < 120 ? "top" : "bottom");
    }
    setHovered(true);
  };

  return (
    <div
      className={`relative h-full ${hovered ? "z-50" : "z-0"}`}
      ref={cardRef}
    >
      <div
        onClick={() => navigate(`/jobs/${job.id}`)}
        onMouseEnter={onEnter}
        onMouseLeave={() => setHovered(false)}
        className={`group relative w-full h-full flex flex-col cursor-pointer rounded-lg border text-left transition-all duration-200 ${
          featured
            ? `border-l-[3px] border-l-slate-500 border-t border-r border-b border-gray-200/60 ${hovered ? "bg-slate-50 shadow-card-hover" : "bg-slate-50/70 shadow-card"}`
            : hovered
              ? "border-slate-400 shadow-card-hover bg-slate-50/60"
              : "border-slate-200 bg-white shadow-card"
        }`}
        style={{ padding: "12px 14px" }}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 transition-colors group-hover:border-slate-300 group-hover:bg-slate-100">
            {job.company?.[0]?.toUpperCase() || "C"}
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-[15px] font-bold leading-snug text-gray-900 line-clamp-2 transition-colors group-hover:text-slate-700">
              {job.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-400 truncate font-normal">
              {job.company}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 max-w-full">
                <MapPinIcon className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[150px]">
                  {job.location}
                </span>
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getTypeBg(job.type)}`}
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
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${getTagStyle(tag)}`}
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
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(job.id);
          }}
          className={`absolute right-3 top-3 p-1 rounded transition-colors ${
            isPending
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-100 cursor-pointer"
          }`}
        >
          {saved ? (
            <HeartSolid className="h-4 w-4 text-slate-600" />
          ) : (
            <HeartIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
          )}
        </button>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-gray-400">
          <ClockIcon className="h-3 w-3" />
          {job.postedAt}
        </div>
      </div>

      {/* Compact hover popover with transition */}
      <div
        className={`pointer-events-none absolute left-0 right-0 rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-sm px-3.5 py-3 z-[100] shadow-popover transition-all duration-200 ${
          hovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-1"
        } ${pos === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
            {job.company?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-xs truncate">
              {job.company}
            </div>
            <div className="text-[10px] text-gray-400">{job.location}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {[job.type, ...(job.tags ?? []).slice(0, 3)]
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getTagStyle(tag)}`}
              >
                {tag}
              </span>
            ))}
        </div>
        <div className="text-[10px] text-gray-400 font-medium">
          Nhấn để xem chi tiết →
        </div>
      </div>
    </div>
  );
}
