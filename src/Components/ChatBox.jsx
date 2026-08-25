import React, { useEffect, useRef, useState, useCallback } from "react";
import Compressor from "compressorjs";
import {
  FaceSmileIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSocket } from "../context/SocketContext.jsx";
import { formatDateTime } from "../utils/dateTime.js";
import { showToast } from "../utils/toast.js";

const emojis = [
  "😂", "❤️", "👍", "😍", "😊", "😭", 
  "😱", "🤔", "🔥", "🎉", "👏", "🙌", 
  "👀", "🚀", "💡", "🌟", "🤝", "🎂", 
  "💯", "📌", "✔️", "❌", "😎", "😉"
];

const formatMessageTime = (value) => {
  return formatDateTime(value, "HH:mm");
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp tin."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    new Compressor(file, {
      maxHeight: 1000,
      maxWidth: 1000,
      quality: 0.7,
      success: async (result) => {
        try {
          resolve(await blobToDataUrl(result));
        } catch (error) {
          reject(error);
        }
      },
      error: () => reject(new Error("Tệp tin hình ảnh không hợp lệ.")),
    });
  });

function OpponentChat({ msg, onImageClick }) {
  return (
    <div className="flex w-full justify-start">
      <div className="mb-1 flex w-fit max-w-[72%] flex-col gap-1.5">
        {msg.image && (
          <img
            src={msg.image}
            alt="Đính kèm"
            onClick={() => onImageClick && onImageClick(msg.image)}
            className="rounded-xl border border-gray-150 max-h-48 object-cover cursor-zoom-in hover:opacity-95 transition-opacity bg-white shadow-xs"
          />
        )}
        {msg.content && (
          <div className="w-full whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700 shadow-xs">
            {msg.content}
          </div>
        )}
        <time className="px-1 text-[9px] font-medium text-slate-400">
          {formatMessageTime(msg.createdAt)}
        </time>
      </div>
    </div>
  );
}

