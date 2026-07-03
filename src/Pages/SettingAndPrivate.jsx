import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import InputPassword from "../Components/InputPassword.jsx";
import ConfirmPopUp from "../Components/ConfirmPopUp.jsx";
import { useToastContext } from "../Components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import SettingsPageLayout, {
  SettingsCard,
  SettingsPageHeader,
  SettingsSectionTitle,
} from "../Components/SettingsLayout.jsx";

const securityItems = [
  { key: "email", name: "Địa chỉ email" },
  { key: "phoneNumber", name: "Số điện thoại" },
  { key: "changePassword", name: "Thay đổi mật khẩu" },
  { key: "pin", name: "Mã PIN - Khóa cấp 2" },
];

const passwordFields = [
  { key: "oldPassword", name: "Nhập mật khẩu hiện tại của bạn" },
  { key: "newPassword", name: "Nhập mật khẩu mới của bạn" },
  { key: "newPassword2", name: "Nhập lại mật khẩu mới của bạn" },
];

function PrimaryButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function InfoBox({ children, className = "" }) {
  return (
    <div className={`bg-gray-50 border border-gray-150 p-4 rounded-lg text-gray-500 text-xs leading-relaxed ${className}`}>
      {children}
    </div>
  );
}

export default function SettingAndPrivate() {
  const showToast = useToastContext();
  const [emailValue, setEmailValue] = useState("");
  const [phoneNumberValue, setPhoneNumberValue] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [edit, setEdit] = useState(false);
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
  const [open, setOpen] = useState("main");

  const { currentUser, refreshUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      setEmailValue(currentUser.email || "");
      setPhoneNumberValue(currentUser.phoneNumber || "");
      setPinValue(currentUser.pin || "");
    }
  }, [currentUser]);

  const handleOpenTab = (tab) => {
    setOpen(tab);
    setEdit(false);
    setConfirm(false);
  };

  const handleBack = () => {
    setOpen("main");
    setEdit(false);
    setConfirm(false);
  };

  const handleUpdateSecurity = async (payload) => {
    try {
      const response = await fetch("/api/user/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        showToast("Cập nhật thành công!", "success");
        refreshUser();
      } else {
        const err = await response.json();
        showToast(err.message || "Có lỗi xảy ra!", "error");
        refreshUser();
      }
    } catch {
      showToast("Lỗi kết nối!", "error");
      refreshUser();
    }
  };

  const handleUpdatePassword = async () => {
    if (password.newPassword !== password.newPassword2) {
      showToast("Mật khẩu mới không khớp!", "error");
      return;
    }
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
        }),
      });
      if (response.ok) {
        showToast("Đổi mật khẩu thành công!", "success");
        setPassword({ oldPassword: "", newPassword: "", newPassword2: "" });
      } else {
        const err = await response.json();
        showToast(err.message || "Có lỗi xảy ra!", "error");
      }
    } catch {
      showToast("Lỗi kết nối!", "error");
    }
  };

  const getItemInfo = (key) => {
    if (key === "email") return emailValue || "Thêm địa chỉ email";
    if (key === "phoneNumber") return phoneNumberValue || "Thêm số điện thoại";
    if (key === "pin") return pinValue ? "Đã thiết lập" : "Bạn chưa tạo";
    return "";
  };

  const SaveButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="text-violet-600 hover:text-violet-800 p-1.5 rounded-lg shrink-0"
    >
      <CheckCircleIcon className="size-5" />
    </button>
  );

  const DeleteButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg"
    >
      <MinusCircleIcon className="size-5" />
    </button>
  );

  const inputClass =
    "flex-1 border-b border-gray-250 focus:border-violet-500 py-1.5 outline-none text-sm bg-transparent";

  return (
    <SettingsPageLayout>
      <SettingsCard>
        {open === "main" && (
          <div>
            <SettingsPageHeader
              badge={
                <>
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Bảo mật tài khoản
                </>
              }
              title="Truy cập & Bảo mật"
              description="Quản lý thông tin xác thực và bảo vệ tài khoản của bạn."
            />

            <div>
              <SettingsSectionTitle>Thông tin đăng nhập</SettingsSectionTitle>
              <div className="flex flex-col border-t border-gray-150">
                {securityItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="py-3 border-b border-gray-100 flex justify-between items-center text-left group hover:bg-gray-50/50 -mx-2.5 px-2.5 rounded-lg transition-colors"
                    onClick={() => handleOpenTab(item.key)}
                  >
                    <span className="text-xs font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-gray-400 text-xs truncate max-w-[180px] sm:max-w-none">
                        {getItemInfo(item.key)}
                      </span>
                      <ChevronRightIcon className="size-3.5 text-gray-300 group-hover:text-violet-500 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {open === "email" && (
          <div>
            <button
              type="button"
              className="flex items-center text-gray-400 hover:text-violet-600 mb-6 w-fit group"
              onClick={handleBack}
            >
              <ChevronLeftIcon className="size-4 mr-1.5" />
              <span className="text-xs font-medium">Quay lại</span>
            </button>

            <SettingsPageHeader
              title="Địa chỉ Email"
              description="Quản lý địa chỉ email liên kết với tài khoản của bạn."
            />

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Email chính</div>
              {edit ? (
                <div className="flex items-center max-w-sm gap-2">
                  <input
                    className={inputClass}
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    type="email"
                    placeholder="Nhập email..."
                    autoFocus
                  />
                  <SaveButton
                    onClick={() => {
                      setEdit(false);
                      handleUpdateSecurity({ email: emailValue });
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 max-w-sm">
                  <span className="text-xs text-gray-700 font-medium">
                    {emailValue || "Chưa cập nhật email"}
                  </span>
                  {emailValue && <DeleteButton onClick={() => setConfirm(true)} />}
                </div>
              )}

              {confirm && (
                <div className="mt-3.5">
                  <ConfirmPopUp
                    confirm={() => {
                      setConfirm(false);
                      setEmailValue("");
                      handleUpdateSecurity({ email: "" });
                    }}
                    cancel={() => setConfirm(false)}
                  />
                </div>
              )}
            </div>

            <PrimaryButton
              className="mt-6"
              onClick={() => setEdit((prev) => !prev)}
            >
              {emailValue ? "Đổi địa chỉ email" : "Thêm địa chỉ email"}
            </PrimaryButton>
          </div>
        )}

        {open === "phoneNumber" && (
          <div>
            <button
              type="button"
              className="flex items-center text-gray-400 hover:text-violet-600 mb-6 w-fit group"
              onClick={handleBack}
            >
              <ChevronLeftIcon className="size-4 mr-1.5" />
              <span className="text-xs font-medium">Quay lại</span>
            </button>

            <SettingsPageHeader
              title="Số điện thoại"
              description="Tăng cường bảo mật bằng cách thêm xác minh bổ sung qua số điện thoại."
            />

            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Số điện thoại chính
              </div>
              {edit ? (
                <div className="flex items-center max-w-sm gap-2">
                  <input
                    className={inputClass}
                    type="tel"
                    value={phoneNumberValue}
                    onChange={(e) => setPhoneNumberValue(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    autoFocus
                  />
                  <SaveButton
                    onClick={() => {
                      setEdit(false);
                      handleUpdateSecurity({ phoneNumber: phoneNumberValue });
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 max-w-sm">
                  <span className="text-xs text-gray-700 font-medium">
                    {phoneNumberValue || "Chưa cập nhật số điện thoại"}
                  </span>
                  {phoneNumberValue && <DeleteButton onClick={() => setConfirm(true)} />}
                </div>
              )}

              {confirm && (
                <div className="mt-3.5">
                  <ConfirmPopUp
                    confirm={() => {
                      setConfirm(false);
                      setPhoneNumberValue("");
                      handleUpdateSecurity({ phoneNumber: "" });
                    }}
                    cancel={() => setConfirm(false)}
                  />
                </div>
              )}
            </div>

            <InfoBox className="mt-6">
              <p className="mb-1.5 font-semibold text-gray-700">
                Lý do thêm số điện thoại?
              </p>
              <p className="mb-1 text-[11px]">
                Đây là cách tiện lợi nhất để đặt lại mật khẩu và lấy lại tài khoản nếu bạn gặp sự cố.
              </p>
              <p className="text-[11px] text-gray-400">
                Chúng tôi cam kết không gửi thư rác hay tiết lộ thông tin của bạn.
              </p>
            </InfoBox>

            <PrimaryButton
              className="mt-6"
              onClick={() => setEdit((prev) => !prev)}
            >
              {phoneNumberValue ? "Đổi số điện thoại" : "Thêm số điện thoại"}
            </PrimaryButton>
          </div>
        )}

        {open === "changePassword" && (
          <div>
            <button
              type="button"
              className="flex items-center text-gray-400 hover:text-violet-600 mb-6 w-fit group"
              onClick={handleBack}
            >
              <ChevronLeftIcon className="size-4 mr-1.5" />
              <span className="text-xs font-medium">Quay lại</span>
            </button>

            <SettingsPageHeader
              title="Thay đổi mật khẩu"
              description="Tạo mật khẩu mạnh dài ít nhất 8 ký tự để bảo vệ tài khoản."
            />

            <div className="space-y-3.5 max-w-sm">
              {passwordFields.map((item) => (
                <div key={item.key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {item.name}
                  </label>
                  <InputPassword
                    name=""
                    tab={item.key}
                    value={password[item.key]}
                    show={showPassword[item.key]}
                    onChange={(e) =>
                      setPassword((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                    onToggle={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <PrimaryButton className="mt-6" onClick={handleUpdatePassword}>
              Cập nhật mật khẩu
            </PrimaryButton>
          </div>
        )}

        {open === "pin" && (
          <div>
            <button
              type="button"
              className="flex items-center text-gray-400 hover:text-violet-600 mb-6 w-fit group"
              onClick={handleBack}
            >
              <ChevronLeftIcon className="size-4 mr-1.5" />
              <span className="text-xs font-medium">Quay lại</span>
            </button>

            <SettingsPageHeader
              title="Mã khóa (PIN)"
              description="Tăng bảo mật với lớp xác thực cấp 2."
            />

            <InfoBox>
              <p className="text-center font-medium">
                Mã PIN đóng vai trò là lớp bảo mật cấp 2, được sử dụng để xác nhận các tính năng và thông tin quan trọng.
              </p>
            </InfoBox>

            <div className="max-w-xs mx-auto mt-6">
              {edit ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="password"
                    autoComplete="new-password"
                    maxLength={6}
                    value={pinValue}
                    onChange={(e) => setPinValue(e.target.value)}
                    placeholder="Nhập PIN 6 số"
                    className="w-full text-center tracking-[0.5em] text-lg font-bold py-2 outline-none border-b border-gray-250 focus:border-violet-500 bg-transparent"
                  />
                  <SaveButton
                    onClick={() => {
                      setEdit(false);
                      handleUpdateSecurity({ pin: pinValue });
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center gap-3">
                  <span className="text-xl font-bold tracking-[0.5em] text-gray-500">
                    {pinValue ? "••••••" : "Chưa thiết lập"}
                  </span>
                  {pinValue && <DeleteButton onClick={() => setConfirm(true)} />}
                </div>
              )}

              {confirm && (
                <div className="mt-3.5">
                  <ConfirmPopUp
                    confirm={() => {
                      setConfirm(false);
                      setPinValue("");
                      handleUpdateSecurity({ pin: "" });
                    }}
                    cancel={() => setConfirm(false)}
                  />
                </div>
              )}

              <div className="flex justify-center mt-6">
                <PrimaryButton onClick={() => setEdit((prev) => !prev)}>
                  {pinValue ? "Sửa mã PIN" : "Tạo mã PIN"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </SettingsCard>
    </SettingsPageLayout>
  );
}
