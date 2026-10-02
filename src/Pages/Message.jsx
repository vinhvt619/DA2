import "../App.css";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Header from "../Components/Header.jsx";
import ShowMenuChatHook from "../hooks/ShowMenuChatBoxHook.jsx";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import ListChatBox from "../Components/ListChatBox.jsx";
import ChatBox from "../Components/ChatBox.jsx";
import ProfileChatBox from "../Components/ProfileChatBox.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const NEW_CHAT_PLACEHOLDER = "Bắt đầu cuộc trò chuyện mới...";
const draftStorageKey = (userId) => `rabbitcv_chat_drafts_${userId}`;

const readDraftThreads = (userId) => {
  if (!userId) return [];
  try {
    const stored = JSON.parse(localStorage.getItem(draftStorageKey(userId)) || "[]");
    return Array.isArray(stored)
      ? stored.filter((thread) => thread?.room && thread.room !== "general")
      : [];
  } catch {
    return [];
  }
};

const writeDraftThreads = (userId, threads) => {
  if (!userId) return;
  try {
    localStorage.setItem(draftStorageKey(userId), JSON.stringify(threads));
  } catch {
    // Tin nhắn vẫn hoạt động nếu trình duyệt chặn localStorage.
  }
};

const isDraftThread = (thread) => thread?.lastMessage === NEW_CHAT_PLACEHOLDER;
const getUserId = (user) => String(user?._id || user?.id || "");

const getPartnerIdFromRoom = (room, currentUser) => {
  const currentUserId = getUserId(currentUser);
  if (!room?.startsWith("private_") || !currentUserId) return "";

  return room
    .slice("private_".length)
    .split("_")
    .map(String)
    .find((id) => id && id !== currentUserId) || "";
};

