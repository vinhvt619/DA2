import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { getCategoryImg, newsArticles } from "../data/newsArticles.js";

const displayContent = [
  {
    title: "Xu hướng tuyển dụng 2026: Nhà tuyển dụng tìm gì ở ứng viên trẻ?",
    category: "Thị trường",
  },
  {
    title: "Cách viết CV ấn tượng cho sinh viên chưa có kinh nghiệm",
    category: "Hướng dẫn CV",
  },
  {
    title: "Nghệ thuật quản lý thời gian giúp tăng hiệu suất làm việc",
    category: "Kỹ năng",
  },
];

function NewsRow({ article, display }) {
  return (
    <Link to={`/News/${article.slug}`} className="group flex gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <img src={getCategoryImg(article.slug, article.category)} alt={display.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-xs font-semibold leading-4.5 text-slate-800 transition group-hover:text-violet-700">{display.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px]">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-600">{display.category}</span>
          <span className="inline-flex items-center gap-1 text-slate-400"><CalendarDaysIcon className="h-2.5 w-2.5" />{article.date}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ListNews() {
  const articles = newsArticles.slice(0, 3);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_28px_rgba(74,58,110,0.07)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><NewspaperIcon className="h-4 w-4" /></span>
          <h2 className="text-sm font-semibold text-slate-800">Tin tức tuyển dụng</h2>
        </div>
        <Link to="/News" className="flex items-center gap-1 text-[10px] font-medium text-violet-600 hover:text-violet-700">Xem tất cả <ArrowRightIcon className="h-3 w-3" /></Link>
      </div>
      <div className="p-4 sm:p-5">
        {articles.map((article, index) => <NewsRow key={article.slug} article={article} display={displayContent[index]} />)}
      </div>
    </section>
  );
}
