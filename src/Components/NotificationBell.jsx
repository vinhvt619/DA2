import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { unreadCount, notifications, loading, fetchNotifications, markAsRead } = useNotifications();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Nếu dropdown chuẩn bị mở ra, tiến hành fetch list thông báo mới nhất
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notif) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    setIsOpen(false);
    
    // Xử lý điều hướng
    if (notif.link) {
      navigate(notif.link);
    } else {
      if (currentUser?.role === 'company') {
        navigate('/CompanyDashboard');
      } else if (currentUser?.role === 'employee') {
        navigate('/UserDashboard');
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-white transition-colors"
      >
        <BellIcon className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#9346F5] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-gray-200 bg-white shadow-sm z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-200 flex justify-between items-center">
            <p className="text-sm font-bold text-gray-800">
              Thông báo
            </p>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#9346F5] border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-violet-50/20 transition-colors border-b border-gray-50 cursor-pointer relative group ${
                    !notif.isRead ? 'bg-violet-50/40' : ''
                  }`}
                >
                  {!notif.isRead && (
                    <span className="absolute left-2 top-4.5 w-1.5 h-1.5 bg-[#9346F5] rounded-full"></span>
                  )}
                  <div className="pl-3">
                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    <p className={`text-[13px] mt-0.5 leading-relaxed ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[11px] text-gray-400 font-medium mt-1.5 block">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Xem tất cả thông báo */}
          <div 
            className="border-t border-gray-200 p-3 text-center text-[13px] font-semibold text-[#9346F5] cursor-pointer hover:bg-violet-50 transition-colors"
            onClick={() => {
              setIsOpen(false);
              navigate('/notifications');
            }}
          >
            Xem tất cả thông báo
          </div>
        </div>
      )}
    </div>
  );
}
