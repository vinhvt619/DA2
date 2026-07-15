import React from "react";
import {
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  DocumentTextIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";

const overviewStats = [
  {
    label: "Công ty nổi bật",
    value: "2.548",
    change: "8,6%",
    icon: BuildingOffice2Icon,
  },
  {
    label: "Mẫu CV nổi bật",
    value: "126",
    change: "12,4%",
    icon: DocumentTextIcon,
  },
  {
    label: "Bài viết mới",
    value: "342",
    change: "15,7%",
    icon: NewspaperIcon,
  },
];

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(74,58,110,0.07)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100/80 text-violet-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <strong className="text-2xl font-bold tracking-tight text-slate-800">
          {item.value}
        </strong>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-600">{item.label}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[10px]">
        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
          <ArrowTrendingUpIcon className="h-3 w-3" />
          {item.change}
        </span>
        <span className="text-slate-400">so với tuần trước</span>
      </div>
    </div>
  );
}

function TopPage() {
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <Header />

      <main className="top-page-scale relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-[28%] top-4 h-64 w-80 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-8 top-32 h-52 w-52 rounded-full bg-indigo-100/50 blur-3xl" />

        <section className="relative grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div className="px-1 py-3 sm:py-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
              RabbitCV Weekly
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Nổi bật tuần này
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
              Khám phá các công ty dẫn đầu, mẫu CV được yêu thích và những
              thông tin tuyển dụng đáng chú ý nhất trong tuần.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" />
              <span className="capitalize">Cập nhật mỗi thứ Hai · {currentDate}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {overviewStats.map((item) => (
              <MetricCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        <div className="relative mt-6 space-y-4">
          <TopCompany />

          <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <TopCVList />
            <ListNews />
          </div>
        </div>
      </main>
    </div>
  );
}

export default TopPage;
