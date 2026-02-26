import React from "react";
import { PopoverGroup } from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function HeaderNoUser() {
  return (
    <header className="bg-linear-to-r from-[#FFFFFF] via-[#D9C9EE] to-[#9246f570] relative z-50">
      <nav
        aria-label="Global"
        className="mx-auto flex items-center justify-between lg:px-8"
      >
        <div className="flex lg:flex-1 items-center ">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="" src="../RabbitCV.png" className="h-15 w-15" />
          </a>
          <PopoverGroup className="hidden lg:flex lg:gap-x-8 ml-10 items-center">
            <a
              href="#"
              className="text-sm font-bold leading-6 text-gray-700 hover:text-[#9346F5] transition-all relative group"
            >
              Trang chủ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9346F5] transition-all group-hover:w-full"></span>
            </a>
            <a
              href="#"
              className="text-sm font-bold leading-6 text-gray-700 hover:text-[#9346F5] transition-all relative group"
            >
              Tìm việc làm
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9346F5] transition-all group-hover:w-full"></span>
            </a>
            <a
              href="#"
              className="text-sm font-bold leading-6 text-gray-700 hover:text-[#9346F5] transition-all relative group"
            >
              Tạo CV
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9346F5] transition-all group-hover:w-full"></span>
            </a>
            <a
              href="#"
              className="text-sm font-bold leading-6 text-gray-700 hover:text-[#9346F5] transition-all relative group"
            >
              Bảng xếp hạng
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9346F5] transition-all group-hover:w-full"></span>
            </a>
          </PopoverGroup>
        </div>
        {/* <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a href="#" className="text-sm/6 font-semibold text-gray-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          </div> */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-3">
          <button className="text-sm bg-white text-[#9346F5] font-bold py-2.5 px-6 rounded-full cursor-pointer transition-all duration-0 hover:duration-200 hover:bg-[#f7f1ff] hover:text-[#9346F5] hover:shadow-lg border-2 border-[#9346F5] w-32">
            Đăng nhập
          </button>
          <button className="text-sm bg-[#9346F5] text-white font-bold py-2.5 px-6 rounded-full cursor-pointer transition-all duration-0 hover:duration-200 hover:bg-[#9346F5] hover:text-[#f7f1ff] hover:shadow-lg border-2 border-[#9346F5] w-32">
            Đăng ký
          </button>
        </div>
      </nav>
    </header>
  );
}
