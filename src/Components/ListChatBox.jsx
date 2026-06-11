import React from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

export default function ListChatBox({ name, chat, hour, choose }) {
  // Lấy 2 chữ cái đầu để làm avatar
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-xl p-3 border ${
        choose
          ? "bg-[#F4ECFF] border-purple-200"
          : "bg-transparent border-transparent hover:bg-gray-50"
      }`}
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold border ${
              choose
                ? "bg-[#9346F5] text-white border-[#9346F5]"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {initials}
          </div>
          {choose && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`truncate text-sm font-bold ${
                choose ? "text-purple-950" : "text-gray-900"
              }`}
            >
              {name}
            </span>
            <span
              className={`shrink-0 text-[10px] font-bold ${
                choose ? "text-[#9346F5]" : "text-gray-400"
              }`}
            >
              {hour}
            </span>
          </div>
          <p
            className={`truncate text-xs ${
              choose ? "text-purple-800 font-semibold" : "text-gray-500"
            }`}
          >
            {chat}
          </p>
        </div>
      </div>

      <div
        className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pl-2 ${
          choose ? "bg-[#F4ECFF]" : "bg-gray-50"
        }`}
      >
        <button
          className={`flex items-center justify-center p-1.5 rounded-lg border cursor-pointer ${
            choose
              ? "text-[#9346F5] bg-white border-purple-200 hover:bg-purple-100"
              : "text-gray-500 bg-white border-gray-200 hover:bg-gray-100"
          }`}
        >
          <EllipsisHorizontalIcon className="size-4 stroke-[2.5px]" />
        </button>
      </div>
    </div>
  );
}
