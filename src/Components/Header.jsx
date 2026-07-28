import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToastContext } from "./Toast";
import HeaderNoUser from "./HeaderNoUser.jsx";
import NotificationBell from "./NotificationBell.jsx";
import MessageDropdown from "./MessageDropdown.jsx";
import ProfileDropdown from "./ProfileDropdown.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import {
  Bars3Icon,
  ChatBubbleOvalLeftIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function Header() {
  const { currentUser, isAuthChecked, logout } = useAuth();
  const { hasNewMessage, markAllMessagesAsRead } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToastContext();
  const headerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenMenu("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate("/Jobs", { state: { searchKeyword: searchQuery.trim() } });
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
        "/personalinformation",
        "/profile",
        "/message",
        "/accessibility",
        "/settingandprivate",
        "/userdashboard",
        "/admin",
        "/companydashboard",
        "/saved-jobs",
        "/my-applications",
      ];
      if (protectedPaths.some((p) => path.includes(p))) {
        navigate("/login");
      }
    } else {
      if (
        path.includes("/companydashboard") &&
        currentUser.role !== "company"
      ) {
        navigate("/MainMenu");
      } else if (path.includes("/admin") && currentUser.role !== "admin") {
        navigate("/MainMenu");
      }
    }
  }, [isAuthChecked, currentUser, location.pathname, navigate]);

  const getNavLinks = () => {
    if (currentUser?.role === "admin") {
      return [
        { to: "/MainMenu", label: "Trang chủ" },
        { to: "/AdminDashboard", label: "Quản lý Admin" },
        { to: "/News", label: "Tin tức" },
      ];
    } else if (currentUser?.role === "company") {
      return [
        { to: "/MainMenu", label: "Trang chủ" },
        { to: "/CompanyDashboard", label: "Kênh tuyển dụng" },
        { to: "/Jobs", label: "Tìm việc làm" },
        { to: "/TopPage", label: "Bảng xếp hạng" },
        { to: "/News", label: "Tin tức" },
      ];
    } else {
      return [
        { to: "/MainMenu", label: "Trang chủ" },
        { to: "/Jobs", label: "Tìm việc làm" },
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
    const isOpening = openMenu !== name;
    if (name === "message" && isOpening && hasNewMessage) {
      void markAllMessagesAsRead();
    }
    setOpenMenu((current) => (current === name ? "" : name));
  };

  if (!isAuthChecked) {
    return <header className="h-16 bg-[var(--header-background)] shadow-sm" />; // Placeholder while checking
  }

  if (!currentUser) {
    return <HeaderNoUser />;
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-violet-200/70 bg-[var(--header-background)] shadow-[0_1px_8px_rgba(76,29,149,0.05)] backdrop-blur-sm"
    >
      <nav className="mx-auto flex min-h-16 max-w-[1536px] items-center px-4 sm:px-5 lg:px-6">
        <div className="flex shrink-0">
          <Link to="/" className="text-[22px] font-black tracking-[-1px] text-[#7c00e8] hover:text-[#962fea]">
            RabbitCV
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

        <div className="ml-8 hidden items-center lg:flex lg:gap-x-7">
          {getNavLinks().map((item) => {
            const isActive =
              location.pathname.toLowerCase() === item.to.toLowerCase();

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                className={`group relative py-5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "text-violet-700"
                    : "text-slate-600 hover:text-slate-950"
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

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <div className="relative flex items-center justify-end">
            <div
              className={`flex h-9 items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-all ${
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
            >
              <MagnifyingGlassIcon
                className={`h-5 w-5 ${
                  isSearchOpen ? "text-[#9346F5]" : "text-gray-700"
                }`}
              />
            </button>
          </div>

          <NotificationBell
            isOpen={openMenu === "notification"}
            onToggle={() => toggleMenu("notification")}
            onClose={() => setOpenMenu("")}
          />

          <div className="relative">
            <button
              type="button"
              aria-label="Tin nhắn"
              aria-haspopup="menu"
              aria-expanded={openMenu === "message"}
              onClick={() => toggleMenu("message")}
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                openMenu === "message"
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <ChatBubbleOvalLeftIcon className="h-5 w-5" />
              {hasNewMessage && (
                <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-600" />
              )}
            </button>
            {openMenu === "message" && (
              <MessageDropdown toggleMenu={toggleMenu} hasNewMessage={hasNewMessage} />
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Tài khoản"
              aria-haspopup="menu"
              aria-expanded={openMenu === "user"}
              onClick={() => toggleMenu("user")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                openMenu === "user"
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
            {openMenu === "user" && (
              <ProfileDropdown
                currentUser={currentUser}
                onClose={() => setOpenMenu("")}
                onLogout={handleLogout}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-violet-100 bg-[var(--header-background)] px-4 py-3 lg:hidden">
          {getNavLinks().map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