function Messenger() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openMenu, toggleMenu, showMenu } = ShowMenuChatHook(true);
  const [openSettingChat, setOpenSettingChat] = useState(false);
  
  const { currentUser, isAuthChecked } = useAuth();
  const { socket, markRoomAsRead } = useSocket();
  const [threads, setThreads] = useState([]);
  const [activeRoom, setActiveRoom] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const threadsRef = useRef([]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/threads", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const privateThreads = data.filter((thread) => thread.room?.startsWith("private_"));
        const hydratedThreads = await Promise.all(privateThreads.map(async (thread) => {
          if (thread.partner?.name) return thread;
          const partnerId = getPartnerIdFromRoom(thread.room, currentUser);
          if (!partnerId) return thread;

          try {
            const profileResponse = await fetch(`/api/user/profile/${partnerId}`, { credentials: "include" });
            if (!profileResponse.ok) return thread;
            const profileData = await profileResponse.json();
            const partner = profileData?.user || profileData;
            if (!partner?._id) return thread;
            return {
              ...thread,
              partner: {
                id: partner._id,
                name: partner.fullName || partner.username,
                role: partner.role,
              },
            };
          } catch {
            return thread;
          }
        }));
        const realRooms = new Set(hydratedThreads.map((thread) => thread.room));
        const savedDrafts = readDraftThreads(currentUser?._id).filter(
          (thread) => !realRooms.has(thread.room)
        );
        const mergedThreads = [...savedDrafts, ...hydratedThreads];

        writeDraftThreads(currentUser?._id, savedDrafts);
        setActiveRoom((currentRoom) => {
          if (currentRoom && mergedThreads.some((thread) => thread.room === currentRoom)) return currentRoom;
          return mergedThreads[0]?.room || "";
        });
        setThreads(mergedThreads);
      }
    } catch (err) {
      console.error("Lỗi tải cuộc trò chuyện:", err);
    }
  }, [currentUser]);

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

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      if (!message?.room) return;

      if (threadsRef.current.some((thread) => thread.room === message.room)) {
        setThreads((previousThreads) => previousThreads
          .map((thread) => (
            thread.room === message.room
              ? {
                  ...thread,
                  lastMessage: message.content || "Đã gửi một hình ảnh",
                  lastMessageAt: message.createdAt || new Date().toISOString(),
                  senderId: message.senderId,
                  senderName: message.senderName,
                }
              : thread
          ))
          .sort((first, second) => new Date(second.lastMessageAt) - new Date(first.lastMessageAt)));
      } else {
        // Only rebuild the server-side thread list for a brand-new room.
        void fetchThreads();
      }

      if (message?.room === activeRoom) {
        void markRoomAsRead(activeRoom);
      }
    };
    socket.on("newMessage", handleNewMessage);
    socket.on("connect", fetchThreads);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("connect", fetchThreads);
    };
  }, [socket, fetchThreads, activeRoom, markRoomAsRead]);

  useEffect(() => {
    if (!activeRoom) return;
    void markRoomAsRead(activeRoom);
  }, [activeRoom, markRoomAsRead]);

  const handleStartPrivateChat = useCallback((partner) => {
    if (!currentUser) return;
    const room = [getUserId(currentUser), getUserId(partner)].sort().join("_");
    const privateRoomId = `private_${room}`;
    setActiveRoom(privateRoomId);
    setSearchKeyword("");
    
    // Lưu cuộc trò chuyện nháp để nó không biến mất khi đổi trang.
    setThreads((prev) => {
      if (prev.some((thread) => thread.room === privateRoomId)) return prev;

      const nextThreads = [
        {
          room: privateRoomId,
          lastMessage: NEW_CHAT_PLACEHOLDER,
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
      ];
      writeDraftThreads(currentUser._id, nextThreads.filter(isDraftThread));
      return nextThreads;
    });
  }, [currentUser]);

  // Handle partnerId from URL query param to auto-start chat
  useEffect(() => {
    const partnerId = searchParams.get("partnerId");
    if (!partnerId || !currentUser) return;
    
    const partner = allUsers.find(u => u._id === partnerId);
    if (partner) {
      handleStartPrivateChat(partner);
      setSearchParams({}); // Clean up URL
    } else {
      // Fallback: If not in allUsers, fetch profile directly
      fetch(`/api/user/profile/${partnerId}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          const partnerProfile = data?.user || data;
          if (partnerProfile?._id) {
            handleStartPrivateChat(partnerProfile);
            setSearchParams({});
          }
        })
        .catch(err => console.error("Lỗi lấy thông tin partner từ URL:", err));
    }
  }, [searchParams, allUsers, currentUser, handleStartPrivateChat, setSearchParams]);

  const filteredSearchResults = searchKeyword.trim()
    ? allUsers.filter((user) => {
        const name = (user.fullName || user.username || "").toLowerCase();
        return name.includes(searchKeyword.toLowerCase());
      })
    : [];

  const activeThread = threads.find((t) => t.room === activeRoom);
  const getThreadPartner = (thread) => {
    if (!thread) return null;
    if (thread.partner?.name) return thread.partner;

    const partnerId = getPartnerIdFromRoom(thread.room, currentUser);
    const partner = allUsers.find((user) => getUserId(user) === partnerId);
    if (partner) return partner;

    return {
      id: partnerId,
      name: String(thread.senderId) !== getUserId(currentUser) && thread.senderName
        ? thread.senderName
        : "Tài khoản không còn tồn tại",
    };
  };
  const activePartner = getThreadPartner(activeThread);

  const handleMessageSent = useCallback((message) => {
    if (!message || !activeRoom) return;

    setThreads((previousThreads) => {
      const nextThreads = previousThreads
        .map((thread) => (
          thread.room === activeRoom
            ? {
                ...thread,
                lastMessage: message.content || "Đã gửi một hình ảnh",
                lastMessageAt: message.createdAt || new Date().toISOString(),
                senderId: message.senderId,
                senderName: message.senderName,
              }
            : thread
        ))
        .sort((first, second) => new Date(second.lastMessageAt) - new Date(first.lastMessageAt));

      writeDraftThreads(currentUser?._id, nextThreads.filter(isDraftThread));
      return nextThreads;
    });
  }, [activeRoom, currentUser?._id]);

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--page-background)] font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  const handleHideChat = async (roomToHide) => {
    const remainingThreads = threads.filter((thread) => thread.room !== roomToHide);
    setThreads(remainingThreads);
    writeDraftThreads(currentUser?._id, remainingThreads.filter(isDraftThread));
    
    if (activeRoom === roomToHide) {
      setActiveRoom(remainingThreads[0]?.room || "");
    }
    
    try {
      await fetch(`/api/chat/threads/${roomToHide}/hide`, {
        method: "PATCH",
        credentials: "include"
      });
    } catch (err) {
      console.error("Lỗi xóa đoạn chat:", err);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--page-background)] font-sans text-sm text-slate-900 page-transition">
      {currentUser?.role !== "company" && <Header />}

      <div className={`mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-3 overflow-hidden p-4 ${currentUser?.role === "company" ? "h-screen" : "h-[calc(100vh-80px)]"}`}>
        <div className="relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="size-5 text-violet-600" />
              <h1 className="text-base font-bold text-gray-900">Tin nhắn</h1>
            </div>
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

          <div className="relative px-3 pb-2 pt-3">
            <MagnifyingGlassIcon className="size-4.5 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2" />
            <input
              name="conversationSearch"
              aria-label="Tìm cuộc trò chuyện"
              type="search"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-xs font-medium text-gray-800 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:bg-white"
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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/profile/${user._id}`);
                        }}
                        className="rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700 hover:bg-violet-100"
                      >
                        Xem hồ sơ
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400">Không tìm thấy tài khoản</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Gần đây</div>
                <div className="flex flex-col gap-1 px-2.5 pb-2.5">
                  {threads.map((thread) => {
                    const partner = getThreadPartner(thread);
                    const displayName = partner?.name || "Tài khoản không còn tồn tại";
                    const relativeTime = thread.lastMessageAt
                      ? new Date(thread.lastMessageAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Vừa xong";
                    return (
                      <div key={thread.room} onClick={() => setActiveRoom(thread.room)}>
                        <ListChatBox
                          room={thread.room}
                          name={displayName}
                          role={partner?.role}
                          chat={thread.lastMessage}
                          hour={relativeTime}
                          choose={activeRoom === thread.room}
                          onHideChat={handleHideChat}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {activeRoom ? (
            <ChatBox activeRoom={activeRoom} currentUser={currentUser} partner={activePartner} onMessageSent={handleMessageSent} onToggleMenu={toggleMenu} onShowMenu={showMenu} />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center"><div><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-lg text-violet-600">✦</div><h2 className="mt-3 text-sm font-bold text-slate-700">Chưa có cuộc trò chuyện</h2><p className="mt-1 text-xs text-slate-400">Tìm một tài khoản để bắt đầu nhắn tin.</p></div></div>
          )}
        </div>

        <div
          className={`flex h-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all ${
            openMenu && activeRoom ? "w-[280px]" : "pointer-events-none w-0 border-none opacity-0"
          }`}
        >
          {openMenu && activeRoom && (
            <div className="h-full min-w-[280px] overflow-y-auto no-scrollbar">
              <ProfileChatBox activeRoom={activeRoom} partner={activePartner} onHideChat={() => handleHideChat(activeRoom)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messenger;
