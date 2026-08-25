import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";

export default function ListChatBox({ room, name, role, chat, hour, choose, onHideChat }) {
  const confirmDialog = useConfirmDialog();
  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const handleHideChat = async () => {
    if (
      await confirmDialog(
        "Bạn có chắc chắn muốn ẩn/xóa đoạn chat này khỏi danh sách?",
      )
    ) {
      onHideChat(room);
    }
  };

  return (
    <div
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all ${
        choose ? "bg-violet-50" : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
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
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className={`truncate text-xs font-semibold ${choose ? "text-slate-900" : "text-slate-700"}`}>
            {name}
          </span>
          {role && (
            <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {role === "company" ? "Doanh nghiệp" : "Ứng viên"}
            </span>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <p className={`min-w-0 truncate text-[11px] ${choose ? "font-semibold text-violet-700" : "text-gray-500"}`}>
              {chat}
            </p>
            <span className="shrink-0 text-[10px] font-medium text-gray-400">{hour}</span>
          </div>
        </div>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Tùy chọn cuộc trò chuyện với ${name}`}
            className={`absolute right-2 top-2 flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 ${
              choose ? "bg-violet-50" : "bg-white"
            }`}
          >
            <EllipsisHorizontalIcon className="size-3.5 stroke-2" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={5}
            className="z-[1000] w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-md"
          >
            {room !== "general" && onHideChat ? (
              <DropdownMenu.Item
                onSelect={() => void handleHideChat()}
                className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-red-600 outline-none data-[highlighted]:bg-red-50"
              >
                <TrashIcon className="size-3.5 stroke-2" />
                Xóa đoạn chat
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item disabled className="px-3 py-2 text-center text-xs font-medium text-gray-400">
                Không có tùy chọn
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
