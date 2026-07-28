import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  UsersIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  FlagIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentMagnifyingGlassIcon,
  BellIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../Components/NotificationBell.jsx";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Dynamic layout stats (with TODO: bind to real backend stats keys if returned)
  const [layoutStats, setLayoutStats] = useState({
    pendingReports: 5,
    pendingCompanies: 8,
    systemErrors: 1,
    pendingReviews: 12
  });
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const fetchLayoutStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const apiStats = data.stats || {};
          // Check for API fields. If not present, keep hardcoded counts.
          // TODO: update backend stats object to return pendingReports, pendingCompanies, systemErrors, pendingReviews
          setLayoutStats({
            pendingReports: apiStats.pendingReports !== undefined ? apiStats.pendingReports : 5,
            pendingCompanies: apiStats.pendingCompanies !== undefined ? apiStats.pendingCompanies : 8,
            systemErrors: apiStats.systemErrors !== undefined ? apiStats.systemErrors : 1,
            pendingReviews: apiStats.pendingReviews !== undefined ? apiStats.pendingReviews : 12,
          });
        }
      } catch (err) {
        console.error("Lỗi lấy stats trong layout:", err);
      }
    };
    fetchLayoutStats();
  }, []);

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
      case "/admin/reports":
        return { title: "Tố cáo & Vi phạm", subtitle: "Giải quyết các báo cáo từ cộng đồng." };
      case "/admin/companies":
        return { title: "Quản lý doanh nghiệp", subtitle: "Xác minh và quản trị các tài khoản nhà tuyển dụng." };
      case "/admin/system-logs":
        return { title: "Lỗi & Hệ thống", subtitle: "Lịch sử hoạt động và ghi nhận ngoại lệ real-time." };
      default:
        return { title: "Hệ thống Admin", subtitle: "RabbitCV Portal" };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  // Mock data for Right Sidebar
  const activities = [
    { id: 1, user: "Nguyễn Văn An", action: "đã cập nhật hồ sơ CV ứng tuyển", time: "12 phút trước", role: "employee" },
    { id: 2, user: "TechCorp JSC", action: "đã tạo tin tuyển dụng mới: Senior React Developer", time: "30 phút trước", role: "company" },
    { id: 3, user: "Lê Quốc Thịnh", action: "đã nộp đơn ứng tuyển cho VNG Corporation", time: "1 giờ trước", role: "employee" },
    { id: 4, user: "FPT Software", action: "đã cập nhật thông tin doanh nghiệp", time: "2 giờ trước", role: "company" },
    { id: 5, user: "Admin Hoài Nam", action: "đã từ chối duyệt CV có dấu hiệu tin rác", time: "3 giờ trước", role: "admin" }
  ];

  const handleActionClick = (id) => {
    switch (id) {
      case "reports":
        navigate("/admin/reports?status=pending");
        break;
      case "pending_companies":
        navigate("/admin/companies?status=pending");
        break;
      case "system_errors":
        navigate("/admin/system-logs");
        break;
      default:
        break;
    }
  };

  // Helper to check active nav path
  const isActive = (path) => location.pathname === path;

  // Nav item style classes
  const navItemClass = (path) => {
    if (isActive(path)) {
      return "flex items-center gap-2.5 px-3 py-2 bg-white/80 border border-[rgba(196,180,240,0.5)] text-slate-950 rounded-[6px] font-semibold cursor-pointer transition-all";
    }
    return "flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-[#EDE8F7] hover:text-slate-950 rounded-[6px] font-medium cursor-pointer transition-colors";
  };

  const navItemWithBadgeClass = (path) => {
    if (isActive(path)) {
      return "flex items-center justify-between px-3 py-2 bg-white/80 border border-[rgba(196,180,240,0.5)] text-slate-955 rounded-[6px] font-semibold cursor-pointer transition-all";
    }
    return "flex items-center justify-between px-3 py-2 text-slate-500 hover:bg-[#EDE8F7] hover:text-slate-950 rounded-[6px] font-medium cursor-pointer transition-colors";
  };

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[var(--page-background)] font-sans text-[13px] text-slate-700 antialiased">
      
      {/* LEFT SIDEBAR (220px) */}
      <aside className="w-[250px] bg-[#F4F0FA] border-r-[0.5px] border-[rgba(196,180,240,0.4)] flex flex-col justify-between py-5 shrink-0 relative z-20">
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

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 mt-5">
              Bảo mật & Cảnh báo
            </p>
            <div onClick={() => navigate("/admin/reports")} className={navItemWithBadgeClass("/admin/reports")}>
              <div className="flex items-center gap-2.5">
                <FlagIcon className="size-4" />
                <span>Tố cáo & Vi phạm</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-100 text-red-600 min-w-[16px] text-center">
                {layoutStats.pendingReports}
              </span>
            </div>
            <div onClick={() => navigate("/admin/companies")} className={navItemWithBadgeClass("/admin/companies")}>
              <div className="flex items-center gap-2.5">
                <BuildingOffice2Icon className="size-4" />
                <span>Quản lý doanh nghiệp</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 text-amber-600 min-w-[16px] text-center">
                {layoutStats.pendingCompanies}
              </span>
            </div>
            <div onClick={() => navigate("/admin/system-logs")} className={navItemClass("/admin/system-logs")}>
              <ExclamationTriangleIcon className="size-4" />
              <span>Lỗi & Hệ thống</span>
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
      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-[var(--page-background)]">
        {/* Header section */}
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b-[0.5px] border-[rgba(196,180,240,0.4)] bg-[var(--header-background)] px-8 py-4.5">
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
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* RIGHT SIDEBAR (220px) - Hidden below 1280px (xl) */}
      <aside className="hidden xl:flex w-[220px] bg-[#F4F0FA] border-l-[0.5px] border-[rgba(196,180,240,0.4)] flex-col p-4 overflow-y-auto gap-6 shrink-0 z-20">
        {/* Needs Action Section */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Yêu cầu xử lý
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { id: "reports", label: "Tài khoản bị báo cáo", count: layoutStats.pendingReports, color: "bg-red-50 text-red-600 border-red-100/50 hover:bg-red-100/30" },
              { id: "pending_companies", label: "Doanh nghiệp chờ duyệt", count: layoutStats.pendingCompanies, color: "bg-amber-50 text-amber-600 border-amber-100/50 hover:bg-amber-100/30" },
              { id: "system_errors", label: "Lỗi hệ thống ghi nhận", count: layoutStats.systemErrors, color: "bg-rose-50 text-rose-600 border-rose-100/50 hover:bg-rose-100/30" }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => handleActionClick(item.id)}
                className={`p-2.5 rounded-[6px] border-[0.5px] border-slate-200/40 flex items-center justify-between cursor-pointer transition-all w-full text-left outline-none ${item.color}`}
              >
                <div className="flex items-center gap-2">
                  {item.id === "reports" && <FlagIcon className="size-3.5" />}
                  {item.id === "pending_companies" && <BuildingOffice2Icon className="size-3.5" />}
                  {item.id === "system_errors" && <ExclamationTriangleIcon className="size-3.5" />}
                  <span className="font-bold text-[12px]">{item.label}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 shadow-xs border border-slate-200/20">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="flex-grow">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Nhật ký hoạt động
          </h3>
          <div className="relative border-l border-slate-200/80 pl-3 ml-1.5 flex flex-col gap-4">
            {activities.map((act) => {
              let markerColor = "bg-blue-500 ring-blue-100";
              if (act.role === "company") markerColor = "bg-purple-500 ring-purple-100";
              if (act.role === "admin") markerColor = "bg-red-500 ring-red-100";
              
              return (
                <div key={act.id} className="relative group text-left leading-normal">
                  <span className={`absolute -left-[18.5px] top-1.5 w-1.5 h-1.5 rounded-full ring-4 ${markerColor}`}></span>
                  <div>
                    <p className="text-[12px] font-medium text-slate-600 leading-snug">
                      <span className="font-bold text-slate-800">{act.user}</span> {act.action}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
