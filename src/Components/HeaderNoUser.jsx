import React, { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useNavigate, Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Trang chủ" },
  { to: "/MainMenu", label: "Tìm việc làm" },
  { to: "/resume", label: "Tạo CV" },
  { to: "/TopPage", label: "Bảng xếp hạng" },
  { to: "/News", label: "Tin tức" },
];

export default function HeaderNoUser() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="relative z-50 bg-linear-to-r from-[#FFFFFF] via-[#D9C9EE] to-[#9246f570]">
      <nav className="mx-auto flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="RabbitCV" src="../RabbitCV.png" className="h-15 w-15" />
          </Link>
          <div className="ml-10 hidden items-center lg:flex lg:gap-x-8">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative text-sm font-bold leading-6 text-gray-700 hover:text-[#9346F5]"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#9346F5] group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2.5 text-gray-700 lg:hidden"
        >
          <Bars3Icon className="size-6" />
        </button>

        <div className="hidden gap-3 lg:flex lg:flex-1 lg:justify-end">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-32 rounded-full border-2 border-[#9346F5] bg-white px-6 py-2.5 text-sm font-bold text-[#9346F5] hover:bg-[#f7f1ff]"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-32 rounded-full border-2 border-[#9346F5] bg-[#9346F5] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#7c38c9]"
          >
            Đăng ký
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-purple-100 bg-white px-4 py-3 lg:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-purple-50"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex-1 rounded-full border-2 border-[#9346F5] py-2 text-sm font-bold text-[#9346F5]"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="flex-1 rounded-full bg-[#9346F5] py-2 text-sm font-bold text-white"
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
