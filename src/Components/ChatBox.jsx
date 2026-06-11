import React, { useEffect, useRef, useState } from "react";
import {
  FaceSmileIcon,
  GifIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

function OpponentChat({ chat }) {
  return (
    <div className="flex w-full justify-start">
      <div className="mb-1 ml-5 w-fit max-w-[55%] whitespace-pre-wrap break-all rounded-xl rounded-tl-none border border-gray-200 bg-gray-50 p-2.5 text-gray-800 text-sm">
        {chat}
      </div>
    </div>
  );
}

function Reply({ chat }) {
  return (
    <div className="flex w-full justify-end">
      <div className="mb-1 ml-5 mr-3 w-fit max-w-[55%] whitespace-pre-wrap break-all rounded-xl rounded-tr-none bg-[#9346F5] p-2.5 text-white text-sm font-medium">
        {chat}
      </div>
    </div>
  );
}

const getUserId = () => {
  let userId = localStorage.getItem("chat_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("chat_user_id", userId);
  }
  return userId;
};

const getSenderName = () => {
  let name = localStorage.getItem("chat_user_name");
  if (!name) {
    name = "Bạn";
    localStorage.setItem("chat_user_name", name);
  }
  return name;
};

export default function ChatBox({ onToggleMenu }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const endOfMessagesRef = useRef(null);

  const currentUserId = getUserId();
  const currentUserName = getSenderName();

  const loadMessages = async () => {
    try {
      const res = await fetch("/api/messages?room=general");
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (err) {
      console.error("Không tải được tin nhắn:", err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView();
  }, [messages]);

  const handleSendMessage = async () => {
    const content = inputMessage.trim();
    if (!content) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: currentUserName,
          content,
          room: "general",
        }),
      });
      const savedMessage = await res.json();
      setMessages((prev) => [...prev, savedMessage]);
      setInputMessage("");
    } catch (err) {
      console.error("Không gửi được tin nhắn:", err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex w-full items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 border border-purple-200 text-[#9346F5] font-bold flex items-center justify-center">
            G
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              Phòng nhóm chung ({currentUserName})
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đang hoạt động</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="hover:bg-gray-100 text-gray-600 rounded-xl p-2 cursor-pointer border border-transparent hover:border-gray-200"
          >
            <PhoneIcon className="size-5" />
          </button>
          <button
            type="button"
            className="hover:bg-gray-100 text-gray-600 rounded-xl p-2 cursor-pointer border border-transparent hover:border-gray-200"
          >
            <VideoCameraIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={onToggleMenu}
            className="hover:bg-gray-100 text-gray-600 rounded-xl p-2 cursor-pointer border border-transparent hover:border-gray-200"
          >
            <InformationCircleIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 w-full overflow-y-auto bg-gray-50/50 p-4">
        <div className="mt-auto w-full pt-2">
          <div className="mb-4 flex items-center justify-center">
            <span className="bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider shadow-2xs">
              Lịch sử nhóm chung
            </span>
          </div>
          
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isMyMsg = msg.senderId === currentUserId;
              return (
                <div key={msg._id || i}>
                  {!isMyMsg && (
                    <div className="ml-6 flex justify-start pb-0.5 text-[10px] font-bold text-[#9346F5]">
                      {msg.senderName}
                    </div>
                  )}
                  {isMyMsg ? (
                    <Reply chat={msg.content} />
                  ) : (
                    <OpponentChat chat={msg.content} />
                  )}
                </div>
              );
            })}
          </div>
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Input Message Controls */}
      <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
        <div className="flex items-center gap-0.5 text-gray-400 shrink-0">
          <button type="button" className="hover:bg-gray-100 hover:text-gray-700 p-2 rounded-lg cursor-pointer">
            <MicrophoneIcon className="size-5" />
          </button>
          <button type="button" className="hover:bg-gray-100 hover:text-gray-700 p-2 rounded-lg cursor-pointer">
            <PhotoIcon className="size-5" />
          </button>
          <button type="button" className="hover:bg-gray-100 hover:text-gray-700 p-2 rounded-lg cursor-pointer">
            <FaceSmileIcon className="size-5" />
          </button>
          <button type="button" className="hover:bg-gray-100 hover:text-gray-700 p-2 rounded-lg cursor-pointer">
            <GifIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-12 text-sm outline-none focus:bg-white focus:border-[#9346F5] font-medium text-gray-800 placeholder:text-gray-400"
            placeholder="Nhập tin nhắn..."
          />
          <button 
            type="button" 
            onClick={handleSendMessage}
            className="absolute right-2 p-1.5 rounded-lg bg-[#9346F5] hover:bg-[#7A34D8] text-white cursor-pointer"
          >
            <PaperAirplaneIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
