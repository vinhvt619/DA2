import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchJson } from "../utils/http.js";

const notificationKeys = {
  all: (userId) => ["notifications", userId],
  list: (userId, page, limit) => [
    "notifications",
    userId,
    "list",
    page,
    limit,
  ],
  unread: (userId) => ["notifications", userId, "unread"],
};

const markNotificationsRead = (data, notificationId) => {
  if (!data?.notifications) return data;
  return {
    ...data,
    notifications: data.notifications.map((notification) =>
      !notificationId || notification._id === notificationId
        ? { ...notification, isRead: true }
        : notification,
    ),
  };
};

export default function useNotifications() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?._id;
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const enabled = Boolean(currentUserId);

  const unreadQuery = useQuery({
    queryKey: notificationKeys.unread(currentUserId),
    queryFn: () => fetchJson("/api/notifications/unread-count"),
    enabled,
    refetchInterval: 30_000,
  });

  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(
      currentUserId,
      pagination.page,
      pagination.limit,
    ),
    queryFn: () =>
      fetchJson(
        `/api/notifications?page=${pagination.page}&limit=${pagination.limit}`,
      ),
    enabled,
    placeholderData: keepPreviousData,
    // Reconcile persisted notifications even when the realtime connection is unavailable.
    refetchInterval: 30_000,
  });

  const updateAllLists = useCallback(
    (updater) => {
      queryClient.setQueriesData(
        { queryKey: notificationKeys.all(currentUserId) },
        updater,
      );
    },
    [currentUserId, queryClient],
  );

  const snapshotNotifications = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey: notificationKeys.all(currentUserId),
    });
    return queryClient.getQueriesData({
      queryKey: notificationKeys.all(currentUserId),
    });
  }, [currentUserId, queryClient]);

  const restoreSnapshot = useCallback(
    (snapshot = []) => {
      snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    [queryClient],
  );

  const markAsReadMutation = useMutation({
    mutationFn: (id) =>
      fetchJson(`/api/notifications/${id}/read`, { method: "PUT" }),
    onMutate: async (id) => {
      const snapshot = await snapshotNotifications();
      queryClient.setQueryData(
        notificationKeys.unread(currentUserId),
        (data) => ({ count: Math.max(0, (data?.count || 0) - 1) }),
      );
      updateAllLists((data) => markNotificationsRead(data, id));
      return { snapshot };
    },
    onError: (error, id, context) => {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
      restoreSnapshot(context?.snapshot);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/notifications/mark-all-read", {
        keepalive: true,
        method: "PUT",
      }),
    onMutate: async () => {
      const snapshot = await snapshotNotifications();
      queryClient.setQueryData(notificationKeys.unread(currentUserId), {
        count: 0,
      });
      updateAllLists((data) => markNotificationsRead(data));
      return { snapshot };
    },
    onError: (error, variables, context) => {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
      restoreSnapshot(context?.snapshot);
    },
  });

  const fetchNotifications = useCallback(
    async (page = 1, limit = 20) => {
      const nextPagination = { page, limit };
      setPagination(nextPagination);
      return queryClient.fetchQuery({
        queryKey: notificationKeys.list(currentUserId, page, limit),
        queryFn: () =>
          fetchJson(`/api/notifications?page=${page}&limit=${limit}`),
      });
    },
    [currentUserId, queryClient],
  );

  const notifications = Array.from(
    { length: pagination.page },
    (_, index) => index + 1,
  ).flatMap((page) => {
    const pageData = queryClient.getQueryData(
      notificationKeys.list(currentUserId, page, pagination.limit),
    );
    return pageData?.notifications || [];
  });

  const markAsRead = useCallback(
    async (id) => {
      try {
        await markAsReadMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [markAsReadMutation],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [markAllAsReadMutation]);

  return {
    unreadCount: unreadQuery.data?.count || 0,
    notifications,
    hasMoreNotifications:
      pagination.page < (notificationsQuery.data?.totalPages || 1),
    loading: notificationsQuery.isFetching,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
