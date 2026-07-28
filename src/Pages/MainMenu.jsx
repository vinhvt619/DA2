import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalculatorIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getProfileCompletion } from "../utils/profileCompletion.js";

const articles = [
  ["Xu hướng tuyển dụng ngành IT nửa cuối năm 2024", "2 giờ trước"],
  ["Cách viết mục tiêu nghề nghiệp ghi điểm với nhà tuyển dụng", "Hôm qua"],
];

function FeatureCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-[135px] rounded-xl border border-slate-200 bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_10px_24px_rgba(88,28,135,0.12)]"
    >
      <span className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100 transition group-hover:bg-violet-600 group-hover:text-white">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h2 className="text-[15px] font-extrabold tracking-[-0.2px] text-slate-950">{title}</h2>
      <p className="mt-1 text-[11px] leading-4 text-slate-600">{description}</p>
    </button>
  );
}

export default function MainMenu() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const goToResume = () => navigate(currentUser ? "/ResumeSelection" : "/login");
  const displayName = currentUser?.fullName || currentUser?.username || "Khách RabbitCV";
  const completion = getProfileCompletion(currentUser);

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-950 page-transition">
      <Header />

      <main className="mx-auto max-w-[990px] px-4 pb-10 pt-5 sm:px-[18px] lg:px-5">
        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_175px] xl:grid-cols-[minmax(0,1fr)_190px]">
          <div>
            <h1 className="max-w-[490px] text-[27px] font-black leading-[1.1] tracking-[-0.8px] text-slate-950 sm:text-[31px] lg:text-[34px]">
              Khám phá các tính năng của RabbitCV
            </h1>
            <p className="mt-2.5 max-w-[540px] text-[12px] leading-5 text-slate-600">
              Xây dựng sự nghiệp vững chắc với các công cụ thông minh từ RabbitCV. Tạo CV ấn tượng,
              tìm kiếm cơ hội phù hợp và theo dõi sự phát triển nghề nghiệp của bạn.
            </p>
          </div>
          <div className="mx-auto flex h-[130px] w-[130px] items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)] lg:mr-0">
            <img src="/RabbitCV.png" alt="Logo RabbitCV" className="h-24 w-24 object-contain" />
          </div>
        </section>

        <section className="mt-9 grid gap-3.5 xl:grid-cols-[minmax(0,2.08fr)_minmax(245px,1fr)]">
          <div className="space-y-4">
            <button
              type="button"
              onClick={goToResume}
              className="group relative flex min-h-[137px] w-full overflow-hidden rounded-xl border border-violet-200 bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_12px_28px_rgba(109,40,217,0.14)]"
            >
              <span className="mr-3.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[0_8px_18px_rgba(109,40,217,0.22)]">
                <DocumentTextIcon className="h-6 w-6" />
              </span>
              <span className="relative z-10 block max-w-[680px]">
                <span className="block text-[16px] font-extrabold tracking-[-0.2px] text-slate-950">Tạo CV chuyên nghiệp</span>
                <span className="mt-1 block text-[11px] leading-[18px] text-slate-600">
                  Sử dụng sức mạnh của AI để xây dựng hồ sơ nổi bật. Hàng chục mẫu CV chuẩn ATS,
                  gợi ý nội dung thông minh và tùy chỉnh dễ dàng.
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700">
                  Bắt đầu ngay <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </span>
              <DocumentTextIcon className="absolute -bottom-2 right-3 h-24 w-24 text-violet-100" />
            </button>

            <div className="grid gap-4 md:grid-cols-2">
              <FeatureCard
                icon={BriefcaseIcon}
                title="Tìm việc làm"
                description="Khám phá hàng ngàn cơ hội việc làm được chọn lọc. Lọc theo kỹ năng, mức lương và địa điểm."
                onClick={() => navigate("/Jobs")}
              />
              <FeatureCard
                icon={ChartBarIcon}
                title="Bảng xếp hạng CV"
                description="Phân tích cạnh tranh và xem vị trí CV của bạn trong thị trường lao động thực tế."
                onClick={() => navigate("/TopPage")}
              />
            </div>
          </div>

          <aside className="space-y-3.5">
            <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-white via-white to-violet-50 p-3.5 text-slate-950 shadow-[0_8px_22px_rgba(76,29,149,0.08)]">
              <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 ring-1 ring-violet-200">
                  <UserCircleIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-black leading-5 tracking-[-0.2px]">{displayName}</h2>
                  <p className={`flex items-center gap-1 text-[9px] font-bold ${currentUser ? "text-emerald-600" : "text-slate-500"}`}>
                    <CheckCircleIcon className="h-4 w-4" />
                    {currentUser ? "Đã cập nhật" : "Chưa đăng nhập"}
                  </p>
                </div>
              </div>
              <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-600">
                <span>Độ hoàn thiện:</span><strong className="text-violet-700">{completion}%</strong>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-violet-100">
                <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${completion}%` }} />
              </div>
              <button
                type="button"
                onClick={() => navigate(currentUser ? "/PersonalInformation" : "/login")}
                className="mt-3.5 w-full rounded-lg border border-violet-200 bg-white py-1.5 text-[10px] font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
              >
                {currentUser ? "Quản lý hồ sơ" : "Đăng nhập để quản lý hồ sơ"}
              </button>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <h2 className="text-[14px] font-extrabold text-slate-950">Công cụ bổ trợ</h2>
              <div className="mt-2.5 space-y-2.5 text-[10px] text-slate-600">
                <button type="button" onClick={goToResume} className="flex items-center gap-3 transition hover:text-violet-700"><DocumentPlusIcon className="h-5 w-5 text-violet-600" /> Tạo Cover Letter</button>
                <button type="button" onClick={() => navigate("/News")} className="flex items-center gap-3 transition hover:text-violet-700"><UserGroupIcon className="h-5 w-5 text-violet-600" /> Mẹo phỏng vấn</button>
                <button type="button" onClick={() => navigate("/News")} className="flex items-center gap-3 transition hover:text-violet-700"><CalculatorIcon className="h-5 w-5 text-violet-600" /> Tính lương Gross/Net</button>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[14px] font-extrabold text-slate-950">Tin tức &amp; Xu hướng</h2>
                <Link to="/News" className="shrink-0 text-[9px] font-semibold text-violet-700 hover:underline">Xem tất cả</Link>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {articles.map(([title, time]) => (
                  <Link key={title} to="/News" className="block py-4 first:pt-1 text-slate-800 hover:text-violet-700">
                    <span className="block text-[10px] leading-4">{title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{time}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
