import React, { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { to: "/MainMenu", label: "Trang chủ" },
  { to: "/Jobs", label: "Tìm việc làm" },
  { to: "/ResumeSelection", label: "Tạo CV", protected: true },
  { to: "/TopPage", label: "Bảng xếp hạng" },
  { to: "/News", label: "Tin tức" },
];

export default function HeaderNoUser() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openLink = (item) => {
    setMenuOpen(false);
    navigate(item.protected ? "/login" : item.to);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/70 bg-[var(--header-background)] shadow-[0_1px_8px_rgba(76,29,149,0.05)] backdrop-blur-sm">
      <nav className="mx-auto flex min-h-16 max-w-[1536px] items-center px-4 sm:px-5 lg:px-6">
        <Link to="/" className="text-[22px] font-black tracking-[-1px] text-[#7c00e8] hover:text-[#962fea]">
          RabbitCV
        </Link>

        <div className="ml-8 hidden items-center lg:flex lg:gap-x-7">
          {navLinks.map((item) => {
            const active = location.pathname.toLowerCase() === item.to.toLowerCase();
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => openLink(item)}
                className={`group relative py-5 text-[13px] font-medium transition-colors ${active ? "text-violet-700" : "text-slate-600 hover:text-slate-950"}`}
              >
                {item.label}
                <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-violet-600 transition-transform ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-violet-700"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="inline-flex h-9 items-center rounded-lg bg-violet-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Đăng ký
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-violet-100 bg-[var(--header-background)] px-4 py-3 lg:hidden">
          {navLinks.map((item) => (
            <button key={item.to} type="button" onClick={() => openLink(item)} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-violet-50">
              {item.label}
            </button>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => navigate("/login")} className="rounded-lg border border-violet-200 py-2 text-sm font-semibold text-violet-700">Đăng nhập</button>
            <button type="button" onClick={() => navigate("/register")} className="rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white">Đăng ký</button>
          </div>
        </div>
      )}
    </header>
  );
}
