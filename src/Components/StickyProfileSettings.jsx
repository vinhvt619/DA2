import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToastContext } from "./Toast.jsx";
import {
  ChatBubbleOvalLeftIcon,
  UserIcon,
  Cog6ToothIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  ArrowRightStartOnRectangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { path: "/UserDashboard", match: "/userdashboard", label: "Tổng quan", icon: HomeIcon },
  { path: "/Profile", match: "/profile", label: "Thông tin cá nhân", icon: UserIcon },
  { path: "/Accessibility", match: "/accessibility", label: "Trợ năng & Giao diện", icon: MoonIcon },
  { path: "/SettingAndPrivate", match: "/settingandprivate", label: "Quyền riêng tư", icon: Cog6ToothIcon },
];

function Tab({ icon: Icon, content, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center rounded-xl p-3 text-left transition-colors ${
        active
          ? "bg-violet-200 text-violet-900 font-semibold"
          : "text-gray-700 hover:bg-violet-100"
      }`}
    >
      <span className={`mr-3 shrink-0 ${active ? "text-violet-800" : "text-gray-400"}`}>
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-medium">{content}</span>
    </button>
  );
}

function normalizePath(pathname) {
  return pathname.toLowerCase().replace(/\/$/, "") || "/";
}

function isNavActive(currentPath, matchPath) {
  return currentPath === matchPath;
}

export default function StickyProfileSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastContext();
  const currentPath = normalizePath(location.pathname);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      showToast("Bạn đã đăng xuất khỏi thiết bị.", "info");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  return (
    <aside className="w-full md:w-[260px] shrink-0 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-md shadow-violet-200/30">
        <h2 className="mb-4 px-2 text-lg font-bold text-gray-900">Cài đặt</h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, match, label, icon }) => (
            <Tab
              key={path}
              icon={icon}
              content={label}
              active={isNavActive(currentPath, match)}
              onClick={() => navigate(path)}
            />
          ))}

          <div className="mx-2 my-3 border-t border-violet-100" />

          <Tab
            icon={QuestionMarkCircleIcon}
            content="Trợ giúp & hỗ trợ"
            active={false}
            onClick={() => showToast("Tính năng đang được phát triển.", "info")}
          />
          <Tab
            icon={ChatBubbleOvalLeftIcon}
            content="Đóng góp ý kiến"
            active={false}
            onClick={() => showToast("Tính năng đang được phát triển.", "info")}
          />

          <div className="mx-2 my-3 border-t border-violet-100" />

          <Tab
            icon={ArrowRightStartOnRectangleIcon}
            content="Đăng xuất"
            active={false}
            onClick={handleLogout}
          />
        </nav>
      </div>
    </aside>
  );
}
