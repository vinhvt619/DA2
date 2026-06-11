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
      className={`px-5 py-2.5 rounded-xl bg-violet-800 hover:bg-violet-900 text-white text-sm font-semibold shadow-md transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function InfoBox({ children, className = "" }) {
  return (
    <div className={`bg-violet-100 border border-violet-200 p-5 rounded-2xl ${className}`}>
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

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setEmailValue(data.user.email || "");
          setPhoneNumberValue(data.user.phoneNumber || "");
          setPinValue(data.user.pin || "");
        }
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
      } else {
        const err = await response.json();
        showToast(err.message || "Có lỗi xảy ra!", "error");
        fetchUserData();
      }
    } catch {
      showToast("Lỗi kết nối!", "error");
      fetchUserData();
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
      className="text-white bg-violet-800 hover:bg-violet-900 p-1.5 rounded-full shrink-0 transition-colors"
    >
      <CheckCircleIcon className="size-5" />
    </button>
  );

  const DeleteButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
    >
      <MinusCircleIcon className="size-5" />
    </button>
  );

  const inputClass =
    "flex-1 border-b-2 border-violet-200 focus:border-violet-700 py-2 outline-none text-base bg-transparent";

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
                      <div className="flex flex-col border-t border-violet-100">
                        {securityItems.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className="py-4 border-b border-violet-50 flex justify-between items-center text-left group hover:bg-violet-50/60 -mx-3 px-3 rounded-lg transition-colors"
                            onClick={() => handleOpenTab(item.key)}
                          >
                            <span className="text-sm font-semibold text-gray-900 group-hover:text-violet-900">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-500 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                                {getItemInfo(item.key)}
                              </span>
                              <ChevronRightIcon className="size-4 text-violet-400 group-hover:text-violet-700 shrink-0" />
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
                      className="flex items-center text-gray-600 hover:text-violet-800 mb-8 w-fit group transition-colors"
                      onClick={handleBack}
                    >
                      <ChevronLeftIcon className="size-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    <SettingsPageHeader
                      title="Địa chỉ Email"
                      description="Quản lý địa chỉ email liên kết với tài khoản của bạn."
                    />

                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-4">Email chính</div>
                      {edit ? (
                        <div className="flex items-center max-w-md gap-2">
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
                        <div className="flex items-center justify-between border-b border-violet-100 py-3">
                          <span className="text-sm text-gray-700">
                            {emailValue || "Chưa cập nhật email"}
                          </span>
                          {emailValue && <DeleteButton onClick={() => setConfirm(true)} />}
                        </div>
                      )}

                      {confirm && (
                        <div className="mt-4">
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
                      className="mt-8"
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
                      className="flex items-center text-gray-600 hover:text-violet-800 mb-8 w-fit group transition-colors"
                      onClick={handleBack}
                    >
                      <ChevronLeftIcon className="size-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    <SettingsPageHeader
                      title="Số điện thoại"
                      description="Tăng cường bảo mật bằng cách thêm xác minh bổ sung qua số điện thoại."
                    />

                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-4">
                        Số điện thoại chính
                      </div>
                      {edit ? (
                        <div className="flex items-center max-w-md gap-2">
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
                        <div className="flex items-center justify-between border-b border-violet-100 py-3">
                          <span className="text-sm text-gray-700">
                            {phoneNumberValue || "Chưa cập nhật số điện thoại"}
                          </span>
                          {phoneNumberValue && <DeleteButton onClick={() => setConfirm(true)} />}
                        </div>
                      )}

                      {confirm && (
                        <div className="mt-4">
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

                    <InfoBox className="mt-8">
                      <p className="text-sm text-gray-700 mb-2">
                        Lý do thêm số điện thoại? Đây là cách tiện lợi nhất để đặt lại mật khẩu
                        và lấy lại tài khoản nếu bạn gặp sự cố.
                      </p>
                      <p className="text-sm text-gray-600">
                        Chúng tôi cam kết không gửi thư rác hay tiết lộ thông tin của bạn.
                      </p>
                    </InfoBox>

                    <PrimaryButton
                      className="mt-8"
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
                      className="flex items-center text-gray-600 hover:text-violet-800 mb-8 w-fit group transition-colors"
                      onClick={handleBack}
                    >
                      <ChevronLeftIcon className="size-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    <SettingsPageHeader
                      title="Thay đổi mật khẩu"
                      description="Tạo mật khẩu mạnh dài ít nhất 8 ký tự để bảo vệ tài khoản."
                    />

                    <div className="space-y-2 max-w-md">
                      {passwordFields.map((item) => (
                        <div key={item.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
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

                    <PrimaryButton className="mt-8" onClick={handleUpdatePassword}>
                      Cập nhật mật khẩu
                    </PrimaryButton>
                  </div>
                )}

                {open === "pin" && (
                  <div>
                    <button
                      type="button"
                      className="flex items-center text-gray-600 hover:text-violet-800 mb-8 w-fit group transition-colors"
                      onClick={handleBack}
                    >
                      <ChevronLeftIcon className="size-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    <SettingsPageHeader
                      title="Mã khóa (PIN)"
                      description="Tăng bảo mật với lớp xác thực cấp 2."
                    />

                    <InfoBox>
                      <p className="text-sm text-gray-700 leading-relaxed text-center">
                        Mã PIN đóng vai trò là lớp bảo mật cấp 2, được sử dụng để xác nhận các
                        tính năng và thông tin quan trọng.
                      </p>
                    </InfoBox>

                    <div className="max-w-sm mx-auto mt-6">
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
                            className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 outline-none border-b-2 border-violet-200 focus:border-violet-700 bg-transparent"
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
                          <span className="text-2xl font-bold tracking-[0.5em] text-gray-500">
                            {pinValue ? "••••••" : "Chưa thiết lập"}
                          </span>
                          {pinValue && <DeleteButton onClick={() => setConfirm(true)} />}
                        </div>
                      )}

                      {confirm && (
                        <div className="mt-4">
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

                      <div className="flex justify-center mt-8">
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
