import React, { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../Components/Header.jsx";
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { getArticleBySlug, newsArticles } from "../data/newsArticles.js";

export default function NewsDetail() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  const related = useMemo(() => {
    if (!article) return [];
    return newsArticles
      .filter((a) => a.slug !== article.slug && a.category === article.category)
      .concat(newsArticles.filter((a) => a.slug !== article.slug))
      .filter((a, i, arr) => arr.findIndex((b) => b.slug === a.slug) === i)
      .slice(0, 3);
  }, [article]);

  if (!article) return <Navigate to="/News" replace />;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA]">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          to="/News"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[#9346F5]"
          style={{ color: "#9B87B8" }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại tin tức
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">

          {/* Article */}
          <article
            className="rounded-xl overflow-hidden"
            style={{ background: "#FDFAFF", border: "1px solid #E4D9F5" }}
          >
            {/* Header */}
            <div className="px-6 py-8 sm:px-8" style={{ background: "#2D1B4E" }}>
              <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span>{article.category}</span>
                <span>·</span>
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                <span>{article.date}</span>
              </div>
              <h1 className="text-xl font-bold text-white leading-snug sm:text-2xl">
                {article.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {article.summary}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-7 sm:px-8">

              {/* Intro */}
              <p className="text-sm leading-7 mb-7 pb-7 font-medium" style={{ color: "#4C1D95", borderBottom: "1px solid #E4D9F5" }}>
                {article.intro}
              </p>

              {/* Sections */}
              <div className="space-y-7">
                {article.sections.map((section, i) => (
                  <div key={i}>
                    {section.heading && (
                      <h2 className="text-sm font-bold mb-2.5" style={{ color: "#1E0B38" }}>
                        {section.heading}
                      </h2>
                    )}
                    <div className="space-y-2.5 text-sm leading-7" style={{ color: "#3D2266" }}>
                      {section.paragraphs.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className="mt-3 space-y-2 pl-4">
                        {section.bullets.map((b, k) => (
                          <li key={k} className="flex gap-2.5 text-sm leading-6" style={{ color: "#4C1D95" }}>
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#9346F5" }} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 flex justify-between items-center" style={{ borderTop: "1px solid #E4D9F5" }}>
                <Link
                  to="/News"
                  className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[#9346F5]"
                  style={{ color: "#9B87B8" }}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Tất cả bài viết
                </Link>
                <span className="text-xs" style={{ color: "#C4B0E4" }}>{article.date}</span>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6">
            <div className="rounded-xl p-4" style={{ background: "#F5F0FB", border: "1px solid #DDD4F0" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#1E0B38" }}>
                Bài viết liên quan
              </h3>
              <div className="space-y-2">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/News/${item.slug}`}
                    className="group block rounded-lg p-3 transition-colors"
                    style={{ background: "#EDE6F5", border: "1px solid #D5CAE8" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#DDD4F0"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#EDE6F5"; }}
                  >
                    <p className="text-[10px] mb-1 font-medium" style={{ color: "#9346F5" }}>
                      {item.category}
                    </p>
                    <h4
                      className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-[#7C3AED] transition-colors"
                      style={{ color: "#2D1B4E" }}
                    >
                      {item.title}
                    </h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#9B87B8" }}>{item.date}</span>
                      <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" style={{ color: "#C4B0E4" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
