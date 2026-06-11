import { useState } from "react";
import "../App.css";
import React from "react";
import Header from "../Components/Header.jsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import NotificationItem from "../Components/NotificationSetting.jsx";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";

export default function Accessibility() {
  const [enabled, setEnabled] = useState(false);
  const [openDropDown, setOpenDropDown] = useState(null);

  const notificationSettingLists = [
    { key: "jobSearch", label: "Tìm kiếm việc làm" },
    { key: "message", label: "Nhắn tin" },
    { key: "updateMarket", label: "Cập nhật xu hướng thị trường" },
    { key: "news", label: "Tin tức và báo cáo" },
    { key: "postComment", label: "Đăng và bình luận", placement: "top" },
  ];
  const [notificationSettings, setNotificationSettings] = useState({
    jobSearch: "Chưa chọn",
    message: "Chưa chọn",
    updateMarket: "Chưa chọn",
    news: "Chưa chọn",
    postComment: "Chưa chọn",
  });
  const updateNotificationSetting = (key, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <Header />

      <div className="pt-10 flex items-start max-w-6xl mx-auto w-full px-4 lg:px-8 gap-8 pb-20">
        <div className="top-0 bg-white rounded-3xl pr-2 pl-7 pb-5 shrink-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-[#ffffff]">
          <StickyProfileSettings />
        </div>

        <div className="flex-1 min-w-0 flex justify-center relative">
          <div className="w-full max-w-[800px] bg-white rounded-3xl border border-gray-50 shadow-[0_2px_20px_rgba(0,0,0,0.03)] pb-12">
            <div className="px-10 pt-10 mb-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Trợ năng & Giao diện
              </h1>
              <p className="text-gray-500 text-sm">
                Đơn giản hóa trải nghiệm và tùy chỉnh giao diện ứng dụng theo
                cách của bạn.
              </p>
            </div>

            <div className="space-y-12 px-10">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Hiển thị
                </h3>
                <div className="border-b border-gray-100 py-5 flex justify-between items-center">
                  <span className="text-[15px] font-medium">
                    Chế độ tối (Dark Mode)
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      enabled ? "bg-black" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`size-4 rounded-full bg-white drop-shadow-sm ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Thông báo
                </h3>
                <div className="flex flex-col divide-y divide-gray-100">
                  {notificationSettingLists.map((item) => (
                    <div key={item.key} className="py-2">
                      <NotificationItem
                        label={item.label}
                        value={notificationSettings[item.key]}
                        onChange={(val) =>
                          updateNotificationSetting(item.key, val)
                        }
                        isOpen={openDropDown === item.key}
                        onToggle={() =>
                          setOpenDropDown(
                            openDropDown === item.key ? null : item.key,
                          )
                        }
                        placement={item.placement || "bottom"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
