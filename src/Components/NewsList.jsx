import React from "react";
import { Link } from "react-router-dom";
import { CalendarDaysIcon, TagIcon } from "@heroicons/react/24/outline";
import { newsArticles, getCategoryImg } from "../data/newsArticles.js";

const categoryColor = (category) => {
  const c = category?.toLowerCase() || "";
  if (c.includes("thị trường"))
    return "bg-green-50 text-green-700 border-green-200/60";
  if (c.includes("hướng dẫn") || c.includes("cv"))
    return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
  if (c.includes("phỏng vấn"))
    return "bg-pink-50 text-pink-700 border-pink-200/60";
  if (c.includes("kỹ năng"))
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  return "bg-slate-50 text-slate-600 border-slate-200/60";
};

function NewsItem({ article }) {
  const imageUrl = getCategoryImg(article.slug, article.category);

  return (
    <Link
      to={`/News/${article.slug}`}
      className="group flex flex-col rounded-xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="relative overflow-hidden aspect-[16/9] w-full bg-gray-100">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-2 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-600 text-[10px] font-semibold px-2.5 py-0.5 border border-violet-100/50">
            <TagIcon className="w-2.5 h-2.5" />
            {article.category}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-violet-600">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-xs text-slate-500 mt-1 leading-relaxed flex-1">
          {article.summary}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <CalendarDaysIcon className="w-3 h-3" />
            {article.date}
          </span>
          <span className="text-[11px] font-medium text-violet-600 group-hover:underline">
            Đọc tiếp →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ListNews() {
  return (
    <div className="w-full">
      <div className="px-4 pb-5 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsArticles.slice(0, 6).map((article) => (
            <NewsItem key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
