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
import { useNavigate } from "react-router-dom";

export default function ProfileChatBox({ activeRoom = "general", partner }) {
  const navigate = useNavigate();
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const isGeneral = activeRoom === "general";
  const name = isGeneral ? "Phòng nhóm chung" : (partner?.name || "Đang tải...");
  const roleText = isGeneral
    ? "Phòng chung công khai"
    : partner?.role === "company"
      ? "Doanh nghiệp"
      : "Ứng viên";

  return (
    <div className="h-full w-full bg-white flex flex-col items-center py-6 px-4 border-l border-gray-150">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-violet-50 flex items-center justify-center font-bold text-violet-600 text-xl border border-violet-100">
          {name.substring(0, 2).toUpperCase()}
        </div>
        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white"></div>
      </div>

      <h2 className="text-sm font-bold text-gray-900 mt-3 text-center">
        {name}
      </h2>
      <div className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
        {roleText}
      </div>

      <div className="flex gap-3 mt-5 w-full justify-center">
        <button
          onClick={() => {
            if (!isGeneral && partner?.id) {
              navigate(`/user-profile/${partner.id}`);
            } else {
              navigate("/Profile");
            }
          }}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
        >
          <UserCircleIcon className="size-4 text-gray-400" />
          Cá nhân
        </button>
        <button className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-100">
          <BellIcon className="size-4 text-gray-400" />
          Thông báo
        </button>
      </div>

      <div className="w-full mt-6 space-y-2">
        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-semibold text-xs text-gray-700 bg-gray-50 border border-gray-200 p-2.5 px-3 rounded-lg flex justify-between items-center hover:bg-gray-100 cursor-pointer"
            onClick={() => setShowChatInfo((prev) => !prev)}
          >
            <span>Thông tin về đoạn chat</span>
            <ChevronDownIcon
              className={`size-3.5 text-gray-400 transition-transform ${showChatInfo ? "rotate-180" : ""}`}
            />
          </button>

          {showChatInfo && (
            <div className="w-[95%] border-x border-b border-gray-200 p-2.5 px-3 rounded-b-lg bg-gray-50/30 flex items-center gap-2">
              <InboxArrowDownIcon className="size-4 text-violet-600" />
              <span className="text-xs text-gray-600 font-medium">
                Tin nhắn đã ghim
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-semibold text-xs text-gray-700 bg-gray-50 border border-gray-200 p-2.5 px-3 rounded-lg flex justify-between items-center hover:bg-gray-100 cursor-pointer"
            onClick={() => setShowFile((prev) => !prev)}
          >
            <span>File phương tiện & file</span>
            <ChevronDownIcon
              className={`size-3.5 text-gray-400 transition-transform ${showFile ? "rotate-180" : ""}`}
            />
          </button>

          {showFile && (
            <div className="w-[95%] flex flex-col border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-center gap-2 border-b border-gray-100">
                <PhotoIcon className="size-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  File phương tiện
                </span>
              </div>
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-center gap-2">
                <DocumentTextIcon className="size-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  File
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center w-full">
          <button
            className="w-full font-semibold text-xs text-gray-700 bg-gray-50 border border-gray-200 p-2.5 px-3 rounded-lg flex justify-between items-center hover:bg-gray-100 cursor-pointer"
            onClick={() => setShowSupport((prev) => !prev)}
          >
            <span>Quyền riêng tư và hỗ trợ</span>
            <ChevronDownIcon
              className={`size-3.5 text-gray-400 transition-transform ${showSupport ? "rotate-180" : ""}`}
            />
          </button>

          {showSupport && (
            <div className="w-[95%] flex flex-col border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-center gap-2 border-b border-gray-100">
                <BellSlashIcon className="size-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Tắt thông báo
                </span>
              </div>
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-center gap-2 border-b border-gray-100">
                <ShieldCheckIcon className="size-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Quyền nhắn tin
                </span>
              </div>
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-center gap-2 border-b border-gray-100">
                <MinusCircleIcon className="size-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Hạn chế
                </span>
              </div>
              <div className="p-2.5 px-3 bg-gray-50/30 hover:bg-gray-100/50 cursor-pointer flex items-start gap-2">
                <FlagIcon className="size-4 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-650 font-medium">
                    Báo cáo
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium mt-0.5">
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
