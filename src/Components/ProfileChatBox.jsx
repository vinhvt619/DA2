import {
  BellIcon,
  BellSlashIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FlagIcon,
  InboxArrowDownIcon,
  MinusCircleIcon,
  PhotoIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";

export default function ProfileChatBox() {
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="h-full w-full bg-white flex flex-col items-center py-8 px-4 border-l border-gray-200">
      {/* Avatar Section */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-[#F4ECFF] flex items-center justify-center font-extrabold text-[#9346F5] text-2xl border border-purple-100">
          G
        </div>
        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>

      <h2 className="text-base font-extrabold text-gray-900 mt-4 text-center">
        Phòng nhóm chung
      </h2>
      <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
        Đang hoạt động
      </div>

      {/* Primary Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-[#F4ECFF] hover:text-[#9346F5] text-gray-600 w-16 cursor-pointer">
          <UserCircleIcon className="size-6" />
          <span className="text-[10px] font-bold">Cá nhân</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-[#F4ECFF] hover:text-[#9346F5] text-gray-600 w-16 cursor-pointer">
          <BellIcon className="size-6" />
          <span className="text-[10px] font-bold">Thông báo</span>
        </button>
      </div>

      {/* Accordion List */}
      <div className="w-full mt-8 space-y-3">
        {/* Accordion Item 1 */}
        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-bold text-sm text-gray-800 bg-gray-50 border border-gray-200 p-3 px-4 rounded-xl flex justify-between items-center hover:bg-[#F4ECFF] hover:text-[#9346F5] cursor-pointer"
            onClick={() => setShowChatInfo((prev) => !prev)}
          >
            <span>Thông tin về đoạn chat</span>
            <ChevronDownIcon
              className={`size-4 text-gray-400 ${showChatInfo ? "rotate-180" : ""}`}
            />
          </button>

          {showChatInfo && (
            <div className="w-[90%] border-x border-b border-gray-200 p-3 px-4 rounded-b-xl bg-gray-50/50 cursor-pointer hover:bg-gray-100 flex items-center gap-3">
              <InboxArrowDownIcon className="size-5 text-[#9346F5]" />
              <span className="text-sm font-semibold text-gray-700">
                Tin nhắn đã ghim
              </span>
            </div>
          )}
        </div>

        {/* Accordion Item 2 */}
        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-bold text-sm text-gray-800 bg-gray-50 border border-gray-200 p-3 px-4 rounded-xl flex justify-between items-center hover:bg-[#F4ECFF] hover:text-[#9346F5] cursor-pointer"
            onClick={() => setShowFile((prev) => !prev)}
          >
            <span>File phương tiện & file</span>
            <ChevronDownIcon
              className={`size-4 text-gray-400 ${showFile ? "rotate-180" : ""}`}
            />
          </button>

          {showFile && (
            <div className="w-[90%] flex flex-col border-x border-b border-gray-200 rounded-b-xl overflow-hidden">
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100">
                <PhotoIcon className="size-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  File phương tiện
                </span>
              </div>
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-center gap-3">
                <DocumentTextIcon className="size-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  File
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion Item 3 */}
        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-bold text-sm text-gray-800 bg-gray-50 border border-gray-200 p-3 px-4 rounded-xl flex justify-between items-center hover:bg-[#F4ECFF] hover:text-[#9346F5] cursor-pointer"
            onClick={() => setShowSupport((prev) => !prev)}
          >
            <span>Quyền riêng tư và hỗ trợ</span>
            <ChevronDownIcon
              className={`size-4 text-gray-400 ${showSupport ? "rotate-180" : ""}`}
            />
          </button>

          {showSupport && (
            <div className="w-[90%] flex flex-col border-x border-b border-gray-200 rounded-b-xl overflow-hidden">
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100">
                <BellSlashIcon className="size-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Tắt thông báo
                </span>
              </div>
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100">
                <ShieldCheckIcon className="size-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Quyền nhắn tin
                </span>
              </div>
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100">
                <MinusCircleIcon className="size-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Hạn chế
                </span>
              </div>
              <div className="p-3 px-4 bg-gray-50/50 hover:bg-gray-100 cursor-pointer flex items-start gap-3">
                <FlagIcon className="size-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700">
                    Báo cáo
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                    Đóng góp ý kiến & báo cáo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
