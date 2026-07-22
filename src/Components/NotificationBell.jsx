import {
  BellAlertIcon,
  BellIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell({ isOpen, onToggle, onClose }) {
  const { unreadCount, notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleToggle = () => {
    const isOpening = !isOpen;
    onToggle();
    if (isOpening) {
      void (async () => {
        await markAllAsRead();
        await fetchNotifications();
      })();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    onClose();

    if (notification.link) {
      navigate(notification.link);
    } else if (currentUser?.role === "company") {
      navigate("/CompanyDashboard");
    } else {
      navigate("/UserDashboard");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          isOpen ? "bg-violet-100 text-violet-700" : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
        }`}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Danh sách thông báo"
          className="absolute right-0 mt-2 w-[min(270px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-violet-100 bg-white p-2 shadow-[0_14px_36px_rgba(76,29,149,0.14)]"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <h3 className="text-[13px] font-bold text-slate-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                {unreadCount} mới
              </span>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-lg">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <BellAlertIcon className="mx-auto h-8 w-8 text-violet-300" />
                <p className="mt-2 text-[13px] font-semibold text-slate-700">Chưa có thông báo</p>
                <p className="mt-1 text-xs text-slate-500">Các cập nhật mới sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full gap-2.5 border-t border-slate-100 px-2 py-2.5 text-left transition first:border-t-0 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
                    notification.isRead ? "bg-white" : "bg-violet-50/70"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <BriefcaseIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className={`line-clamp-1 flex-1 text-[13px] ${notification.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                        {notification.title}
                      </span>
                      {!notification.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</span>
                    <span className="mt-1 block text-[10px] font-medium text-violet-600">{formatTime(notification.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/notifications");
            }}
            className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-violet-600 text-[11px] font-bold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
}
