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
    <div className="w-full min-h-screen bg-[#F8F4FC] text-slate-950 page-transition">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.05)_1px,transparent_1px)] bg-size-[36px_36px]" />
        <div className="absolute inset-0 bg-linear-to-br from-white/85 via-[#F8F4FC]/80 to-[#E6D8FA]/85" />

        <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Chào mừng bạn đến với{" "}
              <span className="text-[#9346F5]">RabbitCV</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Bắt đầu từ một bản CV rõ ràng, theo dõi các cơ hội đang mở và giữ
              mọi bước ứng tuyển trong cùng một nơi gọn gàng.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-[#9346F5]"
              >
                Tạo CV ngay
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("/Jobs")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-6 py-3 text-sm font-bold text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#9346F5]/40 hover:text-[#9346F5]"
              >
                Xem việc làm
                <BriefcaseIcon className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-1 divide-y divide-slate-200 rounded-lg border border-white/80 bg-white/70 shadow-sm backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {highlights.map((item) => (
                <div key={item.label} className="px-4 py-4 text-center">
                  <dt className="text-2xl font-black text-slate-950">
                    {item.value}
                  </dt>
                  <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl ml-5 flex justify-center">
            <img
              alt="RabbitCV"
              src="/RabbitCV.png"
              className="h-96 w-96 object-contain"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default WelcomePage;
