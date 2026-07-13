import React, { useState, useRef, useEffect } from "react";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ListChatBox({ room, name, chat, hour, choose, onHideChat }) {
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
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg p-2.5 transition-colors ${
        choose
          ? "bg-violet-50/75"
          : "bg-transparent hover:bg-gray-50"
      }`}
    >
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
              choose
                ? "bg-violet-600 text-white"
                : "bg-gray-150 text-gray-500"
            }`}
          >
            {initials}
          </div>
          {choose && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white bg-green-500"></div>
          )}
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <span
              className={`truncate text-xs font-semibold ${
                choose ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {name}
            </span>
            <span className="shrink-0 text-[10px] text-gray-400 font-medium">
              {hour}
            </span>
          </div>
          <p
            className={`truncate text-[11px] ${
              choose ? "text-violet-700 font-semibold" : "text-gray-500"
            }`}
          >
            {chat}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pl-1.5 bg-inherit flex items-center gap-1" ref={menuRef}>
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
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-50">
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
