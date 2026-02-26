import { useState } from "react";
import React from "react";
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  UserCircleIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-linear-to-r from-[#FFFFFF] via-[#D9C9EE] to-[#9246f570] relative z-50">
      <nav
        aria-label="Global"
        className="mx-auto flex items-center lg:px-8 bg-transparent"
      >
        <div className="flex shrink-0">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="" src="../RabbitCV.png" className="h-15 w-15" />
          </a>
        </div>
        <div className="flex lg:hidden ml-auto">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
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

        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {/* Search Bar */}
          <div className="relative flex items-center justify-end">
            <div
              className={`
                flex items-center transition-all duration-300 ease-in-out bg-white rounded-full overflow-hidden border border-gray-300 h-8 shadow-sm
                ${
                  isSearchOpen
                    ? "w-64 opacity-100 px-3 mr-2"
                    : "w-0 opacity-0 px-0 pointer-events-none border-none"
                }
              `}
            >
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full border-none focus:ring-0 text-sm bg-transparent outline-none h-full"
              />
            </div>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-all outline-none relative z-10"
            >
              <MagnifyingGlassIcon
                className={`w-5 h-5 transition-colors ${isSearchOpen ? "text-[#9346F5]" : "text-gray-700"}`}
              />
            </button>
          </div>

          <Popover className="relative flex items-center">
            <PopoverButton className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-all outline-none group">
              <BellIcon className="w-5 h-5 text-gray-700 group-hover:text-[#9346F5] transition-colors" />
            </PopoverButton>
            <PopoverPanel
              anchor="bottom end"
              transition
              className="z-50 mt-2 w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none p-4 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
            >
              <div className="text-sm text-gray-500">
                <p className="font-semibold text-gray-900 mb-1">Thông báo</p>
                <p>Không có thông báo mới.</p>
              </div>
            </PopoverPanel>
          </Popover>

          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-all outline-none group">
            <ChatBubbleOvalLeftIcon className="w-5 h-5 text-gray-700 group-hover:text-[#9346F5] transition-colors" />
          </button>

          <Popover className="relative flex items-center">
            <PopoverButton className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-all outline-none group">
              <UserCircleIcon className="w-5 h-5 text-gray-700 group-hover:text-[#9346F5] transition-colors" />
            </PopoverButton>
            <PopoverPanel
              anchor="bottom end"
              transition
              className="z-50 mt-2 w-56 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none py-2 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
            >
              <div className="px-2 py-1">
                <a
                  href="#"
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Thông tin cá nhân
                </a>
                <a
                  href="#"
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cài đặt
                </a>
                <div className="my-1 border-t border-gray-100" />
                <a
                  href="#"
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </a>
              </div>
            </PopoverPanel>
          </Popover>
        </div>
      </nav>
    </header>
  );
}
