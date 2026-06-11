import React, { useState } from "react";
import { BuildingOffice2Icon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const tabs = [
  { key: "t1", label: "Theo đánh giá" },
  { key: "t2", label: "Lượt sử dụng" },
  { key: "t3", label: "Mới cập nhật" },
];

const companies = [
  { rank: 1, name: "VNG Corporation", rating: 4.8, reviews: 2520, industry: "Công nghệ" },
  { rank: 2, name: "FPT Software", rating: 4.7, reviews: 1980, industry: "Phần mềm" },
  { rank: 3, name: "Tiki JSC", rating: 4.6, reviews: 1543, industry: "Thương mại điện tử" },
  { rank: 4, name: "Momo (M_Service)", rating: 4.5, reviews: 1320, industry: "Fintech" },
  { rank: 5, name: "Shopee Vietnam", rating: 4.5, reviews: 1100, industry: "Thương mại điện tử" },
  { rank: 6, name: "Grab Vietnam", rating: 4.4, reviews: 980, industry: "Công nghệ" },
  { rank: 7, name: "Sorimachi VN", rating: 4.3, reviews: 820, industry: "Phần mềm" },
  { rank: 8, name: "VNPT Technology", rating: 4.2, reviews: 760, industry: "Viễn thông" },
  { rank: 9, name: "KMS Technology", rating: 4.2, reviews: 710, industry: "Phần mềm" },
  { rank: 10, name: "NTT Data Vietnam", rating: 4.1, reviews: 650, industry: "Công nghệ" },
];

const rankColors = [
  "text-yellow-500 font-black",
  "text-slate-400 font-black",
  "text-amber-600 font-black",
];

function CompanyRow({ company }) {
  const rankClass = rankColors[company.rank - 1] || "text-gray-400 font-bold";
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition-colors group cursor-pointer">
      <span className={`w-7 text-sm text-right shrink-0 ${rankClass}`}>
        {company.rank}
      </span>
      <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-[#9346F5]/30 transition-colors">
        <BuildingOffice2Icon className="w-4 h-4 text-gray-400 group-hover:text-[#9346F5] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate group-hover:text-[#9346F5] transition-colors">
          {company.name}
        </div>
        <div className="text-[11px] text-gray-400 font-medium">{company.industry}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <StarSolid className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-xs font-bold text-gray-700">{company.rating}</span>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:block">
          ({company.reviews.toLocaleString()})
        </span>
      </div>
    </div>
  );
}

export default function TopCompany() {
  const [active, setActive] = useState("t1");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-extrabold text-gray-900">
          Top Công ty tiêu biểu
        </h2>
        <div className="flex gap-1.5">
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
      </div>

      <div>
        {companies.map((company) => (
          <CompanyRow key={company.rank} company={company} />
        ))}
      </div>
    </div>
  );
}
