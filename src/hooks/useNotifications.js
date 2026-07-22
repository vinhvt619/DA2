import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useNotifications() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?._id;
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/notifications/unread-count', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Lỗi khi fetch unread count:', error);
    }
  }, [currentUserId]);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Lỗi khi fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const markAsRead = async (id) => {
    if (!currentUserId) return;
    
    // Cập nhật Optimistic UI (UI mượt mà, phản hồi tức thì)
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) => 
      prev.map(notif => notif._id === id ? { ...notif, isRead: true } : notif)
    );

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) {
        // Rollback lại state nếu có lỗi backend
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      fetchUnreadCount();
      fetchNotifications();
    }
  };

  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;

    setUnreadCount(0);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'include',
        keepalive: true,
      });
      if (!response.ok) throw new Error('Không thể đánh dấu thông báo đã đọc');
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [currentUserId, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    // Không làm gì nếu chưa login
    if (!currentUserId) return;

    // Lần đầu tiên gọi ngay lập tức để user không phải đợi 30s
    fetchUnreadCount();

    // Thiết lập interval gọi API nhẹ định kỳ mỗi 30s
    const interval = setInterval(fetchUnreadCount, 30000);

    // Dọn dẹp an toàn khi component unmount
    return () => clearInterval(interval);
  }, [currentUserId, fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
