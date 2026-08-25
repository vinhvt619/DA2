import { useEffect, useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../utils/dateTime.js";

export default function MessageDropdown({ toggleMenu, hasNewMessage }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch("/api/chat/threads", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          // Nhóm chung không phải là cuộc trò chuyện cá nhân, nên không hiển thị
          // trong danh sách rút gọn ở header.
          setThreads(data.filter((thread) => thread?.room?.startsWith("private_")));
        }
      } catch (error) {
        console.error("Lỗi tải tin nhắn:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const openInbox = () => {
    toggleMenu("");
    navigate("/Message");
  };

  const getInitials = (name) => name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      role="menu"
      aria-label="Tin nhắn gần nhất"
      className="absolute right-0 mt-2 w-[min(270px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-violet-100 bg-white p-2 shadow-[0_14px_36px_rgba(76,29,149,0.14)]"
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <h3 className="text-[13px] font-bold text-slate-900">Tin nhắn</h3>
        {hasNewMessage && (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">Có tin mới</span>
        )}
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-lg">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          </div>
        ) : threads.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-violet-300" />
            <p className="mt-2 text-[13px] font-semibold text-slate-700">Chưa có tin nhắn</p>
            <p className="mt-1 text-xs text-slate-500">Cuộc trò chuyện mới sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          threads.slice(0, 4).map((thread, index) => {
            const displayName = thread.partner?.name || thread.senderName || "Tài khoản";
            const isLatest = hasNewMessage && index === 0;

            return (
              <button
                key={thread.room}
                type="button"
                role="menuitem"
                onClick={openInbox}
                className={`flex w-full gap-2.5 border-t border-slate-100 px-2 py-2.5 text-left transition first:border-t-0 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${isLatest ? "bg-violet-50/70" : "bg-white"}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                  {getInitials(displayName) || "RC"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className={`line-clamp-1 flex-1 text-[13px] ${isLatest ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                      {displayName}
                    </span>
                    {isLatest && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{thread.lastMessage || "Chưa có tin nhắn"}</span>
                  <span className="mt-1 block text-[10px] font-medium text-violet-600">
                    {thread.lastMessageAt ? formatDateTime(thread.lastMessageAt, "HH:mm dd/MM") : ""}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={openInbox}
        className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-violet-600 text-[11px] font-bold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      >
        Mở hộp thư
      </button>
    </div>
  );
}
