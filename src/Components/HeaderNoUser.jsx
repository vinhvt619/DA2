import React, { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex min-h-16 max-w-[1536px] items-center justify-between px-4 sm:px-5 lg:px-6">
        <div className="flex items-center">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="RabbitCV" src="/RabbitCV.png" className="h-12 w-12 object-contain" />
          </Link>
          <div className="ml-8 hidden items-center lg:flex lg:gap-x-7">
            {navLinks.map((item) => {
              const isActive = location.pathname.toLowerCase() === item.to.toLowerCase();
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative py-5 text-[13px] font-medium transition-colors ${
                    isActive ? "text-violet-700" : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 bg-violet-600 transition-transform ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Bars3Icon className="size-6" />
        </button>

        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="h-9 rounded-lg border border-violet-300 bg-white px-4 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="h-9 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Đăng ký
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex-1 rounded-lg border border-violet-300 py-2 text-sm font-semibold text-violet-700"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white"
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
