import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../utils/toast.js";
import { useAuth } from "../context/AuthContext.jsx";
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
  { path: "/PersonalInformation", match: "/personalinformation", label: "Thông tin cá nhân", icon: UserIcon },
  { path: "/Accessibility", match: "/accessibility", label: "Trợ năng & Giao diện", icon: MoonIcon },
  { path: "/SettingAndPrivate", match: "/settingandprivate", label: "Quyền riêng tư", icon: Cog6ToothIcon },
];

function Tab({ icon: Icon, content, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center rounded-lg p-2.5 text-left transition-colors ${
        active
          ? "bg-violet-50 text-violet-700 font-semibold"
          : "text-gray-650 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`mr-2.5 shrink-0 ${active ? "text-violet-600" : "text-gray-400"}`}>
        <Icon className="size-4.5" />
      </span>
      <span className="text-xs font-medium">{content}</span>
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
  const { logout } = useAuth();
  const currentPath = normalizePath(location.pathname);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
      showToast("Bạn đã đăng xuất khỏi thiết bị.", "info");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      console.error("Logout error:", err);
      logout();
      navigate("/login");
    }
  };

  return (
    <aside className="w-full md:w-[240px] shrink-0 lg:sticky lg:top-6">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <h2 className="mb-3 px-2 text-sm font-bold text-gray-900">Cài đặt</h2>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ path, match, label, icon }) => (
            <Tab
              key={path}
              icon={icon}
              content={label}
              active={isNavActive(currentPath, match)}
              onClick={() => navigate(path)}
            />
          ))}

          <div className="mx-2 my-2.5 border-t border-gray-100" />

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

          <div className="mx-2 my-2.5 border-t border-gray-100" />

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
