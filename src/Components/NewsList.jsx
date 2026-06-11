import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, CalendarDaysIcon, TagIcon } from "@heroicons/react/24/outline";
import { newsArticles } from "../data/newsArticles.js";

function NewsItem({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-200/30 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-300/35 transition-all duration-200"
    >
      <div className="h-14 bg-violet-200 border-b border-violet-300 flex items-end p-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-violet-300 px-2.5 py-1 text-[10px] font-semibold text-violet-800">
          <TagIcon className="w-3 h-3 text-violet-600" />
          {article.category}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-violet-800 transition-colors mb-2">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-xs text-gray-600 leading-relaxed flex-1">
          {article.summary}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-3">
          <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            {article.date}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-800 group-hover:gap-1.5 transition-all">
            Đọc tiếp
            <ArrowRightIcon className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ListNews() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-extrabold text-gray-900">
          Tin tức & Bài viết
        </h2>
        <Link
          to="/News"
          className="flex items-center gap-1 text-[11px] font-semibold text-violet-800 hover:text-violet-950 transition-colors"
        >
          Xem tất cả
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsArticles.slice(0, 6).map((article) => (
          <NewsItem key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
