import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return undefined;
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { currentUser } = useAuth();

  const refreshUnreadMessages = useCallback(async () => {
    if (!currentUser?._id) {
      setHasNewMessage(false);
      return;
    }

    try {
      const response = await fetch("/api/chat/unread-count", { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setHasNewMessage(Number(data.unreadCount) > 0);
    } catch (error) {
      console.error("Khong the tai trang thai tin nhan chua doc:", error);
    }
  }, [currentUser?._id]);

  const markAllMessagesAsRead = useCallback(async () => {
    if (!currentUser?._id) return false;

    setHasNewMessage(false);
    try {
      const response = await fetch("/api/chat/mark-all-read", {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
      });
      if (!response.ok) {
        await refreshUnreadMessages();
        return false;
      }
      return true;
    } catch (error) {
      console.error("Khong the danh dau tat ca tin nhan da doc:", error);
      await refreshUnreadMessages();
      return false;
    }
  }, [currentUser?._id, refreshUnreadMessages]);

  const markRoomAsRead = useCallback(async (room) => {
    if (!currentUser?._id || !room?.startsWith("private_")) return false;

    try {
      const response = await fetch(`/api/chat/threads/${encodeURIComponent(room)}/read`, {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
      });
      if (!response.ok) return false;
      await refreshUnreadMessages();
      return true;
    } catch (error) {
      console.error("Khong the danh dau doan chat da doc:", error);
      return false;
    }
  }, [currentUser?._id, refreshUnreadMessages]);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(getSocketUrl(), {
        path: "/socket.io",
        withCredentials: true,
        transports: import.meta.env.PROD
          ? ["websocket"]
          : ["polling", "websocket"],
        reconnection: true,
      });

      newSocket.on("newMessage", () => setHasNewMessage(true));

      setSocket(newSocket);
      refreshUnreadMessages();

      return () => {
        newSocket.off("newMessage");
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
      setHasNewMessage(false);
    }
  }, [currentUser, refreshUnreadMessages]);

  return (
    <SocketContext.Provider value={{
      socket,
      hasNewMessage,
      setHasNewMessage,
      refreshUnreadMessages,
      markAllMessagesAsRead,
      markRoomAsRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
