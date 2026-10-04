import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ListBulletIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { getCategoryImg } from "../data/newsArticles.js";
import usePublicNews from '../hooks/usePublicNews.js';
import RichTextContent from '../Components/RichTextContent.jsx';
import '../Components/RichText/news.scss';

export default function NewsDetail() {
  const { slug } = useParams();
  const { articles: newsArticles, isLoading, error } = usePublicNews();
  const article = newsArticles.find((a) => a.slug === slug);

  const related = useMemo(() => {
    if (!article) return [];

    return newsArticles
      .filter((item) => item.slug !== article.slug && item.category === article.category)
      .concat(newsArticles.filter((item) => item.slug !== article.slug))
      .filter((item, index, items) => items.findIndex((candidate) => candidate.slug === item.slug) === index)
      .slice(0, 3);
  }, [article, newsArticles]);

  const readingTime = useMemo(() => {
    if (!article) return 0;

    const content = [
      article.title,
      article.summary,
      article.intro,
      article.content ? new DOMParser().parseFromString(article.content, 'text/html').body.textContent : '',
      ...article.sections.flatMap((section) => [
        section.heading || "",
        ...(section.paragraphs || []),
        ...(section.bullets || []),
      ]),
    ].join(" ");

    return Math.max(3, Math.ceil(content.trim().split(/\s+/).length / 220));
  }, [article]);

  if (isLoading || error) return <div><Header /><p role={error ? 'alert' : 'status'} className="p-8">{error?.message || 'Đang tải bài viết...'}</p></div>;
  if (!article) return <Navigate to="/News" replace />;

  const coverImage = getCategoryImg(article.slug, article.category);
  const tocSections = article.content ? [...new DOMParser().parseFromString(article.content, 'text/html').querySelectorAll('h1,h2,h3')].map((heading, index) => ({ heading: heading.textContent, index })) : article.sections
    .map((section, index) => ({ ...section, index }))
    .filter((section) => section.heading);

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 page-transition">
      <Header />

      <main className="mx-auto w-full max-w-[1040px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="mb-2.5">
          <Link
            to="/News"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tin tức
          </Link>

        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_275px]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-48 overflow-hidden bg-violet-100 sm:h-60">
              <img src={coverImage} alt={article.title} className="h-full w-full object-cover" />
            </div>

            <div className="p-4 sm:p-6">
              <header>
                <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
                    <TagIcon className="h-3.5 w-3.5" />
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {article.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {readingTime} phút đọc
                  </span>
                </div>

                <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                  {article.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{article.summary}</p>
              </header>

              {article.intro && <div className="my-5 border-l-4 border-violet-600 bg-violet-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700">
                {article.intro}
              </div>}

              {article.content ? <RichTextContent article content={article.content} className="news-rich-text my-5" /> : <div>
                {article.sections.map((section, index) => (
                  <section
                    id={`section-${index}`}
                    key={`${section.heading || "section"}-${index}`}
                    className="scroll-mt-24 border-t border-slate-100 py-5 first:border-t-0 first:pt-0"
                  >
                    {section.heading && (
                      <h2 className="mb-2.5 text-base font-bold text-slate-950 sm:text-lg">
                        {section.heading}
                      </h2>
                    )}

                    <div className="space-y-3 text-sm leading-6 text-slate-600">
                      {(section.paragraphs || []).map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>{paragraph}</p>
                      ))}
                    </div>

                    {section.bullets && (
                      <ul className="mt-3 space-y-2.5">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-2 text-sm leading-6 text-slate-600">
                            <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-violet-600" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>}

              <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/News"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 transition hover:text-violet-800"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Xem tất cả tin tức
                </Link>
                <span className="text-xs text-slate-400">Cập nhật ngày {article.date}</span>
              </footer>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-20">
            {tocSections.length > 0 && (
              <nav aria-label="Mục lục bài viết" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                  <ListBulletIcon className="h-4 w-4 text-violet-600" />
                  Trong bài viết
                </h2>
                <ol className="divide-y divide-slate-100">
                  {tocSections.map((section) => (
                    <li key={section.index}>
                      <a
                        href={`#section-${section.index}`}
                        className="block py-2.5 text-xs leading-5 text-slate-600 transition hover:text-violet-700"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <SparklesIcon className="h-4 w-4 text-violet-600" />
                  Bài viết liên quan
                </h2>
                <Link to="/News" className="text-[11px] font-semibold text-violet-700 hover:text-violet-800">
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {related.map((item, index) => {
                  const ItemIcon = index === 0 ? DocumentTextIcon : index === 1 ? ChatBubbleLeftRightIcon : BriefcaseIcon;

                  return (
                    <Link
                      key={item.slug}
                      to={`/News/${item.slug}`}
                      className="group grid grid-cols-[56px_minmax(0,1fr)] gap-2.5 rounded-xl border border-transparent p-1.5 transition hover:border-violet-100 hover:bg-violet-50/50"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-xs font-bold leading-5 text-slate-700 transition group-hover:text-violet-700">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400">{item.date}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Link
                to="/News"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 transition hover:text-violet-800"
              >
                Xem thêm bài viết
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
