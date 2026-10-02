import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import {
  featuredArticle,
  getCategoryImg,
  newsArticles,
  newsCategories,
} from "../data/newsArticles.js";

const allCategory = newsCategories[0];
const secondaryFeatured = newsArticles
  .filter((article) => article.slug !== featuredArticle.slug)
  .slice(0, 2);
const popularArticles = newsArticles.slice(1, 4);

function normalizeText(value = "") {
  return value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
}

function SecondaryArticle({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group grid min-h-[112px] grid-cols-[92px_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition hover:border-violet-200 hover:shadow-md lg:grid-cols-1 lg:grid-rows-[104px_1fr]"
    >
      <span className="overflow-hidden bg-violet-50">
        <img
          src={getCategoryImg(article.slug, article.category)}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </span>
      <span className="min-w-0 p-3">
        <span className="block text-[10px] font-semibold text-violet-700">
          {article.category}
        </span>
        <span className="mt-1 line-clamp-2 text-xs font-semibold leading-4.5 text-slate-800 transition group-hover:text-violet-700">
          {article.title}
        </span>
      </span>
    </Link>
  );
}

function ArticleRow({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition hover:border-violet-200 hover:shadow-md sm:grid-cols-[112px_minmax(0,1fr)_auto]"
    >
      <span className="h-[78px] overflow-hidden rounded-lg bg-violet-50">
        <img
          src={getCategoryImg(article.slug, article.category)}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-[9px] font-medium text-slate-400">
          <span className="text-violet-700">{article.category}</span>
          <span aria-hidden="true">•</span>
          <span>{article.date}</span>
        </span>
        <span className="mt-1 line-clamp-2 text-[13px] font-semibold leading-4.5 text-slate-900 transition group-hover:text-violet-700">
          {article.title}
        </span>
        <span className="mt-1 hidden line-clamp-1 text-[10px] leading-4 text-slate-500 sm:block">
          {article.summary}
        </span>
      </span>

      <ArrowUpRightIcon className="hidden h-4 w-4 shrink-0 text-violet-400 transition group-hover:text-violet-700 sm:block" />
    </Link>
  );
}

export default function News() {
  const [activeCategory, setActiveCategory] = useState(allCategory);
  const [keyword, setKeyword] = useState("");
  const [sortMode, setSortMode] = useState("newest");

  const filteredArticles = useMemo(() => {
    const query = normalizeText(keyword.trim());
    const filtered = newsArticles.filter((article) => {
      if (article.slug === featuredArticle.slug) return false;
      const matchesCategory =
        activeCategory === allCategory || article.category === activeCategory;
      const searchableText = normalizeText(
        [article.title, article.summary, article.category].filter(Boolean).join(" "),
      );
      return matchesCategory && (!query || searchableText.includes(query));
    });

    if (sortMode === "popular") {
      return [...filtered].sort((a, b) => b.summary.length - a.summary.length);
    }
    return filtered;
  }, [activeCategory, keyword, sortMode]);

  const resetFilters = () => {
    setKeyword("");
    setActiveCategory(allCategory);
    setSortMode("newest");
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <main className="mx-auto w-full max-w-[1120px] px-3 py-5 sm:px-5 lg:px-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-[-0.02em] text-slate-950 sm:text-2xl">
              Tin tức &amp; Cẩm nang nghề nghiệp
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Kiến thức thực tế giúp bạn tự tin hơn trên hành trình tìm việc.
            </p>
          </div>

          <label className="relative w-full sm:w-72">
            <span className="sr-only">Tìm bài viết</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="articleSearch"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm bài viết..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>
        </section>

        <nav
          aria-label="Danh mục bài viết"
          className="mt-4 flex gap-5 overflow-x-auto border-b border-slate-200 no-scrollbar"
        >
          {newsCategories.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={active}
                className={`relative shrink-0 pb-2.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  active ? "text-violet-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {category}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-600" />
                )}
              </button>
            );
          })}
        </nav>

        <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(220px,0.75fr)]">
          <Link
            to={`/News/${featuredArticle.slug}`}
            className="group grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition hover:border-violet-200 hover:shadow-md sm:grid-cols-[43%_57%]"
          >
            <span className="relative h-48 overflow-hidden bg-violet-50 sm:h-auto sm:min-h-[260px]">
              <img
                src={getCategoryImg(featuredArticle.slug, featuredArticle.category)}
                alt={featuredArticle.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
              />
              <span className="absolute left-3 top-3 rounded-full border border-violet-100 bg-white/95 px-2.5 py-1 text-[9px] font-bold text-violet-700 shadow-sm">
                Tiêu điểm
              </span>
            </span>

            <span className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
              <span className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="text-violet-700">{featuredArticle.category}</span>
                <span aria-hidden="true">•</span>
                <span>{featuredArticle.date}</span>
              </span>
              <span className="mt-2 text-base font-bold leading-5.5 text-slate-900 transition group-hover:text-violet-700 sm:text-lg">
                {featuredArticle.title}
              </span>
              <span className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                {featuredArticle.summary}
              </span>
              <span className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <ClockIcon className="h-3.5 w-3.5" />6 phút đọc
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                  Đọc bài viết
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </span>
            </span>
          </Link>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {secondaryFeatured.map((article) => (
              <SecondaryArticle key={article.slug} article={article} />
            ))}
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <section aria-labelledby="latest-news-title">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <h2 id="latest-news-title" className="text-base font-bold text-slate-900">
                  Bài viết mới nhất
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {filteredArticles.length} bài viết
                </p>
              </div>
              <label>
                <span className="sr-only">Sắp xếp bài viết</span>
                <select
                  name="articleSort"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-600 outline-none focus:border-violet-400"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Đọc nhiều nhất</option>
                </select>
              </label>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="space-y-2.5">
                {filteredArticles.map((article) => (
                  <ArticleRow key={article.slug} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Không tìm thấy bài viết phù hợp
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Thử đổi từ khóa hoặc chọn danh mục khác.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 text-xs font-semibold text-violet-700 hover:text-violet-900"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </section>

          <aside className="space-y-3 lg:sticky lg:top-20">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
              <h2 className="text-sm font-bold text-slate-900">Đọc nhiều nhất</h2>
              <div className="mt-2">
                {popularArticles.map((article, index) => (
                  <Link
                    key={article.slug}
                    to={`/News/${article.slug}`}
                    className="group grid grid-cols-[26px_minmax(0,1fr)] gap-2.5 border-b border-slate-100 py-3 first:pt-1 last:border-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-[10px] font-bold text-violet-700">
                      {index + 1}
                    </span>
                    <span className="line-clamp-2 text-[11px] font-medium leading-4.5 text-slate-700 transition group-hover:text-violet-700">
                      {article.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <h2 className="mt-3 text-sm font-bold text-slate-900">Tạo CV chuyên nghiệp</h2>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                Ứng dụng kiến thức vừa đọc vào CV của riêng bạn.
              </p>
              <Link
                to="/ResumeSelection"
                className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-violet-600 text-[11px] font-bold text-white transition hover:bg-violet-700"
              >
                Bắt đầu tạo CV
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
