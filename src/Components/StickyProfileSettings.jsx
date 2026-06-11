import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToastContext } from "./Toast";
import {
  ChatBubbleOvalLeftIcon,
  UserIcon,
  Cog6ToothIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  ArrowRightStartOnRectangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

function Tab({ icon, content, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center rounded-xl p-3 text-left ${
        active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="mr-4 text-gray-400">{icon}</span>
      <span className="text-[15px] font-medium">{content}</span>
    </button>
  );
}

export default function StickyProfileSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastContext();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      showToast("Bạn đã đăng xuất khỏi thiết bị.", "info");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      console.log("Logout error: ", err);
      navigate("/login");
    }
  };

  const path = location.pathname.toLowerCase();

  return (
    <aside className="hidden w-[280px] shrink-0 md:block lg:sticky lg:top-4">
      <div className="pr-6 pt-8">
        <h2 className="mb-6 pl-3 text-2xl font-bold text-gray-900">Cài đặt</h2>
        <div className="flex flex-col gap-1">
          <Tab
            active={path.includes("userdashboard")}
            onClick={() => navigate("/UserDashboard")}
            icon={<HomeIcon className="size-6" />}
            content="Tổng quan"
          />
          <Tab
            active={path.includes("profile")}
            onClick={() => navigate("/Profile")}
            icon={<UserIcon className="size-6" />}
            content="Thông tin cá nhân"
          />
          <Tab
            active={path.includes("accessibility")}
            onClick={() => navigate("/Accessibility")}
            icon={<MoonIcon className="size-6" />}
            content="Trợ năng & Giao diện"
          />
          <Tab
            active={path.includes("settingandprivate")}
            onClick={() => navigate("/SettingAndPrivate")}
            icon={<Cog6ToothIcon className="size-6" />}
            content="Cài đặt Quyền riêng tư"
          />
          <div className="mx-3 my-4 border-t-2 border-gray-300" />
          <Tab
            icon={<QuestionMarkCircleIcon className="size-6" />}
            content="Trợ giúp & hỗ trợ"
          />
          <Tab
            icon={<ChatBubbleOvalLeftIcon className="size-6" />}
            content="Đóng góp ý kiến"
          />
          <div className="mx-3 my-4 border-t-2 border-gray-300" />
          <Tab
            onClick={handleLogout}
            icon={<ArrowRightStartOnRectangleIcon className="size-6" />}
            content="Đăng xuất"
          />
        </div>
      </div>
    </aside>
  );
}
