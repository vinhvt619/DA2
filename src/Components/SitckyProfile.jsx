import React from "react";
import { useLocation, Link } from "react-router-dom";
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
  { icon: DocumentTextIcon, label: "Công việc của tôi", href: "#" },
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

  const progress = Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4">
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-md overflow-hidden">
          <div className="relative h-16 bg-gradient-to-r from-violet-600 via-purple-500 to-violet-400">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
          </div>
          <div className="px-4 pb-4">
            <div className="relative -mt-6 mb-3">
              <div className="h-12 w-12 rounded-xl border-2 border-white bg-gradient-to-br from-violet-100 to-purple-100 shadow-md flex items-center justify-center">
                <span className="text-lg font-bold text-violet-700">
                  {initials}
                </span>
              </div>
            </div>

            <div className="text-sm font-bold text-slate-900">
              {currentUser?.fullName || currentUser?.username || "Người dùng"}
            </div>
            <div className="text-xs text-violet-600 font-medium mt-0.5">
              {currentUser?.experiences?.[0]?.position || "Chưa cập nhật"}
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                {currentUser?.address || currentUser?.hometown || "Chưa cập nhật"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <AcademicCapIcon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                {currentUser?.educations?.[0]?.school || "Chưa cập nhật"}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-600">
                  Hoàn thiện hồ sơ
                </span>
                <span className="text-[11px] font-bold text-violet-700">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Link
              to="/Profile"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#9346F5]/20 bg-violet-50 py-1.5 text-xs font-semibold text-[#9346F5] hover:bg-violet-100 shadow-sm hover:shadow-md transition-all"
            >
              Xem hồ sơ
            </Link>
          </div>
        </div>

        <nav className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-md space-y-0.5 p-3">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              currentPath === href ||
              (href !== "#" && currentPath.startsWith(href));
            return (
              <Link
                key={label}
                to={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-1 ${
                  isActive
                    ? "bg-[#9346F5]/10 text-[#9346F5] font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-violet-50/80 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[#9346F5]" : "text-gray-500"}`}
                />
                {label}
              </Link>
            );
          })}
          <div className="border-t border-gray-100 mt-1" />
        </nav>

        <Terms />
      </div>
    </aside>
  );
}
