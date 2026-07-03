import "../App.css";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  NewspaperIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect } from "react";
import Header from "../Components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const highlights = [
  { value: "05", label: "mẫu CV nổi bật" },
  { value: "12+", label: "gợi ý tối ưu" },
  { value: "24h", label: "sẵn sàng ứng tuyển" },
];

function WelcomePage() {
  const navigate = useNavigate();
  const { currentUser, isAuthChecked } = useAuth();

  useEffect(() => {
    if (isAuthChecked && currentUser) {
      if (currentUser.role === "admin") {
        navigate("/AdminDashboard");
      } else if (currentUser.role === "company") {
        navigate("/CompanyDashboard");
      }
    }
  }, [currentUser, isAuthChecked, navigate]);

  return (
    <div className="w-full min-h-screen bg-[#F8F4FC] text-slate-950 page-transition">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.05)_1px,transparent_1px)] bg-size-[36px_36px]" />
        <div className="absolute inset-0 bg-linear-to-br from-white/85 via-[#F8F4FC]/80 to-[#E6D8FA]/85" />

        <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Chào mừng bạn trở lại với{" "}
              <span className="text-[#9346F5]">RabbitCV</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Bắt đầu từ một bản CV rõ ràng, theo dõi các cơ hội đang mở và giữ
              mọi bước ứng tuyển trong cùng một nơi gọn gàng.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/ResumeSelection")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-[#9346F5]"
              >
                Tạo CV ngay
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate("/MainMenu")}
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
          {/* <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-4 top-8 hidden h-24 w-1 rounded-full bg-emerald-400 lg:block" />
          <div className="absolute -right-4 bottom-10 hidden h-24 w-1 rounded-full bg-amber-400 lg:block" />

          <div className="rounded-lg border border-white/80 bg-white p-5 shadow-2xl shadow-[#7C3AED]/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9346F5]">
                    CV preview
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Frontend Developer
                  </h2>
                </div>
                <img
                  alt="RabbitCV"
                  src="../RabbitCV.png"
                  className="h-14 w-14 object-contain"
                />
              </div>

              <div className="grid gap-5 py-5 sm:grid-cols-[0.8fr_1.2fr]">
                <div className="border-b border-slate-100 pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
                  <div className="h-24 w-24 rounded-lg bg-[#F5EEFF]" />
                  <div className="mt-5 space-y-3">
                    <div className="h-2.5 w-28 rounded-full bg-slate-900" />
                    <div className="h-2 w-20 rounded-full bg-slate-200" />
                    <div className="h-2 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["React", "UI", "CV"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                      Hồ sơ đã sẵn sàng
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 rounded-full bg-slate-200" />
                      <div className="h-2.5 w-11/12 rounded-full bg-slate-200" />
                      <div className="h-2.5 w-8/12 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 p-3">
                      <ClockIcon className="h-5 w-5 text-amber-500" />
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Cập nhật
                      </p>
                      <p className="text-sm font-black text-slate-950">
                        Hôm nay
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <ChartBarIcon className="h-5 w-5 text-[#9346F5]" />
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Độ hoàn thiện
                      </p>
                      <p className="text-sm font-black text-slate-950">86%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-4">
                {steps.map((step, index) => (
                  <div key={step} className="min-w-0">
                    <div
                      className={`h-1.5 rounded-full ${
                        index < 3 ? "bg-[#9346F5]" : "bg-slate-200"
                      }`}
                    />
                    <p className="mt-2 text-xs font-bold leading-4 text-slate-600">
                      {step}
                    </p>
                  </div>
                ))}
              </div> */}
          {/* </div> */}
          {/* </div> */}
        </section>
      </main>
    </div>
  );
}

export default WelcomePage;
