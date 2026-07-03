import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  BriefcaseIcon,
  UserIcon,
  BookmarkIcon,
  MapPinIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Terms from "./TermOfUse";

const navItems = [
  { icon: BriefcaseIcon, label: "Tìm công việc", href: "/MainMenu" },
  { icon: DocumentTextIcon, label: "Công việc của tôi", href: "#" },
  { icon: BookmarkIcon, label: "Đã lưu", href: "/saved-jobs" },
  { icon: Cog6ToothIcon, label: "Cài đặt", href: "/SettingAndPrivate" },
];

export default function StickyProfile() {
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-14 bg-violet-500 border-b border-violet-300" />
          <div className="px-4 pb-4">
            <div className="relative -mt-6 mb-3">
              <div className="h-15 w-15 rounded-xl border-2 border-white bg-violet-100 flex items-center justify-center shadow-md">
                <UserIcon className="h-6 w-6 text-violet-700" />
              </div>
            </div>

            <div className="text-sm font-semibold text-gray-900">
              Nguyễn Thành Vinh
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Software Engineer
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                Hồ Chí Minh, Việt Nam
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <AcademicCapIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                ĐH Bách Khoa HCM
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-600">
                  Hoàn thiện hồ sơ
                </span>
                <span className="text-[11px] font-semibold text-violet-800">
                  72%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-violet-200">
                <div
                  className="h-full rounded-full bg-violet-700"
                  style={{ width: "72%" }}
                />
              </div>
            </div>

            <Link
              to="/Profile"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#9346F5]/20 bg-violet-50 py-1.5 text-xs font-semibold text-[#9346F5] hover:bg-violet-100 transition-colors"
            >
              Xem hồ sơ
            </Link>
          </div>
        </div>

        <nav className="rounded-xl border border-gray-200 bg-white shadow-sm space-y-0.5 p-2 pt-4 px-4">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              currentPath === href ||
              (href !== "#" && currentPath.startsWith(href));
            return (
              <Link
                key={label}
                to={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-2.5 ${
                  isActive
                    ? "bg-[#9346F5]/10 text-[#9346F5] font-semibold"
                    : "text-gray-700 hover:bg-violet-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[#9346F5]" : "text-gray-500"}`}
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
