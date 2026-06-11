import React, { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  NewspaperIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { getArticleBySlug, newsArticles } from "../data/newsArticles.js";

function NewsDetail() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    return newsArticles
      .filter(
        (item) => item.slug !== article.slug && item.category === article.category,
      )
      .concat(newsArticles.filter((item) => item.slug !== article.slug))
      .filter(
        (item, index, list) =>
          list.findIndex((candidate) => candidate.slug === item.slug) === index,
      )
      .slice(0, 3);
  }, [article]);

  if (!article) {
    return <Navigate to="/News" replace />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA]">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/News"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6B3DB8] hover:text-[#9346F5]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại tin tức
        </Link>

        <article className="mt-6 overflow-hidden rounded-[28px] border border-white bg-white shadow-sm">
          <div className={`bg-[#9346F5] px-6 py-10 text-white sm:px-10 lg:px-14`}>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
                <TagIcon className="h-4 w-4" />
                {article.category}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                <CalendarDaysIcon className="h-4 w-4" />
                {article.date}
              </span>
              {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                <ClockIcon className="h-4 w-4" />
                {article.readTime}
              </span> */}
            </div>

            <div className="mt-8">
              <div>
                <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
                  {article.title}
                </h1>
                <p className="mt-5 max-w-4xl text-base leading-8 text-white/85 sm:text-lg">
                  {article.summary}
                </p>
              </div>

              {/* <div className="hidden min-h-48 rounded-3xl border border-white/25 bg-black/10 p-5 backdrop-blur lg:flex lg:flex-col lg:justify-between">
                <NewspaperIcon className="h-12 w-12 text-white/80" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    {article.coverLabel}
                  </p>
                  <p className="mt-2 text-xl font-black leading-tight">
                    Đọc sâu hơn trong 5 phút nghỉ
                  </p>
                </div>
              </div> */}
            </div>
          </div>

          <div className="grid gap-10 px-6 py-9 sm:px-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-14 lg:py-12">
            <div className="min-w-0">
              <p className="text-base font-medium leading-9 text-gray-700">
                {article.intro}
              </p>

              <div className="mt-9 space-y-9">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-2xl font-black text-gray-950">
                      {section.heading}
                    </h2>
                    <div className="mt-4 space-y-4 text-base leading-8 text-gray-700">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {section.bullets ? (
                      <ul className="mt-5 space-y-3 rounded-2xl bg-[#F7F2FF] p-5 text-sm font-semibold leading-7 text-gray-700">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#9346F5]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <h2 className="text-base font-black text-gray-950">
                  Bài viết liên quan
                </h2>
                <div className="mt-4 space-y-3">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/News/${item.slug}`}
                      className="group block rounded-2xl bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9346F5]">
                        {item.category}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-gray-900 group-hover:text-[#6B3DB8]">
                        {item.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-gray-500">
                        Đọc tiếp
                        <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>
    </div>
  );
}

export default NewsDetail;
