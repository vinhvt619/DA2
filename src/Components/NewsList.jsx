import React from "react";
import { Link } from "react-router-dom";
import { CalendarDaysIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import { newsArticles } from "../data/newsArticles.js";

function NewsItem({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group block w-[95%] cursor-pointer pl-3 pt-4"
    >
      <div className={`mb-3 flex items-center justify-center rounded-xl bg-linear-to-br from-[#9346F5] to-[#60A5FA] py-10 text-white group-hover:-translate-y-0.5`}>
        <NewspaperIcon className="h-8 w-8 opacity-80" />
      </div>
      <div className="px-0.5">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-gray-800 group-hover:text-[#9346F5]">
          {article.title}
        </h3>
        <span className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <CalendarDaysIcon className="h-3.5 w-3.5" />
          {article.date}
        </span>
        <p className="mt-2.5 line-clamp-2 text-[11px] font-medium leading-relaxed text-gray-500">
          {article.summary}
        </p>
      </div>
    </Link>
  );
}

export default function ListNews() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="pl-3 text-lg font-bold text-gray-900">
          Tin tức & Bài viết
        </div>
        <Link
          to="/News"
          className="text-[10px] font-bold uppercase tracking-widest text-[#9346F5] hover:underline"
        >
          Xem tất cả bài viết &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-2 md:grid-cols-3">
        {newsArticles.slice(0, 6).map((article) => (
          <NewsItem key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
