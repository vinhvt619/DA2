// import { Button, Popover } from "flowbite-react";
import { useState } from "react";
import React from "react";
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  PopoverBackdrop,
} from "@headlessui/react";
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  UserCircleIcon,
  ChatBubbleOvalLeftIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  PhoneIcon,
  PlayCircleIcon,
} from "@heroicons/react/20/solid";

const products = [
  {
    name: "Analytics",
    description: "Get a better understanding of your traffic",
    href: "#",
    icon: ChartPieIcon,
  },
  {
    name: "Engagement",
    description: "Speak directly to your customers",
    href: "#",
    icon: CursorArrowRaysIcon,
  },
  {
    name: "Security",
    description: "Your customers’ data will be safe and secure",
    href: "#",
    icon: FingerPrintIcon,
  },
  {
    name: "Integrations",
    description: "Connect with third-party tools",
    href: "#",
    icon: SquaresPlusIcon,
  },
  {
    name: "Automations",
    description: "Build strategic funnels that will convert",
    href: "#",
    icon: ArrowPathIcon,
  },
];
const callsToAction = [
  { name: "Watch demo", href: "#", icon: PlayCircleIcon },
  { name: "Contact sales", href: "#", icon: PhoneIcon },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-linear-to-r from-[#FFFFFF] via-[#D9C9EE] to-[#9346F5]">
      <nav
        aria-label="Global"
        className="mx-auto flex items-center justify-between lg:px-8"
      >
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="" src="../RabbitCV.png" className="h-15 w-15" />
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
              Product
              <ChevronDownIcon
                aria-hidden="true"
                className="size-5 flex-none text-gray-400"
              />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
            >
              <div className="p-4">
                {products.map((item) => (
                  <div
                    key={item.name}
                    className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50"
                  >
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <item.icon
                        aria-hidden="true"
                        className="size-6 text-gray-600 group-hover:text-indigo-600"
                      />
                    </div>
                    <div className="flex-auto">
                      <a
                        href={item.href}
                        className="block font-semibold text-gray-900"
                      >
                        {item.name}
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
                {callsToAction.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100"
                  >
                    <item.icon
                      aria-hidden="true"
                      className="size-5 flex-none text-gray-400"
                    />
                    {item.name}
                  </a>
                ))}
              </div>
            </PopoverPanel>
          </Popover>

          <a href="#" className="text-sm/6 font-semibold text-gray-900">
            Features
          </a>
          <a href="#" className="text-sm/6 font-semibold text-gray-900">
            Marketplace
          </a>
          <a href="#" className="text-sm/6 font-semibold text-gray-900">
            Company
          </a>
        </PopoverGroup>
        {/* <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a href="#" className="text-sm/6 font-semibold text-gray-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          </div> */}
        <PopoverGroup className="hidden lg:flex lg:flex-1 lg:justify-end mt-2">
          <Popover>
            <PopoverButton className="w-6 h-6 mr-4">
              <MagnifyingGlassIcon />
            </PopoverButton>
            <PopoverBackdrop
              transition
              className="fixed inset-0 transition duration-100 ease-out data-closed:opacity-0"
            />
          </Popover>
          <Popover>
            <PopoverButton className="w-6 h-6 mr-4">
              <BellIcon />
            </PopoverButton>
            <PopoverBackdrop
              transition
              className="fixed inset-0 transition duration-100 ease-out data-closed:opacity-0"
            />
            <PopoverPanel
              transition
              anchor="bottom"
              className=" w-60 [--anchor-padding:5px] border-1 border-black divide-y  divide-white/5 rounded-xl bg-white p-3 text-sm/6 transition duration-200 ease-in-out [--anchor-gap:--spacing(5)] data-closed:-translate-y-1 data-closed:opacity-0"
            >
              <div className="p-1  truncate">
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4"
                >
                  <div className="flex items-center ">
                    <div className="h-7 w-7 border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[70%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">hello.</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4"
                >
                  <div className="flex items-center ">
                    <div className="h-7 w-7 border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[70%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">
                        are you free tonight?
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center ">
                    <div className="h-7 w-7 border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[70%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">
                        Đi nhậu ở Quán cô nhà bán bánh tráng đường Hàng Lài Quận
                        10 không cu?
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center ">
                    <div className="h-7 w-7 border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[70%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">hello.</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center justify-center text-xs text-cyan-400 underline">
                    Show all
                  </div>
                </a>
              </div>
            </PopoverPanel>
          </Popover>

          <Popover>
            <PopoverButton className="w-6 h-6 mr-4">
              <ChatBubbleOvalLeftIcon />
            </PopoverButton>
            <PopoverBackdrop
              transition
              className="fixed inset-0 transition duration-100 ease-out data-closed:opacity-0"
            />
            <PopoverPanel
              transition
              anchor="bottom"
              className=" w-60 [--anchor-padding:5px] border-1 border-black divide-y  divide-white/5 rounded-xl bg-white p-3 text-sm/6 transition duration-200 ease-in-out [--anchor-gap:--spacing(5)] data-closed:-translate-y-1 data-closed:opacity-0"
            >
              <div className="p-1  truncate">
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4"
                >
                  <div className="flex items-center ">
                    <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[50%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">hello.</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4"
                >
                  <div className="flex items-center ">
                    <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[50%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">
                        are you free tonight?
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center ">
                    <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[50%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">
                        Đi nhậu ở Quán cô nhà bán bánh tráng đường Hàng Lài Quận
                        10 không cu?
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center ">
                    <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-300"></div>
                    <div className="ml-3 w-[50%]">
                      <p className="font-semibold ">Chính</p>
                      <p className="text-black/50 truncate">hello.</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/analytics"
                  className="block rounded-2xl px-2 py-2 transition hover:bg-black/4 "
                >
                  <div className="flex items-center justify-center text-xs text-cyan-400 underline">
                    Show all
                  </div>
                </a>
              </div>
            </PopoverPanel>
          </Popover>

          <Popover>
            <PopoverButton className="w-6 h-6">
              <UserCircleIcon />
            </PopoverButton>
            <PopoverBackdrop
              transition
              className="fixed inset-0 transition duration-100 ease-out data-closed:opacity-0"
            />
            <PopoverPanel
              transition
              anchor="bottom"
              className="[--anchor-padding:5px] border-1 border-black divide-y  divide-white/5 rounded-xl bg-white p-3 text-sm/6 transition duration-200 ease-in-out [--anchor-gap:--spacing(5)] data-closed:-translate-y-1 data-closed:opacity-0"
            >
              <div className="p-1">
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Thông tin cá nhân
                </a>
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Màn hình và trợ năng
                </a>
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Cài đặt và quyền riêng tư
                </a>
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Trợ giúp và hỗ trợ
                </a>
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Đóng góp ý kiến
                </a>
                <a
                  href="/analytics"
                  className="block rounded-lg px-2 py-2 transition hover:bg-black/4"
                >
                  Đăng xuất
                </a>
              </div>
            </PopoverPanel>
          </Popover>
        </PopoverGroup>
      </nav>
    </header>
  );
}
