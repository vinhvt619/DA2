import "./../../src/App.css";
import React from "react";
import Header from "../Components/Header";

function Login() {
  return (
    <div className="w-full min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-6">
          <img
            alt="RabbitCV Logo"
            src="../RabbitCV.png"
            className="h-16 w-16 mb-3"
          />
          <h1 className="text-2xl font-bold text-[#9346F5]">Đăng nhập</h1>
        </div>

        <form className="w-full max-w-sm">
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-300 px-3 py-2.5 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-gray-300 px-3 py-2.5 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20 transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-[#9346F5] border-gray-300 rounded focus:ring-[#9346F5]"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm text-[#9346F5] hover:text-[#7c38c9] font-semibold transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-linear-to-r from-[#9346F5] to-[#7c38c9] text-white font-bold py-3 rounded-xl hover:shadow-xl cursor-pointer hover:text-gray-300 mt-4"
            >
              Đăng nhập
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <a
                  href="#"
                  className="text-[#9346F5] hover:text-[#7c38c9] font-semibold transition-colors"
                >
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
