import React, { useState } from "react";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon, StarIcon as StarSolid } from "@heroicons/react/24/solid";

const tabs = ["Tất cả", "Công nghệ", "Tài chính", "Thương mại", "Khác"];

const companies = [
  { rank: 1, name: "VNG Corporation", mark: "VNG", rating: 4.8, reviews: "12,4k", industry: "Công nghệ", location: "TP. Hồ Chí Minh", color: "bg-orange-500 text-white" },
  { rank: 2, name: "FPT Software", mark: "FPT", rating: 4.7, reviews: "10,8k", industry: "Công nghệ", location: "Hà Nội", color: "bg-sky-600 text-white" },
  { rank: 3, name: "Tiki", mark: "TIKI", rating: 4.6, reviews: "8,9k", industry: "Thương mại điện tử", location: "TP. Hồ Chí Minh", color: "bg-blue-600 text-white" },
  { rank: 4, name: "MoMo", mark: "mo", rating: 4.6, reviews: "7,6k", industry: "Tài chính", location: "TP. Hồ Chí Minh", color: "bg-pink-600 text-white" },
  { rank: 5, name: "Shopee", mark: "S", rating: 4.5, reviews: "7,1k", industry: "Thương mại điện tử", location: "TP. Hồ Chí Minh", color: "bg-orange-600 text-white" },
];

const rankStyle = {
  1: "border-amber-300 bg-amber-400 text-white",
  2: "border-slate-300 bg-slate-300 text-slate-700",
  3: "border-orange-300 bg-orange-400 text-white",
};

function BrandMark({ company, large = false }) {
  return (
    <div className={`${large ? "h-14 w-14 text-sm" : "h-9 w-9 text-[11px]"} ${company.color} flex shrink-0 items-center justify-center rounded-xl border border-white/50 font-extrabold shadow-sm`}>
      {company.mark}
    </div>
  );
}

function RankBadge({ rank }) {
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold shadow-sm ${rankStyle[rank] || "border-slate-200 bg-slate-100 text-slate-500"}`}>
      {rank}
    </span>
  );
}

function CompanyRow({ company }) {
  return (
    <button type="button" className="group grid w-full grid-cols-[28px_36px_minmax(0,1fr)_54px_62px_16px] items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-slate-50/70 sm:px-5">
      <RankBadge rank={company.rank} />
      <BrandMark company={company} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-violet-700">{company.name}</span>
          <CheckBadgeIcon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
        </div>
        <p className="truncate text-[10px] text-slate-400">{company.industry} · {company.location}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><StarSolid className="h-3.5 w-3.5 text-amber-400" />{company.rating}</div>
      <span className="text-right text-[10px] text-slate-400">{company.reviews} đánh giá</span>
      <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
    </button>
  );
}

function PodiumCard({ company, featured = false }) {
  return (
    <div className={`relative flex flex-col items-center rounded-2xl border px-3 pb-4 pt-8 text-center ${featured ? "border-amber-200 bg-amber-50/45 shadow-[0_8px_20px_rgba(180,132,25,0.08)]" : "border-slate-200 bg-white/70"}`}>
      <div className="absolute -top-3"><RankBadge rank={company.rank} /></div>
      <BrandMark company={company} large />
      <h3 className="mt-3 text-xs font-semibold text-slate-800">{company.name}</h3>
      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-600"><StarSolid className="h-3.5 w-3.5 text-amber-400" />{company.rating}</div>
      <p className="mt-1 text-[10px] text-slate-400">{company.reviews} đánh giá</p>
    </div>
  );
}

export default function TopCompany() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_28px_rgba(74,58,110,0.07)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><BuildingOffice2Icon className="h-4 w-4" /></span>
            <h2 className="text-sm font-semibold text-slate-800">Công ty nổi bật</h2>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-0.5 no-scrollbar">
            {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-medium transition ${activeTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>)}
          </div>
        </div>
        <div>{companies.map((company) => <CompanyRow key={company.rank} company={company} />)}</div>
        <button type="button" className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-2.5 text-[11px] font-medium text-violet-600 hover:bg-violet-50/50">Xem tất cả <ArrowRightIcon className="h-3 w-3" /></button>
      </section>

      <section className="flex min-h-0 flex-col rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_28px_rgba(74,58,110,0.07)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><StarIcon className="h-4 w-4" /></span>
          <h2 className="text-sm font-semibold text-slate-800">Top 3 công ty dẫn đầu</h2>
        </div>
        <div className="flex flex-1 items-center justify-center py-5">
          <div className="grid w-full grid-cols-3 items-end gap-2.5">
            <PodiumCard company={companies[1]} />
            <div className="pb-3"><PodiumCard company={companies[0]} featured /></div>
            <PodiumCard company={companies[2]} />
          </div>
        </div>
      </section>
    </div>
  );
}
