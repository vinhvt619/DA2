import { useState } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  EyeIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import PasswordUpdateForm from '../Components/PasswordUpdateForm.jsx';
import StyledSelect from "../Components/StyledSelect.jsx";
import { showToast } from "../utils/toast.js";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from "../Components/SettingsLayout.jsx";

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

function PrivacyRow({ icon: Icon, title, description, danger = false, children }) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 py-4 last:border-0">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          danger ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-violet-700"
        }`}
      >
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

export default function SettingAndPrivate() {
  const [profileVisibility, setProfileVisibility] = useState("recruiters");
  const [jobAlerts, setJobAlerts] = useState(true);
  return (
    <SettingsPageLayout>
      <div className="w-full space-y-4">
        <SettingsCard>
          <SettingsPageHeader
            badge={
              <>
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Tài khoản
              </>
            }
            title="Quyền riêng tư"
            description="Kiểm soát cách hồ sơ và dữ liệu của bạn được sử dụng trên RabbitCV."
          />

          <div className="border-t border-slate-100">
            <PrivacyRow
              icon={EyeIcon}
              title="Hiển thị hồ sơ"
              description="Chọn ai có thể xem hồ sơ nghề nghiệp của bạn."
            >
              <StyledSelect
                label="Ai có thể xem hồ sơ"
                value={profileVisibility}
                onChange={setProfileVisibility}
                options={[
                  { value: "recruiters", label: "Nhà tuyển dụng" },
                  { value: "private", label: "Chỉ mình tôi" },
                ]}
              />
            </PrivacyRow>

            <PrivacyRow
              icon={BellIcon}
              title="Cập nhật tuyển dụng"
              description="Nhận thông báo về công việc phù hợp với hồ sơ."
            >
              <SettingSwitch checked={jobAlerts} onChange={setJobAlerts} label="Nhận cập nhật tuyển dụng" />
            </PrivacyRow>

            <PrivacyRow
              icon={UserMinusIcon}
              title="Ngừng sử dụng tài khoản"
              description="Tạm ẩn hồ sơ và hoạt động của bạn."
              danger
            >
              <button
                type="button"
                onClick={() => showToast("Tính năng quản lý trạng thái tài khoản đang được phát triển.", "info")}
                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Quản lý
              </button>
            </PrivacyRow>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <KeyIcon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Thay đổi mật khẩu</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                Nhập email hoặc số điện thoại của tài khoản, mật khẩu mới và xác nhận mật khẩu mới.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <PasswordUpdateForm />

            <aside className="rounded-xl border border-violet-100 bg-violet-50/70 p-4" aria-label="Yêu cầu mật khẩu">
              <p className="text-xs font-bold text-slate-800">Mật khẩu an toàn</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Hãy dùng mật khẩu riêng cho RabbitCV và không chia sẻ với người khác.
              </p>
              <ul className="mt-3 space-y-2.5">
                {["Có ít nhất 8 ký tự", "Khác mật khẩu hiện tại", "Hai mật khẩu mới trùng khớp"].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-[11px] leading-4 text-slate-600">
                    <CheckCircleIcon className="mt-px h-4 w-4 shrink-0 text-violet-600" />
                    {rule}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </SettingsCard>
      </div>
    </SettingsPageLayout>
  );
}
