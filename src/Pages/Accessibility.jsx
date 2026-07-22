import { useState } from "react";
import {
  BellIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  LanguageIcon,
  MoonIcon,
  NewspaperIcon,
  ScaleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from "../Components/SettingsLayout.jsx";
import StyledSelect from "../Components/StyledSelect.jsx";

const notificationOptions = [
  { value: "instant", label: "Ngay lập tức" },
  { value: "daily", label: "Tổng hợp hằng ngày" },
  { value: "weekly", label: "Tổng hợp hằng tuần" },
  { value: "off", label: "Tắt thông báo" },
];

const notificationSettingLists = [
  {
    key: "jobSearch",
    label: "Việc làm phù hợp",
    description: "Công việc mới phù hợp với hồ sơ và tiêu chí tìm kiếm.",
    icon: BriefcaseIcon,
  },
  {
    key: "message",
    label: "Tin nhắn",
    description: "Tin nhắn mới từ nhà tuyển dụng và hệ thống.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    key: "updateMarket",
    label: "Xu hướng thị trường",
    description: "Cập nhật nhu cầu tuyển dụng và mức lương mới.",
    icon: ArrowTrendingUpIcon,
  },
  {
    key: "news",
    label: "Tin tức và báo cáo",
    description: "Bài viết nghề nghiệp, báo cáo và nội dung nổi bật.",
    icon: NewspaperIcon,
  },
  {
    key: "postComment",
    label: "Hoạt động cộng đồng",
    description: "Phản hồi liên quan đến bài đăng và bình luận của bạn.",
    icon: UserGroupIcon,
  },
];

function SettingSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        checked ? "bg-violet-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function PreferenceRow({ icon: Icon, title, description, children }) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 py-4 last:border-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-800">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">{description}</span>
      </span>
      {children}
    </div>
  );
}

function NotificationPreference({ item, value, onChange }) {
  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-slate-800">{item.label}</h3>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.description}</p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <StyledSelect
          label={`Tần suất nhận thông báo ${item.label}`}
          value={value}
          onChange={onChange}
          options={notificationOptions}
          className="sm:w-[220px]"
        />
      </div>
    </div>
  );
}

export default function Accessibility() {
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [notificationSettings, setNotificationSettings] = useState({
    jobSearch: "instant",
    message: "instant",
    updateMarket: "weekly",
    news: "daily",
    postComment: "off",
  });

  const updateNotificationSetting = (key, value) => {
    setNotificationSettings((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <SettingsPageLayout>
      <div className="w-full space-y-4">
        <SettingsCard>
          <SettingsPageHeader
            badge={
              <>
                <ComputerDesktopIcon className="h-3.5 w-3.5" />
                Trải nghiệm
              </>
            }
            title="Trợ năng & Giao diện"
            description="Điều chỉnh cách RabbitCV hiển thị để phù hợp với thói quen sử dụng của bạn."
          />

          <div className="border-t border-slate-100">
            <PreferenceRow
              icon={MoonIcon}
              title="Chế độ tối"
              description="Giảm độ sáng khi sử dụng vào ban đêm."
            >
              <SettingSwitch checked={darkMode} onChange={setDarkMode} label="Bật chế độ tối" />
            </PreferenceRow>

            <PreferenceRow
              icon={DocumentTextIcon}
              title="Cỡ chữ lớn"
              description="Tăng kích thước nội dung để dễ đọc hơn."
            >
              <SettingSwitch checked={largeText} onChange={setLargeText} label="Bật cỡ chữ lớn" />
            </PreferenceRow>

            <PreferenceRow
              icon={ScaleIcon}
              title="Tương phản cao"
              description="Làm rõ chữ, đường viền và nút bấm."
            >
              <SettingSwitch checked={highContrast} onChange={setHighContrast} label="Bật tương phản cao" />
            </PreferenceRow>

            <PreferenceRow
              icon={LanguageIcon}
              title="Ngôn ngữ"
              description="Ngôn ngữ sử dụng trong giao diện."
            >
              <StyledSelect
                label="Chọn ngôn ngữ giao diện"
                value={language}
                onChange={setLanguage}
                options={[
                  { value: "vi", label: "Tiếng Việt" },
                  { value: "en", label: "English" },
                ]}
              />
            </PreferenceRow>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <BellIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Thông báo</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Chọn tần suất nhận cập nhật cho từng nhóm nội dung.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {notificationSettingLists.map((item) => (
              <NotificationPreference
                key={item.key}
                item={item}
                value={notificationSettings[item.key]}
                onChange={(value) => updateNotificationSetting(item.key, value)}
              />
            ))}
          </div>
        </SettingsCard>
      </div>
    </SettingsPageLayout>
  );
}
