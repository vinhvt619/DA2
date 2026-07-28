import "../App.css";
import React from "react";
import { ArrowRightIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import { useNavigate } from "react-router-dom";

const highlights = [
  { value: "05", label: "mẫu CV nổi bật" },
  { value: "12+", label: "gợi ý tối ưu" },
  { value: "24h", label: "sẵn sàng ứng tuyển" },
];

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[var(--page-background)] text-slate-950 page-transition lg:h-screen lg:overflow-hidden">
      <Header />

      <main className="relative overflow-hidden bg-[var(--page-background)] lg:h-[calc(100vh-64px)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(147,70,245,0.035)_1px,transparent_1px),linear-gradient(rgba(147,70,245,0.035)_1px,transparent_1px)] bg-size-[36px_36px]" />

        <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-[71.5rem] grid-cols-1 items-center justify-items-center gap-8 px-5 py-8 sm:px-8 lg:h-full lg:min-h-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="w-full max-w-2xl">
            <h1 className="text-[2rem] font-black leading-tight text-slate-950 sm:text-[2.5rem] lg:text-[3.25rem]">
              Chào mừng bạn đến với{" "}
              <span className="text-[#9346F5]">RabbitCV</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-[17px]">
              Bắt đầu từ một bản CV rõ ràng, theo dõi các cơ hội đang mở và giữ
              mọi bước ứng tuyển trong cùng một nơi gọn gàng.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-[#9346F5]"
              >
                Tạo CV ngay
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/Jobs")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#9346F5]/40 hover:text-[#9346F5]"
              >
                Xem việc làm
                <BriefcaseIcon className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-8 grid max-w-[33.5rem] grid-cols-1 divide-y divide-slate-200 rounded-lg border border-white/80 bg-white/70 shadow-sm backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {highlights.map((item) => (
                <div key={item.label} className="px-3 py-3 text-center">
                  <dt className="text-xl font-black text-slate-950">
                    {item.value}
                  </dt>
                  <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto flex w-full max-w-[29.5rem] justify-center">
            <img
              alt="RabbitCV"
              src="/RabbitCV.png"
              className="h-84 w-84 object-contain"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default WelcomePage;
