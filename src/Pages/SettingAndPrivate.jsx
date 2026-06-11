import { useState, useEffect } from "react";
import "../App.css";
import React from "react";
import Header from "../Components/Header.jsx";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";
import InputPassword from "../Components/InputPassword.jsx";
import AddEmail from "../Components/AddEmail.jsx";
import ConfirmPopUp from "../Components/ConfirmPopUp.jsx";
import { useToastContext } from "../Components/Toast.jsx";
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
      const response = await fetch("/api/me", {
        credentials: "include",
      });
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

  const ShowHidePassword = (key) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ComponentList = [
    {
      key: "email",
      name: "Địa chỉ email",
      info: emailValue,
    },
    {
      key: "phoneNumber",
      name: "Số điện thoại",
      info: phoneNumberValue,
    },
    {
      key: "changePassword",
      name: "Thay đổi mật khẩu",
      info: "",
    },
    {
      key: "pin",
      name: "Mã PIN - Khóa cấp 2",
      info: pinValue ? "Đã thiết lập" : "Bạn chưa tạo",
    },
  ];

  const SubEmailList = [
    { name: "vinhvt7749@gmail.com" },
    { name: "vinh.nguyen619@hcmut.edu.vn" },
    { name: "vinhvt278@gmail.com" },
    { name: "abcxyz@hr.sc.com" },
  ];

  const ChangePassword = [
    { key: "oldPassword", name: "Nhập mật khẩu hiện tại của bạn" },
    { key: "newPassword", name: "Nhập mật khẩu mới của bạn" },
    { key: "newPassword2", name: "Nhập lại mật khẩu mới của bạn" },
  ];

  const AccessComponent = ({ name, info, tab }) => {
    return (
      <div
        className="py-5 border-b border-gray-100 flex justify-between items-center cursor-pointer group"
        onClick={() => setOpen(tab)}
      >
        <span className="text-[15px] font-medium text-gray-900 group-hover:text-black">
          {name}
        </span>
        <div className="flex items-center">
          <span className="text-gray-500 text-sm mr-4 group-hover:text-gray-700">
            {tab === "email" || tab === "phoneNumber"
              ? info
                ? info
                : `Thêm ${name.toLowerCase()}`
              : info}
          </span>
          <ChevronRightIcon className="size-4 text-gray-400 group-hover:text-gray-900" />
        </div>
      </div>
    );
  };

  const BackButton = () => (
    <div
      className="flex items-center cursor-pointer text-gray-500 hover:text-black mb-10 w-fit group"
      onClick={() => setOpen("main")}
    >
      <ChevronLeftIcon className="size-4 mr-2 group-hover:-translate-x-1" />
      <span className="text-sm font-medium">Quay lại</span>
    </div>
  );

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <Header />

      <div className="pt-10 flex items-start max-w-6xl mx-auto w-full px-4 lg:px-8 gap-8 pb-20">
        <div className="top-0 bg-white rounded-3xl pr-2 pl-7 pb-5 shrink-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-[#ffffff]">
          <StickyProfileSettings />
        </div>

        <div className="flex-1 min-w-0 flex justify-center relative">
          <div className="w-full max-w-[800px] bg-white rounded-3xl border border-gray-50 shadow-[0_2px_20px_rgba(0,0,0,0.03)] overflow-hidden pb-12">
            <div className="px-10 pt-10">
              {open === "main" && (
                <div className="animate-fade-in">
                  <div className="mb-12">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                      Truy cập & Bảo mật
                    </h1>
                    <p className="text-gray-500 text-sm">
                      Quản lý thông tin xác thực và bảo vệ tài khoản của bạn.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Thông tin đăng nhập
                    </h3>
                    <div className="flex flex-col border-t border-gray-100">
                      {ComponentList.map((item) => (
                        <AccessComponent
                          name={item.name}
                          info={item.info}
                          key={item.key}
                          tab={item.key}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {open === "email" && (
                <div className="animate-fade-in">
                  <BackButton />
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      Địa chỉ Email
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Quản lý địa chỉ email liên kết với tài khoản của bạn.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-4">
                        Email chính
                      </div>
                      {edit ? (
                        <div className="flex items-center max-w-sm">
                          <input
                            className="flex-1 border-b-2 border-gray-200 focus:border-black py-2 outline-none text-base"
                            value={emailValue}
                            onChange={(e) => setEmailValue(e.target.value)}
                            type="email"
                            placeholder="Nhập email..."
                            autoFocus
                          />
                          <div
                            className="text-white bg-black hover:bg-gray-800 p-1.5 rounded-full ml-3 cursor-pointer"
                            onClick={() => {
                              setEdit(false);
                              handleUpdateSecurity({ email: emailValue });
                            }}
                          >
                            <CheckCircleIcon className="size-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between border-b border-gray-100 py-3">
                          <span className="text-base text-gray-700">
                            {emailValue ? emailValue : "Chưa cập nhật email"}
                          </span>
                          {emailValue && (
                            <div
                              className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full cursor-pointer"
                              onClick={() => setConfirm(true)}
                            >
                              <MinusCircleIcon className="size-5" />
                            </div>
                          )}
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
                  </div>

                  <div
                    className="mt-10 px-6 py-2.5 w-fit rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 cursor-pointer"
                    onClick={() => setEdit((prev) => !prev)}
                  >
                    {emailValue ? "Đổi địa chỉ email" : "Thêm địa chỉ email"}
                  </div>
                </div>
              )}

              {open === "phoneNumber" && (
                <div className="animate-fade-in">
                  <BackButton />
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      Số điện thoại
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Tăng cường bảo mật bằng cách thêm xác minh bổ sung qua số
                      điện thoại.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-4">
                        Số điện thoại chính
                      </div>
                      {edit ? (
                        <div className="flex items-center max-w-sm">
                          <input
                            className="flex-1 border-b-2 border-gray-200 focus:border-black py-2 outline-none text-base"
                            type="number"
                            value={phoneNumberValue}
                            onChange={(e) =>
                              setPhoneNumberValue(e.target.value)
                            }
                            placeholder="Nhập số điện thoại..."
                            autoFocus
                          />
                          <div
                            className="text-white bg-black hover:bg-gray-800 p-1.5 rounded-full ml-3 cursor-pointer"
                            onClick={() => {
                              setEdit(false);
                              handleUpdateSecurity({
                                phoneNumber: phoneNumberValue,
                              });
                            }}
                          >
                            <CheckCircleIcon className="size-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between border-b border-gray-100 py-3">
                          <span className="text-base text-gray-700">
                            {phoneNumberValue
                              ? phoneNumberValue
                              : "Chưa cập nhật số điện thoại"}
                          </span>
                          {phoneNumberValue && (
                            <div
                              className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full cursor-pointer"
                              onClick={() => setConfirm(true)}
                            >
                              <MinusCircleIcon className="size-5" />
                            </div>
                          )}
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

                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-8">
                      <p className="text-sm text-gray-600 mb-3">
                        Lý do thêm số điện thoại? Đây là cách tiện lợi nhất để
                        đặt lại mật khẩu và lấy lại tài khoản nếu bạn gặp sự cố.
                      </p>
                      <p className="text-sm text-gray-500">
                        Chúng tôi cam kết không gửi thư rác hay tiết lộ thông
                        tin của bạn. Bạn luôn có quyền quản lý thông báo hiển
                        thị.
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-10 px-6 py-2.5 w-fit rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 cursor-pointer"
                    onClick={() => setEdit((prev) => !prev)}
                  >
                    {phoneNumberValue
                      ? "Đổi số điện thoại"
                      : "Thêm số điện thoại"}
                  </div>
                </div>
              )}

              {open === "changePassword" && (
                <div className="animate-fade-in">
                  <BackButton />
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      Thay đổi mật khẩu
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Tạo mật khẩu mạnh dài ít nhất 8 ký tự để bảo vệ tài khoản.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-sm">
                    {ChangePassword.map((item) => (
                      <div className="mb-4" key={item.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {item.name}
                        </label>
                        <InputPassword
                          name={""}
                          tab={item.key}
                          value={password[item.key]}
                          show={showPassword[item.key]}
                          onChange={(e) =>
                            setPassword((prev) => ({
                              ...prev,
                              [item.key]: e.target.value,
                            }))
                          }
                          onToggle={() => ShowHidePassword(item.key)}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-10 px-6 py-2.5 w-fit rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 cursor-pointer"
                    onClick={handleUpdatePassword}
                  >
                    Cập nhật mật khẩu
                  </div>
                </div>
              )}

              {open === "pin" && (
                <div className="animate-fade-in">
                  <BackButton />
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      Mã khóa (Passkey)
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Tăng bảo mật với thiết bị cá nhân.
                    </p>
                  </div>

                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed text-center">
                      Mã khóa PIN đóng vai trò là lớp bảo mật cấp 2, được sử
                      dụng để xác nhận các tính năng và thông tin quan trọng.
                    </p>
                  </div>

                  <div className="max-w-sm mx-auto mt-6">
                    {edit ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="password"
                          autoComplete="new-password"
                          maxLength="6"
                          value={pinValue}
                          onChange={(e) => setPinValue(e.target.value)}
                          placeholder="Nhập PIN 6 số"
                          className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 outline-none border-b-2 border-gray-300 focus:border-black"
                        />
                        <div
                          className="text-white bg-black hover:bg-gray-800 p-2 rounded-full cursor-pointer shrink-0"
                          onClick={() => {
                            setEdit(false);
                            handleUpdateSecurity({ pin: pinValue });
                          }}
                        >
                          <CheckCircleIcon className="size-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center">
                        <span className="text-2xl font-bold tracking-[0.5em] text-gray-500 mr-4">
                          {pinValue ? "••••••" : ""}
                        </span>
                        {pinValue && (
                          <div
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full cursor-pointer"
                            onClick={() => setConfirm(true)}
                          >
                            <MinusCircleIcon className="size-5" />
                          </div>
                        )}
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

                    <div
                      className="mt-10 px-6 py-2.5 w-fit mx-auto rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 cursor-pointer text-center block"
                      onClick={() => setEdit((prev) => !prev)}
                    >
                      {pinValue ? "Sửa mã PIN" : "Tạo mã PIN"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
