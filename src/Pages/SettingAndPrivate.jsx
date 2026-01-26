import { useState } from "react";
import "./../../src/App.css";
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
export default function SettingAndPrivate() {
  const [emailValue, setEmailValue] = useState("v");
  const [phoneNumberValue, setPhoneNumberValue] = useState("");
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
      info: "**************",
    },
    {
      key: "pin",
      name: "Mã khóa",
      info: "****",
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
        className="text-base mt-5 p-1.5 border-b border-gray-300 cursor-pointer hover:underline"
        onClick={() => setOpen(tab)}
      >
        <div className="flex items-center justify-between">
          <div>{name}</div>
          <div className="flex items-center justify-center">
            <div className="text-gray-500 text-sm mr-5">
              {tab === "email" || tab === "phoneNumber"
                ? info
                  ? info
                  : `Bạn vẫn chưa thêm ${name} của mình`
                : ""}
            </div>
            <ChevronRightIcon className="size-4 text-gray-400 stroke-3" />
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-[#F8F4FC] h-full">
      <Header />
      <div className="pt-10 flex  items-start">
        <StickyProfileSettings />
        <div className="w-full mt-10 h-screen flex justify-center">
          <div className="border border-black h-fit w-[50%] bg-white rounded-2xl pb-2">
            <div className="p-5 h-full">
              {open === "main" && (
                <div>
                  <div className="text-lg font-bold">
                    Quyền truy cập vào tài khoản
                  </div>
                  {ComponentList.map((item) => (
                    <AccessComponent
                      name={item.name}
                      info={item.info}
                      key={item.key}
                      tab={item.key}
                    />
                  ))}
                </div>
              )}
              {open === "email" && (
                <div>
                  <div
                    className=" flex flex-row items-center cursor-pointer hover:underline"
                    onClick={() => setOpen("main")}
                  >
                    <ChevronLeftIcon className="size-4 text-gray-500" />
                    <div className="ml-3 text-gray-500 text-sm">Quay lại</div>
                  </div>
                  <div className="ml-5 mt-3">
                    <div>
                      <div className="font-medium">Địa chỉ email của bạn</div>
                      {edit ? (
                        <div className="flex items-center">
                          <input
                            className="border rounded-2xl p-1 text-sm px-3 py-1.5"
                            value={emailValue}
                            onChange={(e) => setEmailValue(e.target.value)}
                            type="email"
                          />
                          <div
                            className="text-green-400 hover:bg-green-400 hover:text-white p-0.5 rounded-2xl ml-1 cursor-pointer"
                            onClick={() => setEdit((prev) => !prev)}
                          >
                            <CheckCircleIcon className="size-5 stroke-3" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center ${emailValue ? "hover:underline cursor-pointer" : ""}`}
                          onClick={
                            emailValue
                              ? () => {
                                  setConfirm((prev) => !prev);
                                }
                              : null
                          }
                        >
                          <div className="text-sm text-gray-600">
                            {emailValue
                              ? emailValue
                              : "Bạn vẫn chưa thêm địa chỉ email của mình"}
                          </div>
                          {emailValue ? (
                            <div className="text-red-800 hover:bg-red-600 hover:text-white p-0.5 rounded-2xl ml-1">
                              <MinusCircleIcon className="size-4 stroke-3" />
                            </div>
                          ) : (
                            <div></div>
                          )}
                        </div>
                      )}

                      {confirm ? (
                        <ConfirmPopUp
                          confirm={() => {
                            setConfirm(false);
                            setEmailValue("");
                          }}
                          cancel={() => setConfirm(false)}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    {/* <div className="mt-3">
                      <div className="font-medium">Địa chỉ email phụ</div>
                      {SubEmailList.map((item) => (
                        <div className="text-sm text-gray-600" key={item.name}>
                          {item.name}
                        </div>
                      ))}
                    </div> */}
                  </div>
                  <div
                    className="border p-2 px-5 ml-4 mt-8 w-fit rounded-2xl border-cyan-500 text-cyan-500 text-xs hover:bg-cyan-500 hover:text-white hover:border-white cursor-pointer"
                    onClick={() => setEdit((prev) => !prev)}
                  >
                    {emailValue ? "Chỉnh sửa" : "Thêm"} địa chỉ email
                  </div>
                  {/* <div>
                    <AddEmail />
                  </div> */}
                </div>
              )}
              {open === "phoneNumber" && (
                <div>
                  <div
                    className=" flex flex-row items-center cursor-pointer hover:underline"
                    onClick={() => setOpen("main")}
                  >
                    <ChevronLeftIcon className="size-4 text-gray-500" />
                    <div className="ml-3 text-gray-500 text-sm">Quay lại</div>
                  </div>
                  <div className="ml-5 mt-3">
                    <div>
                      <div className="font-medium">Số điện thoại của bạn</div>
                      {edit ? (
                        <div className="flex items-center">
                          <input
                            className="border rounded-2xl p-1 text-sm px-3 py-1.5"
                            type="number"
                            value={phoneNumberValue}
                            onChange={(e) =>
                              setPhoneNumberValue(e.target.value)
                            }
                          />
                          <div
                            className="text-green-400 hover:bg-green-400 hover:text-white p-0.5 rounded-2xl ml-1 cursor-pointer"
                            onClick={() => setEdit((prev) => !prev)}
                          >
                            <CheckCircleIcon className="size-5 stroke-3" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center ${phoneNumberValue ? "hover:underline cursor-pointer" : ""}`}
                          onClick={
                            phoneNumberValue
                              ? () => {
                                  setConfirm((prev) => !prev);
                                }
                              : null
                          }
                        >
                          <div className="text-sm text-gray-600">
                            {phoneNumberValue
                              ? phoneNumberValue
                              : "Bạn vẫn chưa thêm số điện thoại của mình"}
                          </div>
                          {phoneNumberValue ? (
                            <div className="text-red-800 hover:bg-red-600 hover:text-white p-0.5 rounded-2xl ml-1">
                              <MinusCircleIcon className="size-4 stroke-3" />
                            </div>
                          ) : (
                            <div></div>
                          )}
                        </div>
                      )}
                      {confirm ? (
                        <ConfirmPopUp
                          confirm={() => {
                            setConfirm(false);
                            setPhoneNumberValue("");
                          }}
                          cancel={() => setConfirm(false)}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 pr-7 ">
                      <div>
                        Bạn muốn thêm số điện thoại ngay bây giờ? Đây là một
                        cách tiện lợi để đặt lại mật khẩu nếu bạn gặp sự cố.
                      </div>
                      <div className="mt-2">
                        Số điện thoại của bạn giúp chúng tôi bảo mật tài khoản
                        của bạn bằng cách thêm một lớp xác minh bổ sung. Số điện
                        thoại cũng giúp những người khác, những người đã có số
                        điện thoại của bạn, có thể khám phá và kết nối với bạn.
                        Bạn luôn có thể quyết định cách bạn muốn sử dụng số điện
                        thoại của mình.
                      </div>
                    </div>
                  </div>
                  <div
                    className="border p-2 px-5 ml-4 mt-8 w-fit rounded-2xl border-cyan-500 text-cyan-500 text-xs hover:bg-cyan-500 hover:text-white hover:border-white cursor-pointer"
                    onClick={() => setEdit((prev) => !prev)}
                  >
                    {phoneNumberValue ? "Chỉnh sửa" : "Thêm"} số điện thoại của
                    mình
                  </div>
                </div>
              )}
              {open === "changePassword" && (
                <div>
                  <div
                    className=" flex flex-row items-center cursor-pointer hover:underline"
                    onClick={() => setOpen("main")}
                  >
                    <ChevronLeftIcon className="size-4 text-gray-500" />
                    <div className="ml-3 text-gray-500 text-sm">Quay lại</div>
                  </div>
                  <div className="ml-5 mt-3">
                    <div className="font-medium">Thay đổi mật khẩu</div>
                    <div className="text-sm text-gray-600">
                      Tạo mật khẩu mới dài ít nhất 8 ký tự
                    </div>

                    {ChangePassword.map((item) => (
                      <InputPassword
                        key={item.key}
                        name={item.name}
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
                    ))}
                  </div>
                  <div className="border p-2 px-5 ml-4 mt-8 w-fit rounded-2xl border-cyan-500 text-cyan-500 text-xs hover:bg-cyan-500 hover:text-white hover:border-white cursor-pointer">
                    Cập nhật mật khẩu
                  </div>
                </div>
              )}
              {open === "pin" && (
                <div>
                  <div
                    className=" flex flex-row items-center cursor-pointer hover:underline"
                    onClick={() => setOpen("main")}
                  >
                    <ChevronLeftIcon className="size-4 text-gray-500" />
                    <div className="ml-3 text-gray-500 text-sm">Quay lại</div>
                  </div>
                  <div className="ml-5 mt-3">
                    <div>
                      <div className="font-medium">Mã khóa</div>
                      <div className="text-sm text-gray-600"></div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 pr-7 ">
                      <div>
                        Với mã khóa, bạn không cần nhớ mật khẩu phức tạp. Chúng
                        tôi khuyên bạn nên sử dụng các phương pháp mở khóa của
                        thiết bị như vân tay và Face ID để tăng cường bảo mật.
                      </div>
                    </div>
                  </div>
                  <div className="border p-2 px-5 ml-4 mt-8 w-fit rounded-2xl border-cyan-500 text-cyan-500 text-xs hover:bg-cyan-500 hover:text-white hover:border-white cursor-pointer">
                    Tạo mã khóa
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
