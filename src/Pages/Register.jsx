import "./../../src/App.css";
import Header from "../Components/Header";
import React from "react";
function Register() {
  return (
    <div className="w-full h-screen bg-[#F8F4FC]">
      <Header />
      <div className="pt-5 w-full">
        <div className="flex justify-center items-center">
          <img alt="" src="../RabbitCV.png" className="h-20 w-20 size-5" />
        </div>
        <div className="flex justify-center items-center">
          <h1 className="text-xl font-semibold">Đăng ký</h1>
        </div>

        <form className="flex justify-center items-center mt-5">
          <div className="space-y-7 bg-white p-7 rounded-2xl">
            <div className="border-b border-gray-900/10 pb-5">
              <label className="block text-sm/6 font-medium text-gray-900 mb-3 ml-4">
                Tên đăng nhập
              </label>
              <input
                type="text"
                className="peer border-2 border-gray-400 w-85 h-10 p-3.5 rounded-2xl"
                placeholder="Tên đăng nhập"
              ></input>
              <label className="block text-sm/6 font-medium text-gray-900 mt-4 mb-2 ml-4">
                Email
              </label>
              <input
                type="email"
                className="peer border-2 border-gray-400 w-85 h-10 p-3.5 rounded-2xl"
                placeholder="Email"
              ></input>
              <label className="block text-sm/6 font-medium text-gray-900 mt-4 mb-2 ml-4">
                Mật khẩu
              </label>
              <input
                type="text"
                className="peer border-2 border-gray-400 w-85 h-10 p-3.5 rounded-2xl"
                placeholder="Mật khẩu"
              ></input>
              <label className="block text-sm/6 font-medium text-gray-900 mt-4 mb-2 ml-4">
                Xác nhận mật khẩu
              </label>
              <input
                type="text"
                className="peer border-2 border-gray-400 w-85 h-10 p-3.5 rounded-2xl"
                placeholder="Xác nhận mật khẩu"
              ></input>
              <div className="flex mt-5 ml-1 w-auto justify-center items-center">
                <input type="checkbox" className="text-black"></input>
                <p className="ml-3 text-wrap w-77">
                  Bạn chấp nhận những{" "}
                  <span className="text-cyan-400 underline cursor-pointer">
                    Điều khoản đăng ký
                  </span>{" "}
                  của chúng tôi
                </p>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <button
                type="submit"
                className=" cursor-pointer bg-[#D2BBEF] border-black border-1 text-white h-10 w-40 rounded-2xl hover:bg-white hover:text-[#D2BBEF]"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
