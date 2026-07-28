import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightStartOnRectangleIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { id: "overview", label: "Tổng quan", icon: Squares2X2Icon },
  { id: "jobs", label: "Quản lý tuyển dụng", icon: BriefcaseIcon },
  { id: "applications", label: "Duyệt ứng viên", icon: UserGroupIcon },
  { id: "messages", label: "Tin nhắn", icon: ChatBubbleLeftRightIcon },
  { id: "profile", label: "Hồ sơ doanh nghiệp", icon: BuildingOffice2Icon },
];

export function CompanyPortalShell({ children, activeItem = "overview" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const openDashboardTab = (tab) => {
    if (tab === "messages") {
      navigate("/Message");
      return;
    }
    navigate("/CompanyDashboard", { state: { activeTab: tab } });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-[#24192d]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[212px] flex-col border-r border-violet-100 bg-[#f6eafa] px-3 py-5 lg:flex">
        <button type="button" onClick={() => openDashboardTab("overview")} className="flex items-center gap-3 px-1 text-left">
          <img src="/RabbitCV.png" alt="RabbitCV" className="h-9 w-9 rounded-[9px] bg-white object-contain p-1 shadow-sm" />
          <span>
            <span className="block text-[18px] font-black leading-5 tracking-[-0.04em] text-violet-700">RabbitCV<br />Business</span>
            <span className="mt-0.5 block text-[10px] font-semibold text-[#665d70]">Cổng nhà tuyển dụng</span>
          </span>
        </button>

        <button type="button" onClick={() => openDashboardTab("post")} className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-violet-700 text-[12px] font-bold text-white shadow-sm transition hover:bg-violet-800">
          <PlusIcon className="h-4 w-4" />
          Đăng tin tuyển dụng
        </button>

        <nav className="mt-5 space-y-1.5" aria-label="Điều hướng doanh nghiệp">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.id;
            return (
              <button key={item.id} type="button" onClick={() => openDashboardTab(item.id)} className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold transition ${active ? "bg-violet-600 text-white shadow-sm" : "text-[#665d70] hover:bg-violet-100 hover:text-violet-700"}`}>
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1.5 border-t border-violet-100 pt-3">
          <button type="button" className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold text-[#665d70] hover:bg-violet-100">
            <QuestionMarkCircleIcon className="h-[18px] w-[18px]" />
            Trung tâm trợ giúp
          </button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold text-[#665d70] hover:bg-violet-100 hover:text-red-600">
            <ArrowRightStartOnRectangleIcon className="h-[18px] w-[18px]" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 lg:ml-[212px]">{children}</main>
    </div>
  );
}

export function CompanyAwarePage({ children, activeItem }) {
  const { currentUser, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return <div className="grid min-h-screen place-items-center bg-[var(--page-background)]"><div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-700 border-t-transparent" /></div>;
  }

  if (currentUser?.role !== "company") return children;

  const resolvedItem = activeItem || (location.pathname === "/Message" ? "messages" : "applications");
  return <CompanyPortalShell activeItem={resolvedItem}>{children}</CompanyPortalShell>;
}
