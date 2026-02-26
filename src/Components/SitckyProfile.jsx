import React from "react";
import StickyBox from "react-sticky-box";
import {
  BriefcaseIcon,
  UserIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import Terms from "./TermOfUse";
export default function StickyProfile() {
  return (
    <StickyBox className="w-64 shrink-0">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden group">
          <div className="h-16 bg-[#FFD8D8] border-b-2 border-black relative">
            <div className="absolute -bottom-5 left-6 h-14 w-14 bg-white rounded-full border-2 border-black p-1">
              <div className="h-full w-full bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="pt-8 pb-5 px-6">
            <div className="mb-3">
              <h3 className="font-bold text-base text-gray-800 leading-tight">
                Nguyễn Thành Vinh
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 font-medium">
                Software Engineer. I&apos;m looking for a job.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3 font-bold">
              <span className="fi fi-vn rounded-xs"></span>
              <span>Ho Chi Minh City, VN</span>
            </div>

            <div className="text-[10px] font-bold text-[#9346F5] bg-[#9346F5]/5 px-2 py-1 rounded-md border border-[#9346F5]/20 inline-block">
              Đại học Bách Khoa HCM
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="bg-white rounded-2xl border-2 border-black p-2 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-[#9346F5]/5 hover:text-[#9346F5] transition-all group font-bold text-xs"
          >
            <BriefcaseIcon className="w-4 h-4 text-gray-400 group-hover:text-[#9346F5]" />
            <span>Tìm công việc</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-[#9346F5]/5 hover:text-[#9346F5] transition-all group font-bold text-xs"
          >
            <UserIcon className="w-4 h-4 text-gray-400 group-hover:text-[#9346F5]" />
            <span>Công việc của tôi</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-[#9346F5]/5 hover:text-[#9346F5] transition-all group font-bold text-xs"
          >
            <BookmarkIcon className="w-4 h-4 text-gray-400 group-hover:text-[#9346F5]" />
            <span>Ưa thích</span>
          </a>
        </nav>

        <Terms />
      </div>
    </StickyBox>
  );
}
