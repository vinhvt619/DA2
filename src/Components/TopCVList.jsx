import React, { useState } from "react";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  EyeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { RESUME_TEMPLATES } from "../../shared/resumeTemplates.js";

const tabs = ["Dùng nhiều", "Xem nhiều", "Mới nhất"];

const cvTemplates = [
  { id: "professional", rank: 1, uses: "23,1k", views: "58,7k" },
  { id: "modern", rank: 2, uses: "18,6k", views: "46,2k" },
  { id: "creative", rank: 3, uses: "15,4k", views: "38,1k" },
  { id: "editorial", rank: 4, uses: "12,7k", views: "31,6k" },
  { id: "technology", rank: 5, uses: "11,2k", views: "27,8k" },
  { id: "classic", rank: 6, uses: "9,8k", views: "22,4k" },
].map((stats) => ({ ...RESUME_TEMPLATES.find((template) => template.id === stats.id), ...stats }));

function ResumePreview({ template }) {
  return (
    <div className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm`}>
      <div className={`absolute inset-y-0 left-0 w-[28%] ${template.accent}`} />
      <div className="absolute left-[7px] top-2 h-3.5 w-3.5 rounded-full border border-white/60 bg-white/80" />
      <div className="absolute left-[30%] right-1.5 top-2 space-y-1">
        <div className={`h-1.5 w-3/4 rounded ${template.accent}`} />
        <div className="h-1 w-1/2 rounded bg-slate-200" />
        <div className="mt-2 h-1 w-full rounded bg-slate-300" />
        <div className="h-1 w-4/5 rounded bg-slate-200" />
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="mt-2 h-1 w-2/3 rounded bg-slate-300" />
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="h-1 w-3/4 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function CVCard({ template, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group relative flex min-w-0 gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-2.5 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <span className="absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-sm">{template.rank}</span>
      <ResumePreview template={template} />
      <div className="min-w-0 self-center">
        <h3 className="break-words text-xs font-semibold leading-5 text-slate-800 group-hover:text-violet-700">{template.name}</h3>
        <div className="mt-2 space-y-1 text-[9px] text-slate-400">
          <div className="flex items-center gap-1"><UserGroupIcon className="h-3 w-3" />{template.uses} lượt dùng</div>
          <div className="flex items-center gap-1"><EyeIcon className="h-3 w-3" />{template.views} lượt xem</div>
        </div>
      </div>
    </button>
  );
}

export default function TopCVList() {
  const [activeTab, setActiveTab] = useState("Dùng nhiều");
  const navigate = useNavigate();

  return (
    <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_28px_rgba(74,58,110,0.07)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><DocumentTextIcon className="h-4 w-4" /></span>
          <h2 className="text-sm font-semibold text-slate-800">Mẫu CV được yêu thích</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-md px-2 py-1 text-[9px] font-medium transition ${activeTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>)}
          </div>
          <button type="button" onClick={() => navigate("/ResumeSelection")} className="hidden items-center gap-1 text-[10px] font-medium text-violet-600 hover:text-violet-700 sm:flex">Xem tất cả <ArrowRightIcon className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {cvTemplates.map((template) => <CVCard key={template.rank} template={template} onClick={() => navigate("/ResumeSelection")} />)}
      </div>
    </section>
  );
}
