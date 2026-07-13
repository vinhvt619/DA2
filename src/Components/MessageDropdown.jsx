import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MessageDropdown({ toggleMenu }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch("/api/chat/threads", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setThreads(data);
        }
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const handleThreadClick = (room) => {
    toggleMenu("");
    // We could pass room state, but Message.jsx currently doesn't read state from router, it handles activeRoom itself
    navigate("/Message");
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-gray-200 bg-white shadow-sm z-50 overflow-hidden">
      <div className="p-2 border-b border-gray-200 flex justify-between items-center">
        <p className="text-sm font-bold text-gray-800">Tin nhắn gần nhất</p>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          threads.map((thread) => {
            const displayName = thread.partner ? thread.partner.name : "Phòng nhóm chung";
            
            return (
              <div
                key={thread.room}
                className="p-4 hover:bg-violet-50/20 transition-colors border-b border-gray-50 cursor-pointer relative group"
                onClick={() => handleThreadClick(thread.room)}
              >
                <div className="pl-1">
                  <h4 className="text-sm font-medium text-gray-700">
                    {displayName}
                  </h4>
                  <p className="text-[13px] mt-0.5 leading-relaxed text-gray-500 truncate">
                    {thread.lastMessage || "Chưa có tin nhắn"}
                  </p>
                  <span className="text-[11px] text-gray-400 font-medium mt-1.5 block">
                    {thread.lastMessageAt ? formatTime(thread.lastMessageAt) : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        className="border-t border-gray-200 p-3 text-center text-[13px] font-semibold text-[#9346F5] cursor-pointer hover:bg-violet-50 transition-colors"
        onClick={() => {
          toggleMenu("");
          navigate("/Message");
        }}
      >
        Xem tất cả tin nhắn
      </div>
    </div>
  );
}
