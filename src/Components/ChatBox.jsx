import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaceSmileIcon,
  GifIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSocket } from "../context/SocketContext.jsx";

const emojis = [
  "😂", "❤️", "👍", "😍", "😊", "😭", 
  "😱", "🤔", "🔥", "🎉", "👏", "🙌", 
  "👀", "🚀", "💡", "🌟", "🤝", "🎂", 
  "💯", "📌", "✔️", "❌", "😎", "😉"
];

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp tin."));
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Tệp tin hình ảnh không hợp lệ."));
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        // Tạo nền trắng cho ảnh trong suốt (PNG transparency)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Xuất ra base64 dạng jpeg chất lượng 0.7
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
    };
  });
};

function OpponentChat({ msg, onImageClick }) {
  return (
    <div className="flex w-full justify-start">
      <div className="mb-1 ml-4 w-fit max-w-[60%] flex flex-col gap-1.5">
        {msg.image && (
          <img
            src={msg.image}
            alt="Đính kèm"
            onClick={() => onImageClick && onImageClick(msg.image)}
            className="rounded-xl border border-gray-150 max-h-48 object-cover cursor-zoom-in hover:opacity-95 transition-opacity bg-white shadow-xs"
          />
        )}
        {msg.content && (
          <div className="w-full whitespace-pre-wrap break-all rounded-xl border border-gray-150 bg-white p-2.5 text-gray-800 text-xs leading-relaxed shadow-xs">
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

function Reply({ msg, onImageClick }) {
  return (
    <div className="flex w-full justify-end">
      <div className="mb-1 mr-2 w-fit max-w-[60%] flex flex-col gap-1.5 items-end">
        {msg.image && (
          <img
            src={msg.image}
            alt="Đính kèm"
            onClick={() => onImageClick && onImageClick(msg.image)}
            className="rounded-xl border border-violet-100 max-h-48 object-cover cursor-zoom-in hover:opacity-95 transition-opacity bg-white shadow-xs"
          />
        )}
        {msg.content && (
          <div className="w-full whitespace-pre-wrap break-all rounded-xl bg-violet-600 p-2.5 text-white text-xs leading-relaxed font-semibold shadow-xs">
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatBox({ activeRoom = "general", currentUser, partner, onMessageSent, onToggleMenu }) {
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
      alert(err.message || "Không thể tải hoặc xử lý ảnh này.");
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
        if (onMessageSent) onMessageSent();
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
    <div className="h-full w-full flex flex-col bg-white relative">
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
      <div className="flex w-full items-center justify-between p-3 border-b border-gray-150">
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-full bg-violet-50 border border-violet-100 text-violet-600 font-bold flex items-center justify-center text-xs">
            {chatTitle.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">
              {chatTitle}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">
                {isGeneral ? "Phòng chung công khai" : "Trực tuyến"}
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

      {/* Message List */}
      <div className="flex-1 w-full overflow-y-auto bg-gray-50/50 p-4">
        <div className="mt-auto w-full pt-1">
          <div className="mb-4 flex items-center justify-center">
            <span className="bg-white border border-gray-200 px-3 py-1 rounded-md text-[9px] font-medium text-gray-450 uppercase tracking-wider">
              {isGeneral ? "Lịch sử nhóm chung" : `Trò chuyện với ${chatTitle}`}
            </span>
          </div>
          
          <div className="space-y-2">
            {messages.map((msg, i) => {
              const isMyMsg = msg.senderId === currentUser?._id;
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
      <div className="p-3 bg-white border-t border-gray-150 flex items-center gap-2 relative">
        {sendError && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-semibold animate-fade-in z-50 whitespace-nowrap">
            {sendError}
          </div>
        )}
        <div className="flex items-center gap-0.5 text-gray-400 shrink-0">
          <button type="button" className="hover:bg-gray-50 p-1.5 rounded-md">
            <MicrophoneIcon className="size-4.5" />
          </button>
          
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

          <button type="button" className="hover:bg-gray-50 p-1.5 rounded-md">
            <GifIcon className="size-4.5" />
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
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-10 text-xs outline-none focus:bg-white focus:border-violet-400 font-medium text-gray-800 placeholder:text-gray-400"
            placeholder="Nhập tin nhắn..."
          />
          <button 
            type="button" 
            onClick={handleSendMessage}
            className="absolute right-1.5 p-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
          >
            <PaperAirplaneIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
