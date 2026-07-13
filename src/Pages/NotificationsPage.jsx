import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from '../Components/SettingsLayout.jsx';
import useNotifications from '../hooks/useNotifications.js';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    fetchNotifications(page, LIMIT);
  }, [page, fetchNotifications]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <SettingsPageLayout>
      <SettingsCard>
        <SettingsPageHeader
          badge={
            <>
              <BellIcon className="h-3.5 w-3.5" />
              Thông báo
            </>
          }
          title="Tất cả thông báo"
          description="Quản lý và xem lại tất cả các thông báo cập nhật về việc làm và tài khoản của bạn."
        />

        <div className="rounded-2xl border border-violet-100/50 bg-white/70 overflow-hidden shadow-xs mt-6">
          <div className="px-4.5 py-3.5 border-b border-violet-100/50 bg-violet-50/30 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lịch sử thông báo
            </h2>
          </div>
          
          <div className="bg-white/50 divide-y divide-violet-100/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4.5 py-3.5 flex flex-col gap-2 hover:bg-violet-50/20 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-violet-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </h4>
                      <p className={`text-xs mt-1 ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 bg-[#9346F5] rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length === LIMIT && (
            <div className="border-t border-violet-100/50 bg-violet-50/5 text-center">
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-[#9346F5] hover:bg-violet-50/20 transition-colors"
              >
                Tải thêm thông báo
              </button>
            </div>
          )}
        </div>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
