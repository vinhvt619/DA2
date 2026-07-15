import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BriefcaseIcon,
  BookmarkIcon,
  MapPinIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Terms from "./TermOfUse";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { icon: BriefcaseIcon, label: "Tìm công việc", href: "/MainMenu" },
  { icon: DocumentTextIcon, label: "Công việc của tôi", href: "/AllJobs" },
  { icon: BookmarkIcon, label: "Đã lưu", href: "/saved-jobs" },
  { icon: Cog6ToothIcon, label: "Cài đặt", href: "/SettingAndPrivate" },
];

export default function StickyProfile() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const initials = (currentUser?.fullName || currentUser?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fields = [
    currentUser?.fullName,
    currentUser?.experiences?.[0]?.position,
    currentUser?.address || currentUser?.hometown,
    currentUser?.phoneNumber,
    currentUser?.educations?.length > 0,
    currentUser?.experiences?.length > 0,
  ];

  const progress = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <aside className="w-full shrink-0">
      <div className="space-y-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-[13px] font-semibold text-slate-950">
                {currentUser?.fullName || currentUser?.username || "Người dùng"}
              </div>
              <div className="mt-0.5 truncate text-[10px] font-medium text-violet-700">
                {currentUser?.experiences?.[0]?.position || (
                  <Link to="/Profile" className="text-violet-500 hover:text-violet-700">
                    + Thêm vị trí
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3.5 text-left">
              <div className="flex items-start gap-2 text-[10px] leading-4 text-slate-600">
                <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="line-clamp-2">
                {currentUser?.address || currentUser?.hometown || (
                  <Link to="/Profile" className="text-violet-500 hover:text-violet-700">
                    + Thêm địa chỉ
                  </Link>
                )}
                </span>
              </div>
              <div className="flex items-start gap-2 text-[10px] leading-4 text-slate-600">
                <AcademicCapIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="line-clamp-2">
                {currentUser?.educations?.[0]?.school || (
                  <Link to="/Profile" className="text-violet-500 hover:text-violet-700">
                    + Thêm học vấn
                  </Link>
                )}
                </span>
              </div>
          </div>

          <div className="mt-3.5 text-left">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Hoàn thiện hồ sơ</span>
              <span className="text-[10px] font-semibold text-violet-700">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Link
            to="/Profile"
            className="mt-3 inline-flex items-center text-[11px] font-semibold text-violet-700 transition hover:text-violet-900 focus:outline-none"
          >
            Xem hồ sơ →
          </Link>
        </section>

        <nav className="space-y-0.5 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              currentPath === href ||
              (href !== "#" && currentPath.startsWith(href));
            return (
              <Link
                key={label}
                to={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-9 items-center gap-2.5 border-l-2 px-3 text-[11px] font-medium transition ${
                  isActive
                    ? "border-violet-600 bg-violet-50/70 font-semibold text-violet-700"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-violet-600" : "text-slate-500"}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <Terms />
      </div>
    </aside>
  );
}
