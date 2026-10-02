import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { bindSocketPageLifecycle } from "../utils/socketPageLifecycle.js";
import { showToast } from "../utils/toast.js";

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
  const queryClient = useQueryClient();

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
    let pageSuspended = false;
    const seenNotifications = new Set();
    const refreshNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", currentUser._id],
      });
    };
    const handleNotification = (notification) => {
      if (
        !notification?._id ||
        String(notification.recipient) !== String(currentUser._id) ||
        seenNotifications.has(String(notification._id))
      ) return;

      if (seenNotifications.size >= 500) {
        seenNotifications.delete(seenNotifications.values().next().value);
      }
      seenNotifications.add(String(notification._id));
      refreshNotifications();
      showToast(notification.title || "Bạn có thông báo mới", "info", {
        id: `notification-${notification._id}`,
        description: notification.message,
      });
    };
    const unbindPageLifecycle = bindSocketPageLifecycle({
      onSuspend: () => {
        pageSuspended = true;
        newSocket?.disconnect();
      },
      onRestore: () => {
        pageSuspended = false;
        if (!cancelled) newSocket?.connect();
      },
    });

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
          autoConnect: !pageSuspended,
        });

        newSocket.on("connect", refreshUnreadMessages);
        newSocket.on("connect", refreshNotifications);
        newSocket.on("newNotification", handleNotification);
        newSocket.on("newMessage", () => setHasNewMessage(true));
        newSocket.on("connect_error", async (error) => {
          console.error("Khong the ket noi realtime:", error.message);
          if (
            cancelled ||
            isRefreshingTicket ||
            pageSuspended ||
            !error.message?.startsWith("Authentication error")
          ) {
            return;
          }

          isRefreshingTicket = true;
          try {
            const refreshedTicket = await getSocketTicket();
            if (refreshedTicket && !cancelled && !pageSuspended) {
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
      unbindPageLifecycle();
      if (newSocket) {
        newSocket.off("connect", refreshUnreadMessages);
        newSocket.off("connect", refreshNotifications);
        newSocket.off("newNotification", handleNotification);
        newSocket.off("newMessage");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
    };
  }, [currentUser, refreshUnreadMessages, queryClient]);

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
