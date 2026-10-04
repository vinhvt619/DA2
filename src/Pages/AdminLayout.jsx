import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  UsersIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  NewspaperIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../Components/NotificationBell.jsx";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    logout();
    navigate("/login");
  };

  // Determine current page title based on path
  const getPageTitle = (path) => {
    switch (path) {
      case "/admin":
        return { title: "Tổng quan Hệ thống", subtitle: "Cập nhật số liệu Real-time của platform." };
      case "/admin/users":
        return { title: "Quản lý Người dùng", subtitle: "Danh sách toàn bộ thành viên hệ thống." };
      case "/admin/jobs":
        return { title: "Quản lý Việc làm & Tuyển dụng", subtitle: "Danh sách tin đăng của các doanh nghiệp." };
      case "/admin/companies":
        return { title: "Quản lý doanh nghiệp", subtitle: "Xác minh và quản trị các tài khoản nhà tuyển dụng." };
      case '/admin/news':
        return { title: 'Quản lý tin tức', subtitle: 'Đăng, chỉnh sửa và quản lý nội dung tin tức.' };
      default:
        return { title: "Hệ thống Admin", subtitle: "RabbitCV Portal" };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  // Helper to check active nav path
  const isActive = (path) => location.pathname === path;

  // Nav item style classes
  const navItemClass = (path) => {
    if (isActive(path)) {
      return "flex items-center gap-2.5 px-3 py-2 bg-white/80 border border-[rgba(196,180,240,0.5)] text-slate-950 rounded-[6px] font-semibold cursor-pointer transition-all";
    }
    return "flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-[#EDE8F7] hover:text-slate-950 rounded-[6px] font-medium cursor-pointer transition-colors";
  };

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[var(--page-background)] font-sans text-[13px] text-slate-700 antialiased">
      
      {/* LEFT SIDEBAR (220px) */}
      <aside className="hidden w-[250px] bg-[#F4F0FA] border-r-[0.5px] border-[rgba(196,180,240,0.4)] md:flex flex-col justify-between py-5 shrink-0 relative z-20">
        <div>
          {/* Logo Branding */}
          <div className="px-5 mb-8 flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-violet-100 bg-white shadow-sm">
              <img src="/RabbitCV.png" alt="RabbitCV" className="size-9 object-contain" />
            </span>
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900 leading-tight">
              Rabbit<span className="text-violet-600 font-medium">CV</span>
              <span className="block text-[10px] font-semibold text-slate-500">Admin Portal</span>
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-0.5 px-3">
            <button type="button" onClick={() => navigate('/admin/news')} className={navItemClass('/admin/news')}><NewspaperIcon className="size-4" /><span>Tin tức</span></button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              Quản lý chung
            </p>
            <div onClick={() => navigate("/admin")} className={navItemClass("/admin")}>
              <ChartBarIcon className="size-4 text-violet-600" />
              <span>Tổng quan</span>
            </div>
            <div onClick={() => navigate("/admin/users")} className={navItemClass("/admin/users")}>
              <UsersIcon className="size-4" />
              <span>Người dùng</span>
            </div>
            <div onClick={() => navigate("/admin/jobs")} className={navItemClass("/admin/jobs")}>
              <BriefcaseIcon className="size-4" />
              <span className="whitespace-nowrap">Việc làm & Tuyển dụng</span>
            </div>
            <div onClick={() => navigate("/admin/companies")} className={navItemClass("/admin/companies")}>
              <BuildingOffice2Icon className="size-4" />
              <span>Quản lý doanh nghiệp</span>
            </div>
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="px-3">
          <div className="w-full h-[0.5px] bg-[rgba(196,180,240,0.4)] mb-3"></div>
          <div className="flex items-center justify-between p-2 rounded-[6px] bg-slate-100/40 border-[0.5px] border-[rgba(196,180,240,0.4)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                {currentUser ? (currentUser.fullName || currentUser.username).charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[12px] font-semibold text-slate-800 truncate">
                  {currentUser ? (currentUser.fullName || currentUser.username) : "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate capitalize">
                  {currentUser ? (currentUser.role === 'admin' ? 'Super Admin' : currentUser.role) : "Super Admin"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
              title="Đăng xuất"
            >
              <ArrowRightStartOnRectangleIcon className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[var(--page-background)]">
        {/* Header section */}
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b-[0.5px] border-[rgba(196,180,240,0.4)] bg-[var(--header-background)] px-4 sm:px-8 py-4.5">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-slate-400 text-[11px] font-medium mt-0.5">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              isOpen={notificationOpen}
              onToggle={() => setNotificationOpen((current) => !current)}
              onClose={() => setNotificationOpen(false)}
            />
            <div className="w-[0.5px] h-5 bg-[rgba(196,180,240,0.4)]"></div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 text-xs">VN / EN</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Child Route Content */}
        <nav aria-label="Quản trị trên điện thoại" className="flex shrink-0 flex-wrap gap-1 border-b border-violet-100 p-3 md:hidden">
          {[['/admin', 'Tổng quan'], ['/admin/users', 'Người dùng'], ['/admin/jobs', 'Việc làm'], ['/admin/companies', 'Doanh nghiệp'], ['/admin/news', 'Tin tức']].map(([path, label]) => <button key={path} type="button" onClick={() => navigate(path)} className={navItemClass(path)}>{label}</button>)}
          <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-red-700">Đăng xuất</button>
        </nav>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
