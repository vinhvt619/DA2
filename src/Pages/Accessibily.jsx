import { useState } from "react";
import { MoonIcon } from "@heroicons/react/24/outline";
import NotificationItem from "../Components/NotificationSetting.jsx";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
  SettingsSectionTitle,
} from "../Components/SettingsLayout.jsx";

const notificationSettingLists = [
  { key: "jobSearch", label: "Tìm kiếm việc làm" },
  { key: "message", label: "Nhắn tin" },
  { key: "updateMarket", label: "Cập nhật xu hướng thị trường" },
  { key: "news", label: "Tin tức và báo cáo" },
  { key: "postComment", label: "Đăng và bình luận", placement: "top" },
];

export default function Accessibility() {
  const [darkMode, setDarkMode] = useState(false);
  const [openDropDown, setOpenDropDown] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    jobSearch: "Chưa chọn",
    message: "Chưa chọn",
    updateMarket: "Chưa chọn",
    news: "Chưa chọn",
    postComment: "Chưa chọn",
  });

  const updateNotificationSetting = (key, value) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsPageLayout>
      <SettingsCard>
        <SettingsPageHeader
          badge={
            <>
              <MoonIcon className="h-3.5 w-3.5" />
              Trải nghiệm người dùng
            </>
          }
          title="Trợ năng & Giao diện"
          description="Đơn giản hóa trải nghiệm và tùy chỉnh giao diện ứng dụng theo cách của bạn."
        />

        <div className="space-y-8">
          <section>
            <SettingsSectionTitle>Hiển thị</SettingsSectionTitle>
            <div className="border-t border-gray-150">
              <div className="py-3.5 flex justify-between items-center border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">
                    Chế độ tối (Dark Mode)
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Giảm ánh sáng màn hình, dễ nhìn hơn ban đêm
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={darkMode}
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    darkMode ? "bg-violet-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`size-3.5 rounded-full bg-white shadow-xs transition-transform ${
                      darkMode ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section>
            <SettingsSectionTitle>Thông báo</SettingsSectionTitle>
            <div className="border-t border-gray-150 divide-y divide-gray-100">
              {notificationSettingLists.map((item) => (
                <NotificationItem
                  key={item.key}
                  label={item.label}
                  value={notificationSettings[item.key]}
                  onChange={(val) => updateNotificationSetting(item.key, val)}
                  isOpen={openDropDown === item.key}
                  onToggle={() =>
                    setOpenDropDown(openDropDown === item.key ? null : item.key)
                  }
                  placement={item.placement || "bottom"}
                />
              ))}
            </div>
          </section>
        </div>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
