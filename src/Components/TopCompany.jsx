import React, { useState } from "react";
import { BuildingOffice2Icon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, CheckBadgeIcon } from "@heroicons/react/24/solid";

const tabs = [
  { key: "t1", label: "Theo đánh giá" },
  { key: "t2", label: "Lượt sử dụng" },
  { key: "t3", label: "Mới cập nhật" },
];

const companies = [
  { rank: 1, name: "VNG Corporation", rating: 4.8, reviews: 2520, industry: "Công nghệ", location: "TP. HCM" },
  { rank: 2, name: "FPT Software", rating: 4.7, reviews: 1980, industry: "Phần mềm", location: "TP. HCM" },
  { rank: 3, name: "Tiki JSC", rating: 4.6, reviews: 1543, industry: "Thương mại điện tử", location: "TP. HCM" },
  { rank: 4, name: "Momo (M_Service)", rating: 4.5, reviews: 1320, industry: "Fintech", location: "TP. HCM" },
  { rank: 5, name: "Shopee Vietnam", rating: 4.5, reviews: 1100, industry: "Thương mại điện tử", location: "TP. HCM" },
  { rank: 6, name: "Grab Vietnam", rating: 4.4, reviews: 980, industry: "Công nghệ", location: "TP. HCM" },
  { rank: 7, name: "Sorimachi VN", rating: 4.3, reviews: 820, industry: "Phần mềm", location: "Hà Nội" },
  { rank: 8, name: "VNPT Technology", rating: 4.2, reviews: 760, industry: "Viễn thông", location: "Hà Nội" },
  { rank: 9, name: "KMS Technology", rating: 4.2, reviews: 710, industry: "Phần mềm", location: "TP. HCM" },
  { rank: 10, name: "NTT Data Vietnam", rating: 4.1, reviews: 650, industry: "Công nghệ", location: "Hà Nội" },
];

const companyBrands = {
  "VNG Corporation": { char: "V", logo: "https://logo.clearbit.com/vng.com.vn" },
  "FPT Software": { char: "F", logo: "https://logo.clearbit.com/fpt-software.com" },
  "Tiki JSC": { char: "T", logo: "https://logo.clearbit.com/tiki.vn" },
  "Momo (M_Service)": { char: "M", logo: "https://logo.clearbit.com/momo.vn" },
  "Shopee Vietnam": { char: "S", logo: "https://logo.clearbit.com/shopee.vn" },
  "Grab Vietnam": { char: "G", logo: "https://logo.clearbit.com/grab.com" },
  "Sorimachi VN": { char: "S", logo: "https://logo.clearbit.com/sorimachi.vn" },
  "VNPT Technology": { char: "V", logo: "https://logo.clearbit.com/vnpt.com.vn" },
  "KMS Technology": { char: "K", logo: "https://logo.clearbit.com/kms-technology.com" },
  "NTT Data Vietnam": { char: "N", logo: "https://logo.clearbit.com/nttdata.com" },
};

function CompanyRow({ company }) {
  const [imgFailed, setImgFailed] = useState(false);
  const brand = companyBrands[company.name] || { char: "C" };

  const rankStyle = company.rank <= 3
    ? company.rank === 1
      ? "bg-amber-500 text-white"
      : company.rank === 2
        ? "bg-slate-400 text-white"
        : "bg-amber-700 text-white"
    : "text-slate-400 bg-slate-50 border border-slate-100";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg cursor-pointer group">
      <div className="w-6 shrink-0 flex justify-center">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankStyle}`}>
          {company.rank}
        </span>
      </div>

      <div className="w-9 h-9 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 bg-white overflow-hidden text-sm font-bold text-slate-400">
        {brand.logo && !imgFailed ? (
          <img
            src={brand.logo}
            alt={company.name}
            className="w-full h-full object-contain p-1.5"
            onError={() => setImgFailed(true)}
          />
        ) : (
          brand.char
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1">
          <span className="group-hover:text-violet-600">{company.name}</span>
          <CheckBadgeIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        </div>
        <div className="text-[11px] text-slate-400">
          {company.industry} · {company.location}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <StarSolid className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-bold text-slate-700">{company.rating.toFixed(1)}</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          ({company.reviews >= 1000 ? `${(company.reviews / 1000).toFixed(1)}k` : company.reviews})
        </span>
      </div>
    </div>
  );
}

export default function TopCompany() {
  const [active, setActive] = useState("t1");

  return (
    <div className="w-full">
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="w-4 h-4 text-violet-500 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900">
            Top Công ty tiêu biểu
          </h2>
        </div>

        <div className="flex gap-1 shrink-0">
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
      </div>

      <div className="border-t border-gray-50" />

      <div className="px-4 py-2">
        {companies.map((company) => (
          <CompanyRow key={company.rank} company={company} />
        ))}
      </div>
    </div>
  );
}
