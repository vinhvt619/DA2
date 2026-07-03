import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToastContext } from "./Toast";
import HeaderNoUser from "./HeaderNoUser.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleOvalLeftIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";


export default function Header() {
  const { currentUser, isAuthChecked, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastContext();

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate("/MainMenu", { state: { searchKeyword: searchQuery.trim() } });
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (!isAuthChecked) return;

    const path = location.pathname.toLowerCase();
    const isAuthPage = path.includes("/login") || path.includes("/register");
    if (isAuthPage) return;

    if (!currentUser) {
      const protectedPaths = [
        "/resume",
        "/resumeselection",
        "/profile",
        "/message",
        "/accessibility",
        "/settingandprivate",
        "/userdashboard",
        "/admindashboard",
        "/companydashboard",
        "/saved-jobs",
      ];
      if (protectedPaths.some((p) => path.includes(p))) {
        navigate("/login");
      }
    } else {
      if (path.includes("/companydashboard") && currentUser.role !== "company") {
        navigate("/MainMenu");
      } else if (path.includes("/admindashboard") && currentUser.role !== "admin") {
        navigate("/MainMenu");
      }
    }
  }, [isAuthChecked, currentUser, location.pathname, navigate]);

  const getNavLinks = () => {
    if (currentUser?.role === "admin") {
      return [
        { to: "/AdminDashboard", label: "Quản lý Admin" },
        { to: "/News", label: "Tin tức" },
      ];
    } else if (currentUser?.role === "company") {
      return [
        { to: "/CompanyDashboard", label: "Kênh tuyển dụng" },
        { to: "/MainMenu", label: "Tìm việc làm" },
        { to: "/TopPage", label: "Bảng xếp hạng" },
        { to: "/News", label: "Tin tức" },
      ];
    } else {
      return [
        { to: "/WelcomePageCustomer", label: "Trang chủ" },
        { to: "/MainMenu", label: "Tìm việc làm" },
        { to: "/ResumeSelection", label: "Tạo CV" },
        { to: "/TopPage", label: "Bảng xếp hạng" },
        { to: "/News", label: "Tin tức" },
      ];
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
      showToast("Đã đăng xuất khỏi thiết bị.", "info");
      setTimeout(() => navigate("/login"), 800);
    } catch {
      logout();
      navigate("/login");
    }
  };

  const toggleMenu = (name) => {
    setOpenMenu((current) => (current === name ? "" : name));
  };

  if (!isAuthChecked) {
    return <header className="h-16 bg-white shadow-sm" />; // Placeholder while checking
  }

  if (!currentUser) {
    return <HeaderNoUser />;
  }

  return (
    <header className="relative z-50 bg-linear-to-r from-white via-[#D9C9EE] to-[#9246f570]">
      <nav className="mx-auto flex items-center bg-transparent px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0">
          <Link to="/WelcomePageCustomer" className="-m-1.5 p-1.5">
            <span className="sr-only">RabbitCV</span>
            <img alt="RabbitCV" src="/RabbitCV.png" className="h-15 w-15" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="ml-auto inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 lg:hidden"
        >
          <span className="sr-only">Mở menu</span>
          <Bars3Icon className="size-6" />
        </button>

        <div className="ml-10 hidden items-center lg:flex lg:gap-x-8">
          {getNavLinks().map((item) => (
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

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <div className="relative flex items-center justify-end">
            <div
              className={`flex h-8 items-center overflow-hidden rounded-full border border-gray-300 bg-white shadow-sm ${
                isSearchOpen
                  ? "mr-2 w-64 px-3 opacity-100"
                  : "pointer-events-none w-0 border-none px-0 opacity-0"
              }`}
            >
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="h-full w-full border-none bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
            >
              <MagnifyingGlassIcon
                className={`h-5 w-5 ${
                  isSearchOpen ? "text-[#9346F5]" : "text-gray-700"
                }`}
              />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu("notification")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
            >
              <BellIcon className="h-5 w-5 text-gray-700" />
            </button>
            {openMenu === "notification" && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white p-4 shadow-2xl ring-1 ring-black/5">
                <p className="mb-1 text-sm font-semibold text-gray-900">
                  Thông báo
                </p>
                <p className="text-sm text-gray-500">Không có thông báo mới.</p>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu("message")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
            >
              <ChatBubbleOvalLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            {openMenu === "message" && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white p-4 shadow-2xl ring-1 ring-black/5">
                <p className="mb-2 font-semibold text-gray-900">
                  Tin nhắn gần nhất
                </p>
                <div className="mb-3 space-y-2 text-sm text-gray-500">
                  <div
                    className="rounded-lg p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      toggleMenu("");
                      navigate("/Message");
                    }}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-medium text-gray-800">
                        Phòng nhóm chung
                      </p>
                      <span className="text-[10px] text-gray-400">
                        Vừa xong
                      </span>
                    </div>
                    <p className="truncate text-xs">Xin chào cả nhóm!</p>
                  </div>
                  <div
                    className="rounded-lg p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      toggleMenu("");
                      navigate("/Message");
                    }}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-medium text-gray-800">
                        Nguyễn Văn Toàn
                      </p>
                      <span className="text-[10px] text-gray-400">
                        12 giờ trước
                      </span>
                    </div>
                    <p className="truncate text-xs">Dạ vâng ạ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleMenu("");
                    navigate("/Message");
                  }}
                  className="w-full rounded-lg bg-[#f7f1ff] py-2 text-sm font-semibold text-[#9346F5] hover:text-[#7c38c9]"
                >
                  Xem tất cả
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleMenu("user")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"
            >
              <UserCircleIcon className="h-5 w-5 text-gray-700" />
            </button>
            {openMenu === "user" && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white py-2 shadow-2xl ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={() => navigate("/Profile")}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Thông tin cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/Accessibility")}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cài đặt
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-purple-100 bg-white px-4 py-3 lg:hidden">
          {getNavLinks().map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-purple-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
