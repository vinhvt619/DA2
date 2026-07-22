import React, { useState, useRef, useEffect } from "react";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ListChatBox({ room, name, role, chat, hour, choose, onHideChat }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all ${showMenu ? "z-30" : "z-0"} ${
        choose
          ? "bg-violet-50"
          : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
              choose
                ? "bg-violet-600 text-white"
                : "border border-violet-100 bg-violet-50 text-violet-700"
            }`}
          >
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></div>
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <div className="mb-0.5 flex items-center gap-1.5">
            <span
              className={`truncate text-xs font-semibold ${
                choose ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {name}
            </span>
          </div>
          {role && (
            <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {role === "company" ? "Doanh nghiệp" : "Ứng viên"}
            </span>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`min-w-0 truncate text-[11px] ${
                choose ? "font-semibold text-violet-700" : "text-gray-500"
              }`}
            >
              {chat}
            </p>
            <span className="shrink-0 text-[10px] font-medium text-gray-400">
              {hour}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`absolute right-2 top-2 flex items-center gap-1 pl-1.5 ${choose || showMenu ? "bg-violet-50" : "bg-white"}`}
        ref={menuRef}
      >
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`flex items-center justify-center p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 cursor-pointer`}
          >
            <EllipsisHorizontalIcon className="size-3.5 stroke-[2px]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-md">
              {room !== "general" && onHideChat ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (window.confirm("Bạn có chắc chắn muốn ẩn/xóa đoạn chat này khỏi danh sách?")) {
                      onHideChat(room);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                >
                  <TrashIcon className="size-3.5 stroke-[2px]" />
                  Xóa đoạn chat
                </button>
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400 font-medium text-center">
                  Không có tuỳ chọn
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
