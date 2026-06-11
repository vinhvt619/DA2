import React from "react";
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
  { icon: BriefcaseIcon, label: "Tìm công việc", href: "#", active: true },
  { icon: DocumentTextIcon, label: "Công việc của tôi", href: "#" },
  { icon: BookmarkIcon, label: "Đã lưu", href: "#" },
  { icon: Cog6ToothIcon, label: "Cài đặt", href: "/SettingAndPrivate" },
];

export default function StickyProfile() {
  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-14 bg-linear-to-r from-[#9346F5] to-[#f472b6]" />
          <div className="px-4 pb-4">
            <div className="relative -mt-6 mb-3">
              <div className="h-15 w-15 rounded-xl border-2 border-white bg-linear-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center shadow-md shadow-violet-200/50">
                <UserIcon className="h-6 w-6 text-violet-400" />
              </div>
            </div>

            <div className="text-sm font-semibold text-gray-900">Nguyễn Thành Vinh</div>
            <div className="text-xs text-gray-500 mt-0.5">Software Engineer</div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                Hồ Chí Minh, Việt Nam
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <AcademicCapIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                ĐH Bách Khoa HCM
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-500">Hoàn thiện hồ sơ</span>
                <span className="text-[11px] font-semibold text-violet-600">72%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-linear-to-r from-[#9346F5] to-[#d946ef] shadow-xs shadow-fuchsia-400/50" style={{ width: "72%" }} />
              </div>
            </div>

            <a
              href="/Profile"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/50 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              Xem hồ sơ
            </a>
          </div>
        </div>

        <nav className="rounded-xl border border-slate-200 bg-white shadow-sm space-y-0.5 p-2 pt-4 px-4">
          {navItems.map(({ icon: Icon, label, href, active }) => (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors mb-2.5 ${
                active
                  ? "bg-linear-to-r from-[#9346F5]/10 to-[#d946ef]/10 text-[#9346F5] font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-[#9346F5]" : "text-slate-400"}`} />
              {label}
            </a>
          ))}
        </nav>

        <Terms />
      </div>
    </aside>
  );
}
