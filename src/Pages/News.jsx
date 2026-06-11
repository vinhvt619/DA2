import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { featuredArticle, newsArticles, newsCategories } from "../data/newsArticles.js";

const popularArticles = newsArticles.slice(1, 5);
const allCategory = newsCategories[0];

function ArticleCard({ article }) {
  return (
    <Link
      to={`/News/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-200/30 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-300/35 transition-all duration-200"
    >
      <div className="h-16 bg-violet-200 border-b border-violet-300 flex items-end p-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-violet-300 px-2.5 py-1 text-[10px] font-semibold text-violet-800">
          <TagIcon className="w-3 h-3 text-violet-600" />
          {article.category}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-violet-800 transition-colors mb-2">
          {article.title}
        </h2>
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

export default function News() {
  const [activeCategory, setActiveCategory] = useState(allCategory);
  const [keyword, setKeyword] = useState("");

  const filteredArticles = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return newsArticles.filter((a) => {
      if (a.slug === featuredArticle.slug) return false;
      const matchCat = activeCategory === allCategory || a.category === activeCategory;
      const matchKey =
        !q || [a.title, a.summary, a.category].join(" ").toLowerCase().includes(q);
      return matchCat && matchKey;
    });
  }, [activeCategory, keyword]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA]">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center py-6 sm:py-10 mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-4">
            <NewspaperIcon className="h-3.5 w-3.5" />
            RabbitCV · Tin tức
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 max-w-2xl">
            Nghề nghiệp & Thị trường việc làm
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            Cập nhật xu hướng tuyển dụng, kỹ năng nghề nghiệp và những góc nhìn thực tế
            giúp bạn chuẩn bị tốt hơn cho hành trình tìm việc.
          </p>

          <label className="flex h-11 w-full max-w-md items-center gap-2.5 rounded-xl border border-violet-200 bg-white px-4 shadow-md shadow-violet-200/25 transition-shadow focus-within:shadow-lg focus-within:border-violet-400">
            <MagnifyingGlassIcon className="h-4.5 w-4.5 shrink-0 text-violet-600" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Tìm bài viết theo từ khóa..."
            />
          </label>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_17rem] xl:grid-cols-[1fr_19rem]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Featured */}
            <Link
              to={`/News/${featuredArticle.slug}`}
              className="group block rounded-2xl overflow-hidden border border-violet-200 bg-white shadow-md shadow-violet-200/30 hover:shadow-lg hover:shadow-violet-300/35 transition-all duration-200"
            >
              <div className="px-6 py-8 sm:px-8 sm:py-10 border-b-4 border-violet-300">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-200 border border-violet-300 px-3 py-1 text-[11px] font-semibold text-violet-900 mb-4">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Bài viết nổi bật
                </span>
                <h2 className="text-lg sm:text-xl font-bold leading-snug text-gray-900 group-hover:text-violet-800 transition-colors max-w-2xl">
                  {featuredArticle.title}
                </h2>
                <p className="mt-3 line-clamp-2 text-sm text-gray-500 leading-relaxed max-w-xl">
                  {featuredArticle.summary}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-violet-200 border border-violet-300 px-2.5 py-1 text-xs font-medium text-violet-900">
                    {featuredArticle.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {featuredArticle.date}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-violet-800 group-hover:gap-2.5 transition-all">
                    Đọc bài viết
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Category filter */}
            <div className="rounded-2xl border border-violet-200 bg-white p-3 shadow-md shadow-violet-200/25">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {newsCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      activeCategory === cat
                        ? "bg-violet-800 text-white shadow-sm"
                        : "bg-white text-gray-700 border border-violet-200 hover:border-violet-400 hover:text-violet-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Article grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-violet-200 bg-white py-16 text-center shadow-md shadow-violet-200/25">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-200 text-violet-700">
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Không tìm thấy bài viết phù hợp</p>
                <p className="mt-1 text-xs text-gray-400">Thử đổi từ khóa hoặc chọn danh mục khác</p>
                <button
                  onClick={() => {
                    setKeyword("");
                    setActiveCategory(allCategory);
                  }}
                  className="mt-4 text-xs font-semibold text-violet-800 hover:text-violet-950 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-md shadow-violet-200/25">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                <span className="h-4 w-1 rounded-full bg-violet-700" />
                Bài viết phổ biến
              </h3>
              <div className="space-y-1">
                {popularArticles.map((article, i) => (
                  <Link
                    key={article.slug}
                    to={`/News/${article.slug}`}
                    className="group flex gap-3 items-start rounded-xl p-2.5 -mx-1 transition-colors hover:bg-violet-100"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                        i === 0
                          ? "bg-violet-800 text-white"
                          : "bg-violet-200 text-violet-800"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[10px] font-medium text-violet-700 mb-0.5 truncate">
                        {article.category}
                      </p>
                      <p className="text-xs font-medium leading-5 text-gray-800 group-hover:text-violet-900 transition-colors line-clamp-2">
                        {article.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-100 p-5 shadow-md shadow-violet-200/25">
              <p className="text-xs font-semibold text-violet-900 mb-1">Mẹo nhỏ</p>
              <p className="text-xs leading-5 text-gray-500">
                Đọc tin tức thường xuyên giúp bạn nắm bắt xu hướng tuyển dụng và chuẩn bị CV
                phù hợp hơn.
              </p>
              <Link
                to="/ResumeSelection"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-800 hover:gap-1.5 transition-all"
              >
                Tạo CV ngay
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
