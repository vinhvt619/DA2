import "./../../src/App.css";
import Header from "../Components/Header";
import React from "react";

function Register() {
  return (
    <div className="w-full min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-4">
          <img
            alt="RabbitCV Logo"
            src="../RabbitCV.png"
            className="h-16 w-16 mb-2"
          />
          <h1 className="text-xl font-bold text-[#9346F5]">Đăng ký</h1>
        </div>

        <form className="w-full max-w-sm">
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="example@mail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <div className="flex items-start mt-2">
                <div className="flex items-center h-5 mt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-4 h-4 text-[#9346F5] border-gray-300 rounded focus:ring-[#9346F5] cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="terms"
                  className="ml-3 text-xs text-gray-600 leading-tight"
                >
                  Tôi đồng ý với các{" "}
                  <span className="text-[#9346F5] font-semibold hover:underline cursor-pointer">
                    Điều khoản sử dụng
                  </span>{" "}
                  và Chính sách bảo mật của RabbitCV.
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-linear-to-r from-[#9346F5] to-[#7c38c9] text-white font-bold py-2.5 px-4 rounded-xl hover:shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Đăng ký tài khoản
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-600">
                Đã có tài khoản?{" "}
                <a
                  href="/login"
                  className="text-[#9346F5] hover:text-[#7c38c9] font-semibold transition-colors"
                >
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
