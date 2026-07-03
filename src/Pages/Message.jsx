import "../App.css";
import React, { useEffect, useState, useCallback } from "react";
import Header from "../Components/Header.jsx";
import ShowMenuChatHook from "../hooks/ShowMenuChatBoxHook.jsx";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ListChatBox from "../Components/ListChatBox.jsx";
import ChatBox from "../Components/ChatBox.jsx";
import ProfileChatBox from "../Components/ProfileChatBox.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Messenger() {
  const navigate = useNavigate();
  const { openMenu, toggleMenu } = ShowMenuChatHook(true);
  const [openSettingChat, setOpenSettingChat] = useState(false);
  
  const { currentUser, isAuthChecked } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [allUsers, setAllUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'unread', 'group'

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/threads", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Lỗi tải cuộc trò chuyện:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách người dùng:", err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchThreads();
    fetchUsers();
  }, [currentUser, isAuthChecked, fetchThreads, fetchUsers, navigate]);

  const handleStartPrivateChat = (partner) => {
    if (!currentUser) return;
    const room = [currentUser._id, partner._id].sort().join("_");
    const privateRoomId = `private_${room}`;
    setActiveRoom(privateRoomId);
    setSearchKeyword("");
    
    // Add temporary thread if not exists so it shows up selected immediately
    if (!threads.some((t) => t.room === privateRoomId)) {
      setThreads((prev) => [
        {
          room: privateRoomId,
          lastMessage: "Bắt đầu cuộc trò chuyện mới...",
          lastMessageAt: new Date(),
          senderName: "",
          senderId: "",
          partner: {
            id: partner._id,
            name: partner.fullName || partner.username,
            role: partner.role,
          },
        },
        ...prev,
      ]);
    }
  };

  const filteredSearchResults = searchKeyword.trim()
    ? allUsers.filter((user) => {
        const name = (user.fullName || user.username || "").toLowerCase();
        return name.includes(searchKeyword.toLowerCase());
      })
    : [];

  const activeThread = threads.find((t) => t.room === activeRoom);

  const displayThreads = threads.filter((t) => {
    if (activeFilter === "group") {
      return t.room === "general";
    }
    return true;
  });

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] h-screen flex flex-col font-sans overflow-hidden text-slate-900 text-sm page-transition">
      <Header />

      <div className="flex flex-1 items-start h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-4 gap-4 overflow-hidden">
        <div className="border border-gray-200 w-[320px] bg-white rounded-xl flex flex-col h-full shadow-sm shrink-0 overflow-hidden relative">
          <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
            <h1 className="font-bold text-lg text-gray-900">
              Đoạn chat
            </h1>
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg p-1.5 cursor-pointer border border-gray-200"
                type="button"
                onClick={() => setOpenSettingChat(!openSettingChat)}
              >
                <EllipsisHorizontalIcon className="size-4.5" />
              </button>
              
              {openSettingChat && (
                <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-50">
                  <button className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 font-semibold">
                    Cài đặt đoạn chat
                  </button>
                  <button className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 font-semibold border-t border-gray-50">
                    Trợ giúp & Hỗ trợ
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 mb-3 relative">
            <MagnifyingGlassIcon className="size-4.5 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm tài khoản thực..."
              className="bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs w-full outline-none focus:border-violet-400 focus:bg-white font-medium placeholder:text-gray-400 text-gray-800"
            />
          </div>

          {searchKeyword.trim() ? (
            <div className="flex-1 w-full overflow-y-auto border-t border-gray-50 bg-white z-15">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400">Kết quả tìm kiếm</div>
              <div className="px-2.5 pb-2.5 flex flex-col gap-1">
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleStartPrivateChat(user)}
                      className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-violet-50 border border-violet-100 text-violet-600 font-bold text-xs">
                        {(user.fullName || user.username || "U").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">
                          {user.fullName || user.username}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {user.role === "company" ? "Doanh nghiệp" : "Ứng viên"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400">Không tìm thấy tài khoản</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-4 mb-3 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    activeFilter === "all"
                      ? "bg-violet-600 text-white"
                      : "text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setActiveFilter("group")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    activeFilter === "group"
                      ? "bg-violet-600 text-white"
                      : "text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  Nhóm
                </button>
              </div>

              <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="space-y-1 mt-1 px-2.5 pb-2.5 flex flex-col">
                  {displayThreads.map((thread) => {
                    const isGeneral = thread.room === "general";
                    const displayName = isGeneral ? "Phòng nhóm chung" : (thread.partner?.name || "Tài khoản");
                    const relativeTime = thread.lastMessageAt
                      ? new Date(thread.lastMessageAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Vừa xong";
                    return (
                      <div key={thread.room} onClick={() => setActiveRoom(thread.room)}>
                        <ListChatBox
                          name={displayName}
                          chat={thread.lastMessage}
                          hour={relativeTime}
                          choose={activeRoom === thread.room}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-full border border-gray-200 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
          <ChatBox
            activeRoom={activeRoom}
            currentUser={currentUser}
            partner={activeThread?.partner}
            onMessageSent={fetchThreads}
            onToggleMenu={toggleMenu}
          />
        </div>

        <div
          className={`h-full border border-gray-200 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0 transition-all ${
            openMenu ? "w-[300px]" : "w-0 border-none opacity-0 pointer-events-none"
          }`}
        >
          {openMenu && (
            <div className="min-w-[300px] h-full overflow-y-auto no-scrollbar">
              <ProfileChatBox
                activeRoom={activeRoom}
                partner={activeThread?.partner}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messenger;