function Reply({ msg, onImageClick }) {
  return (
    <div className="flex w-full justify-end">
      <div className="mb-1 flex w-fit max-w-[72%] flex-col items-end gap-1.5">
        {msg.image && (
          <img
            src={msg.image}
            alt="Đính kèm"
            onClick={() => onImageClick && onImageClick(msg.image)}
            className="rounded-xl border border-violet-100 max-h-48 object-cover cursor-zoom-in hover:opacity-95 transition-opacity bg-white shadow-xs"
          />
        )}
        {msg.content && (
          <div className="w-full whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-violet-600 px-3 py-2.5 text-xs font-medium leading-relaxed text-white shadow-xs">
            {msg.content}
          </div>
        )}
        <div className="flex items-center gap-1 px-1 text-[9px] font-medium text-slate-400">
          <time>{formatMessageTime(msg.createdAt)}</time>
          <span>✓✓</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatBox({ activeRoom = "general", currentUser, partner, onMessageSent, onToggleMenu, onShowMenu }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const { socket } = useSocket();
  
  // Image attachments states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const endOfMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?room=${activeRoom}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch (err) {
      console.error("Không tải được tin nhắn:", err);
    }
  }, [activeRoom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (msg.room === activeRoom) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, activeRoom]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setSelectedImage(compressedBase64);
      setImagePreviewUrl(compressedBase64);
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
      showToast(err.message || "Không thể tải hoặc xử lý ảnh này.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const handleInsertEmoji = (emoji) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = inputMessage;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setInputMessage(before + emoji + after);
    setShowEmojiPicker(false);

    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    }, 0);
  };

  const handleSendMessage = async () => {
    const content = inputMessage.trim();
    if (!content && !selectedImage) return;
    if (!currentUser) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser._id,
          senderName: currentUser.fullName || currentUser.username,
          content,
          room: activeRoom,
          image: selectedImage,
        }),
      });
      if (res.ok) {
        const savedMessage = await res.json();
        setMessages((prev) => [...prev, savedMessage]);
        setInputMessage("");
        setSelectedImage(null);
        setImagePreviewUrl(null);
        if (onMessageSent) onMessageSent(savedMessage);
      } else {
        setSendError("Gửi tin nhắn thất bại, vui lòng thử lại.");
        setTimeout(() => setSendError(""), 3000);
      }
    } catch (err) {
      console.error("Không gửi được tin nhắn:", err);
      setSendError("Lỗi kết nối, vui lòng thử lại.");
      setTimeout(() => setSendError(""), 3000);
    }
  };

  const isGeneral = activeRoom === "general";
  const chatTitle = isGeneral
    ? "Phòng nhóm chung"
    : (partner?.name || "Đang tải...");

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center cursor-zoom-out p-4"
          style={{ zIndex: 1000 }}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 cursor-pointer transition-colors"
          >
            <XMarkIcon className="size-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Xem đầy đủ"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {chatTitle.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              {chatTitle}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-medium text-gray-400">
                {isGeneral ? "Phòng chung công khai" : "Đang hoạt động"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-50 rounded-lg p-1.5 border border-transparent hover:border-gray-200"
          >
            <PhoneIcon className="size-4.5" />
          </button>
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-50 rounded-lg p-1.5 border border-transparent hover:border-gray-200"
          >
            <VideoCameraIcon className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={onToggleMenu}
            className="text-gray-500 hover:bg-gray-50 rounded-lg p-1.5 border border-transparent hover:border-gray-200"
          >
            <InformationCircleIcon className="size-4.5" />
          </button>
        </div>
      </div>

      {!isGeneral && (
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-violet-50/70 px-4 py-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-slate-400">Trao đổi tuyển dụng</div>
            <div className="truncate text-xs font-semibold text-slate-700">
              {partner?.role === "company"
                ? "Bạn đang trao đổi với doanh nghiệp"
                : "Bạn đang trao đổi với ứng viên"}
            </div>
          </div>
          <button
            type="button"
            onClick={onShowMenu || onToggleMenu}
            className="shrink-0 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50"
          >
            Xem thông tin
          </button>
        </div>
      )}

      {/* Message List */}
      <div className="w-full flex-1 overflow-y-auto bg-slate-50/70 p-4">
        <div className="mt-auto w-full pt-1">
          <div className="mb-5 flex items-center justify-center">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-medium text-slate-400">
              Hôm nay
            </span>
          </div>
          
          <div className="space-y-2">
            {messages.map((msg, i) => {
              const isMyMsg = String(msg.senderId) === String(currentUser?._id || currentUser?.id);
              return (
                <div key={msg._id || i}>
                  {!isMyMsg && isGeneral && (
                    <div className="ml-5 flex justify-start pb-0.5 text-[9px] font-bold text-violet-600">
                      {msg.senderName}
                    </div>
                  )}
                  {isMyMsg ? (
                    <Reply msg={msg} onImageClick={setLightboxImage} />
                  ) : (
                    <OpponentChat msg={msg} onImageClick={setLightboxImage} />
                  )}
                </div>
              );
            })}
          </div>
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Image Preview Area */}
      {imagePreviewUrl && (
        <div className="px-4 py-2.5 bg-white border-t border-gray-150 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs shrink-0 group">
            <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 cursor-pointer"
            >
              <XMarkIcon className="size-3" />
            </button>
          </div>
          <span className="text-[10px] font-semibold text-gray-400">Hình ảnh đã sẵn sàng đính kèm</span>
        </div>
      )}

      {/* Message Input Bottom Bar */}
      <div className="relative flex items-center gap-2 border-t border-slate-200 bg-white p-3">
        {sendError && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-semibold animate-fade-in z-50 whitespace-nowrap">
            {sendError}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-0.5 text-gray-400">
          {/* Photo upload trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-gray-50 p-1.5 rounded-md text-gray-400 hover:text-violet-600 transition-colors cursor-pointer"
          >
            <PhotoIcon className="size-4.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${showEmojiPicker ? "bg-violet-50 text-violet-600" : "hover:bg-gray-50 text-gray-400"}`}
          >
            <FaceSmileIcon className="size-4.5" />
          </button>

        </div>

        <div className="flex-1 relative flex items-center">
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div
              className="absolute bottom-14 left-0 w-64 p-3 rounded-xl backdrop-blur-md bg-white/90 border border-violet-100/50 shadow-xl z-50 transition-all select-none"
            >
              <div className="grid grid-cols-6 gap-2 text-center text-lg">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="hover:bg-violet-50 p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-11 text-xs font-medium text-gray-800 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:bg-white"
            placeholder="Nhập tin nhắn..."
          />
          <button 
            type="button" 
            onClick={handleSendMessage}
            className="absolute right-1.5 rounded-lg bg-violet-600 p-1.5 text-white hover:bg-violet-700 cursor-pointer"
          >
            <PaperAirplaneIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
