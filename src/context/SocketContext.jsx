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
    if (!currentUser) {
      setSocket(null);
      setHasNewMessage(false);
      return undefined;
    }

    let cancelled = false;
    let newSocket;
    let isRefreshingTicket = false;

    const getSocketTicket = async () => {
      const response = await fetch("/api/socket-ticket", {
        credentials: "include",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.token || null;
    };

    const connectSocket = async () => {
      try {
        const ticket = await getSocketTicket();
        if (cancelled) return;

        newSocket = io(getSocketUrl(), {
          path: "/socket.io",
          withCredentials: true,
          auth: ticket ? { token: ticket } : undefined,
          transports: ["websocket", "polling"],
          tryAllTransports: true,
          reconnection: true,
        });

        newSocket.on("newMessage", () => setHasNewMessage(true));
        newSocket.on("connect_error", async (error) => {
          console.error("Khong the ket noi realtime:", error.message);
          if (
            cancelled ||
            isRefreshingTicket ||
            !error.message?.startsWith("Authentication error")
          ) {
            return;
          }

          isRefreshingTicket = true;
          try {
            const refreshedTicket = await getSocketTicket();
            if (refreshedTicket && !cancelled) {
              newSocket.auth = { token: refreshedTicket };
              newSocket.connect();
            }
          } finally {
            isRefreshingTicket = false;
          }
        });

        setSocket(newSocket);
        refreshUnreadMessages();
      } catch (error) {
        console.error("Khong the tao ket noi realtime:", error.message);
      }
    };

    void connectSocket();

    return () => {
      cancelled = true;
      if (newSocket) {
        newSocket.off("newMessage");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
    };
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
