import React, { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  TagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { getArticleBySlug, getCategoryImg, newsArticles } from "../data/newsArticles.js";

const categoryColors = (category) => {
  const c = category?.toLowerCase() || "";
  if (c.includes("thị trường"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (c.includes("hướng dẫn") || c.includes("cv"))
    return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
  if (c.includes("phỏng vấn"))
    return "bg-pink-50 text-pink-700 border-pink-200/60";
  if (c.includes("kỹ năng"))
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  return "bg-slate-50 text-slate-700 border-slate-200/60";
};

export default function NewsDetail() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  const related = useMemo(() => {
    if (!article) return [];
    return newsArticles
      .filter((a) => a.slug !== article.slug && a.category === article.category)
      .concat(newsArticles.filter((a) => a.slug !== article.slug))
      .filter((a, i, arr) => arr.findIndex((b) => b.slug === a.slug) === i)
      .slice(0, 4); // Display up to 4 related articles for richer sidebar
  }, [article]);

  if (!article) return <Navigate to="/News" replace />;

  const coverImage = getCategoryImg(article.slug, article.category);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] relative overflow-hidden text-slate-800 page-transition">
      {/* Decorative background glows */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[380px] h-[380px] rounded-full bg-fuchsia-100/40 blur-3xl pointer-events-none" />

      <Header />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back Link */}
        <div className="flex text-left">
          <Link
            to="/News"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-violet-100/80 bg-white/70 backdrop-blur-md text-violet-700 shadow-xs transition-all duration-300 hover:bg-violet-50 hover:border-violet-300/80 hover:text-violet-900 hover:shadow-md mb-6 active:scale-95 group"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Quay lại tin tức
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px] items-start">
          
          {/* Main Article Container */}
          <article className="rounded-3xl border border-violet-100/80 bg-white/90 backdrop-blur-xs shadow-2xl shadow-purple-500/[0.03] overflow-hidden">
            
            {/* Cover Image & Header Overlay */}
            <div className="h-[280px] sm:h-[400px] relative overflow-hidden bg-slate-900">
              <img
                src={coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {/* Dark overlay gradients for excellent readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-transparent" />
              
              {/* Article Header info absolute container */}
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 flex flex-col justify-end text-left">
                
                {/* Meta details (Category & Date) */}
                <div className="flex flex-wrap items-center gap-3 text-xs mb-3 font-semibold text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 backdrop-blur-md bg-white/10 px-3 py-1 text-white">
                    <TagIcon className="w-3.5 h-3.5 text-violet-300" />
                    {article.category}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400/60" />
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                    {article.date}
                  </span>
                </div>

                {/* Main Title */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  {article.title}
                </h1>
                
                {/* Summary */}
                <p className="mt-3 text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal max-w-3xl border-l-2 border-violet-400/70 pl-3">
                  {article.summary}
                </p>
              </div>
            </div>

            {/* Article Content Body */}
            <div className="p-6 sm:p-10 text-left">
              
              {/* Highlighted Intro Box */}
              <div className="relative border-l-4 border-violet-500 bg-violet-50/40 rounded-r-2xl p-5 sm:p-6 mb-8 shadow-xs">
                <div className="absolute top-2 right-4 text-violet-200/50">
                  <SparklesIcon className="w-8 h-8" />
                </div>
                <p className="text-base font-medium text-violet-950 leading-relaxed italic relative z-10">
                  "{article.intro}"
                </p>
              </div>

              {/* Sections rendering with beautiful typography */}
              <div className="space-y-10">
                {article.sections.map((section, i) => (
                  <div key={i} className="group">
                    {section.heading && (
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2 group-hover:text-violet-700 transition-colors duration-300">
                        {section.heading}
                      </h2>
                    )}
                    <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                      {section.paragraphs.map((p, j) => (
                        <p key={j} className="text-justify">{p}</p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3.5 pl-1.5">
                        {section.bullets.map((b, k) => (
                          <li key={k} className="flex items-start gap-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Share/Footer Section */}
              <div className="mt-12 pt-8 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-slate-100">
                <Link
                  to="/News"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full bg-slate-100 hover:bg-violet-50 border border-transparent hover:border-violet-200 text-slate-600 hover:text-violet-700 transition-all duration-300 shadow-xs group active:scale-95"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                  Xem tất cả tin tức
                </Link>
                <div className="text-xs text-slate-400 font-medium">
                  Đăng ngày: <span className="text-slate-600">{article.date}</span>
                </div>
              </div>
              
            </div>
          </article>

          {/* Sidebar - Related Articles */}
          <aside className="lg:sticky lg:top-6 flex flex-col gap-6 text-left">
            <div className="rounded-3xl p-6 border border-violet-100/80 bg-white/95 backdrop-blur-md shadow-xl shadow-purple-500/[0.02]">
              <h3 className="text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-violet-500" />
                Bài viết liên quan
              </h3>
              
              <div className="space-y-4">
                {related.map((item) => {
                  const itemImg = getCategoryImg(item.slug, item.category);
                  const tagColor = categoryColors(item.category);
                  
                  return (
                    <Link
                      key={item.slug}
                      to={`/News/${item.slug}`}
                      className="group flex gap-3.5 rounded-2xl p-2.5 hover:bg-violet-50/50 border border-transparent hover:border-violet-100/60 transition-all duration-300"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-violet-100/50 relative">
                        <img
                          src={itemImg}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Content details */}
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${tagColor}`}>
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold leading-snug text-slate-700 group-hover:text-violet-700 transition-colors duration-300 line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.date}</span>
                          <span className="flex items-center gap-0.5 text-violet-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Đọc
                            <ArrowRightIcon className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
