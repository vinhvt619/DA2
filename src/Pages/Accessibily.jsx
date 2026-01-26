import { useState } from "react";
import "./../../src/App.css";
import React from "react";
import Header from "../Components/Header.jsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import NotificationItem from "../Components/NotificationSetting.jsx";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";
import { Switch } from "@headlessui/react";
export default function Accessibility() {
  const [enabled, setEnabled] = useState(false);
  const [showDisplaySetting, setShowDisplaySettings] = useState(false);
  const [showNotifySetting, setShowNotifySetting] = useState(false);
  const [openDropDown, setOpenDropDown] = useState(null);

  const notificationSettingLists = [
    { key: "jobSearch", label: "Tìm kiếm việc làm" },
    { key: "message", label: "Nhắn tin" },
    { key: "updateMarket", label: "Cập nhật xu hướng thị trường" },
    { key: "news", label: "Tin tức và báo cáo" },
    { key: "postComment", label: "Đăng và bình luận" },
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
    <div className="bg-[#F8F4FC] h-full">
      <Header />
      <div className="pt-10 flex  items-start">
        <StickyProfileSettings />
        <div className="w-full mt-10 h-screen flex justify-center">
          <div className="border border-black h-fit w-[40%] bg-white rounded-2xl">
            <div className="p-5 h-full">
              <div className="text-lg font-bold">Trợ năng</div>
              <div className="text-xs">
                Các lựa chọn này sẽ cải thiện trợ năng trên ứng dụng.
              </div>
              <div className="text-base font-semibold mt-5  p-2">
                <div
                  className="flex items-center justify-between"
                  onClick={() => setShowDisplaySettings((prev) => !prev)}
                >
                  <div>Hiển thị</div>
                  <div>
                    <ChevronDownIcon
                      className={`size-4 stroke-3 transition-transform duration-200 ${
                        showDisplaySetting ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`ml-3 mt-3 overflow-hidden transition-all duration-450 ease-in-out
  ${
    showDisplaySetting
      ? "max-h-20 opacity-100 translate-y-0 delay-200"
      : "max-h-0 opacity-0 -translate-y-2"
  }`}
                >
                  <div className="text-sm font-semibold flex justify-between items-center">
                    <div>Chế độ tối</div>
                    <Switch
                      checked={enabled}
                      onChange={setEnabled}
                      className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-checked:bg-blue-600"
                    >
                      <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
                    </Switch>
                  </div>
                </div>
              </div>
              <div
                className={`text-base font-bold p-2 transition-all duration-500 ease-in-out
  ${showNotifySetting ? "max-h-200" : "max-h-12"}`}
              >
                <div
                  className="flex items-center justify-between"
                  onClick={() => setShowNotifySetting((prev) => !prev)}
                >
                  <div>Cài đặt thông báo</div>
                  <div>
                    <ChevronDownIcon
                      className={`size-4 stroke-3 transition-transform duration-200 ${
                        showNotifySetting ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`ml-3 mt-3 transition-all duration-500 ease-in-out overscroll-auto
  ${
    showNotifySetting
      ? "opacity-100 translate-y-0 delay-300"
      : "opacity-0 -translate-y-2 "
  }`}
                >
                  {notificationSettingLists.map((item) => (
                    <NotificationItem
                      key={item.key}
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
                    />
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
