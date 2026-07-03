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
import { featuredArticle, getCategoryImg, newsArticles, newsCategories } from "../data/newsArticles.js";

const popularArticles = newsArticles.slice(1, 5);
const allCategory = newsCategories[0];

function ArticleCard({ article }) {
  const imageUrl = getCategoryImg(article.slug, article.category);

  return (
    <Link
      to={`/News/${article.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="h-40 bg-gray-100 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-2 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            <TagIcon className="w-2.5 h-2.5" />
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 text-left">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 group-hover:text-violet-600 mb-1.5">
          {article.title}
        </h2>
        <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed flex-1">
          {article.summary}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <CalendarDaysIcon className="w-3 h-3 text-slate-400" />
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] page-transition">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col items-center text-center py-6 sm:py-8 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-600 px-3 py-1 text-[11px] font-semibold mb-4">
            <NewspaperIcon className="h-3.5 w-3.5" />
            RabbitCV · Tin tức
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 max-w-2xl">
            Nghề nghiệp & Thị trường việc làm
          </h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed mb-6">
            Cập nhật xu hướng tuyển dụng, kỹ năng nghề nghiệp và góc nhìn thực tế
            giúp bạn chuẩn bị tốt hơn cho hành trình tìm việc.
          </p>

          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 shadow-xs">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-450"
              placeholder="Tìm bài viết theo từ khóa..."
            />
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_17rem] xl:grid-cols-[1fr_19rem]">
          <div className="space-y-5">
            <Link
              to={`/News/${featuredArticle.slug}`}
              className="group flex flex-col md:flex-row rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-full md:w-[40%] h-48 md:h-auto bg-gray-100 relative overflow-hidden">
                <img
                  src={getCategoryImg(featuredArticle.slug, featuredArticle.category)}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="w-full md:w-[60%] p-6 flex flex-col justify-between text-left">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-0.5 text-[11px] font-semibold mb-3">
                    <SparklesIcon className="h-3 w-3 text-violet-600" />
                    Bài viết nổi bật
                  </span>
                  <h2 className="text-lg font-bold leading-snug text-slate-800 group-hover:text-violet-600">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>
                
                <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-gray-50">
                  <span className="rounded-md border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                    {featuredArticle.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                    {featuredArticle.date}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-violet-600 group-hover:underline">
                    Đọc bài viết →
                  </span>
                </div>
              </div>
            </Link>

            <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {newsCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-violet-600 text-white"
                        : "bg-white text-gray-500 border border-gray-200 hover:text-violet-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white py-14 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-105 text-gray-400">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Không tìm thấy bài viết phù hợp</p>
                <p className="mt-1 text-xs text-gray-400">Thử đổi từ khóa hoặc chọn danh mục khác</p>
                <button
                  onClick={() => {
                    setKeyword("");
                    setActiveCategory(allCategory);
                  }}
                  className="mt-3 text-xs font-medium text-violet-600 hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                <span className="h-3 w-1 rounded-sm bg-violet-600" />
                Bài viết phổ biến
              </h3>
              <div className="space-y-1">
                {popularArticles.map((article, i) => (
                  <Link
                    key={article.slug}
                    to={`/News/${article.slug}`}
                    className="group flex gap-3 items-start rounded-lg p-2 -mx-1 hover:bg-gray-50"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                        i === 0
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-violet-600 mb-0.5">
                        {article.category}
                      </p>
                      <p className="text-xs font-medium leading-relaxed text-gray-800 group-hover:text-violet-600 line-clamp-2">
                        {article.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-800 mb-1">Mẹo nhỏ</p>
              <p className="text-xs leading-relaxed text-gray-500">
                Đọc tin tức thường xuyên giúp bạn nắm bắt xu hướng tuyển dụng và chuẩn bị CV
                phù hợp hơn.
              </p>
              <Link
                to="/ResumeSelection"
                className="mt-3.5 inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
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
