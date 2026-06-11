import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import {
  featuredArticle,
  newsArticles,
  newsCategories,
} from "../data/newsArticles.js";

const popularArticles = newsArticles.slice(1, 5);

function ArticleCard({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-20 bg-linear-to-br from-[#9346F5] to-[#60A5FA] p-5 text-white">
        <div className="flex h-full flex-col justify-between">
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4" />
            {article.date}
            
          </span>
          
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
            <TagIcon className="h-4 w-4" />
            {article.category}
          </span>
        </div>
        <h2 className="line-clamp-2 text-lg font-bold leading-snug text-gray-900 group-hover:text-[#9346F5]">
          {article.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
          {article.summary}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#9346F5] group-hover:text-[#7A34D8]">
          Đọc tiếp
          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function News() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");

  const filteredArticles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return newsArticles.filter((article) => {
      const matchesCategory =
        activeCategory === "Tất cả" || article.category === activeCategory;
      const matchesKeyword =
        !normalizedKeyword ||
        [article.title, article.summary, article.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);

      return matchesCategory && matchesKeyword;
    });
  }, [activeCategory, keyword]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA]">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <Link
            to={`/News/${featuredArticle.slug}`}
            className="group overflow-hidden rounded-[28px] bg-[#171321] text-white shadow-xl"
          >
            <div className="grid min-h-[360px] gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.78fr] lg:p-10">
              <div className="flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                    <NewspaperIcon className="h-5 w-5 text-[#C7A8FF]" />
                    Tin nổi bật
                  </span>
                  <h1 className="mt-6 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
                    {featuredArticle.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70">
                  <span className="rounded-full bg-[#9346F5] px-4 py-2 font-semibold text-white">
                    {featuredArticle.category}
                  </span>
                  <span>{featuredArticle.date}</span>
                  {/* <span>{featuredArticle.readTime}</span> */}
                  <span className="inline-flex items-center gap-2 font-bold text-white">
                    Đọc bài viết
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>

              <div className="relative hidden min-h-72 overflow-hidden rounded-2xl bg-white/10 p-5 lg:block">
                <div className="absolute inset-0 bg-linear-to-br from-[#9346F5]/70 via-[#60A5FA]/50 to-[#22C55E]/60" />
                <div className="relative flex h-full flex-col justify-end rounded-xl border border-white/20 bg-black/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    RabbitCV News
                  </p>
                  <p className="mt-3 text-2xl font-black leading-tight">
                    Cập nhật xu hướng nghề nghiệp mới nhất
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <aside className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-extrabold text-gray-900">
              Bài viết phổ biến
            </h2>
            <div className="mt-5 space-y-4">
              {popularArticles.map((article, index) => (
                <Link
                  key={article.slug}
                  to={`/News/${article.slug}`}
                  className="flex w-full items-start gap-4 rounded-2xl p-3 text-left hover:bg-[#F4ECFF]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9346F5]/10 text-sm font-black text-[#9346F5]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold leading-6 text-gray-800">
                    {article.title}
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <section className="mb-8 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-gray-500 shadow-sm">
              <MagnifyingGlassIcon className="h-5 w-5 shrink-0" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-12 w-full border-0 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                placeholder="Tìm kiếm tin tức, kỹ năng, hướng dẫn CV..."
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {newsCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                    activeCategory === category
                      ? "bg-[#9346F5] text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-[#F4ECFF] hover:text-[#9346F5]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9346F5]">
                Mới cập nhật
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-gray-950">
                Tin tức dành cho ứng viên
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveCategory("Tất cả");
                setKeyword("");
              }}
              className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:text-[#9346F5] sm:inline-flex"
            >
              Xem tất cả
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#C7A8FF] bg-white/80 p-10 text-center">
              <p className="text-lg font-black text-gray-900">
                Chưa tìm thấy bài viết phù hợp
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Hãy thử từ khóa khác hoặc chọn lại danh mục tin tức.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default News;
