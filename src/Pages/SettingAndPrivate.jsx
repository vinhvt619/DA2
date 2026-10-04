import { useState } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  EyeIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import InputPassword from "../Components/InputPassword.jsx";
import StyledSelect from "../Components/StyledSelect.jsx";
import { showToast } from "../utils/toast.js";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
} from "../Components/SettingsLayout.jsx";

const passwordFields = [
  { key: "oldPassword", label: "Mật khẩu hiện tại" },
  { key: "newPassword", label: "Mật khẩu mới" },
  { key: "newPassword2", label: "Nhập lại mật khẩu mới" },
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
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [contact, setContact] = useState("");
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    newPassword2: false,
  });
  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
    newPassword2: "",
  });

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (updatingPassword) return;
    if (!contact.trim()) {
      showToast("Vui lòng nhập email hoặc số điện thoại đã lưu trong tài khoản.", "error");
      return;
    }
    if (!password.oldPassword || !password.newPassword || !password.newPassword2) {
      showToast("Vui lòng nhập đầy đủ thông tin mật khẩu.", "error");
      return;
    }

    if (password.newPassword.length < 8) {
      showToast("Mật khẩu mới phải có ít nhất 8 ký tự.", "error");
      return;
    }

    if (password.newPassword !== password.newPassword2) {
      showToast("Mật khẩu mới không khớp.", "error");
      return;
    }
    if (password.newPassword === password.oldPassword) {
      showToast("Mật khẩu mới phải khác mật khẩu hiện tại.", "error");
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
          contact: contact.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.message || "Không thể cập nhật mật khẩu.", "error");
        return;
      }

      setPassword({ oldPassword: "", newPassword: "", newPassword2: "" });
      setContact("");
      showToast("Đổi mật khẩu thành công.", "success");
    } catch {
      showToast("Lỗi kết nối đến máy chủ.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

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
                Nhập đúng email hoặc số điện thoại đã lưu trong tài khoản và mật khẩu hiện tại để đổi mật khẩu.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <form onSubmit={handleUpdatePassword} aria-label="Thay đổi mật khẩu">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="password-contact" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email hoặc số điện thoại xác nhận
                  </label>
                  <input
                    id="password-contact"
                    name="contact"
                    type="text"
                    required
                    maxLength={254}
                    autoComplete="off"
                    aria-describedby="password-contact-help"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="Nhập email hoặc số điện thoại của tài khoản"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                  <p id="password-contact-help" className="mt-1.5 text-[11px] leading-4 text-slate-500">
                    Chỉ cần nhập một trong hai. Nếu chưa lưu số điện thoại, hãy sử dụng email tài khoản.
                  </p>
                </div>
                {passwordFields.map((field, index) => (
                  <div key={field.key} className={index === 0 ? "sm:col-span-2" : ""}>
                    <label
                      htmlFor={field.key}
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      {field.label}
                    </label>
                    <InputPassword
                      id={field.key}
                      name={field.key}
                      value={password[field.key]}
                      show={showPassword[field.key]}
                      placeholder={field.label}
                      autoComplete={index === 0 ? "off" : "new-password"}
                      preventAutofill={index === 0}
                      onChange={(event) =>
                        setPassword((previous) => ({ ...previous, [field.key]: event.target.value }))
                      }
                      onToggle={() =>
                        setShowPassword((previous) => ({ ...previous, [field.key]: !previous[field.key] }))
                      }
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {updatingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>

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
