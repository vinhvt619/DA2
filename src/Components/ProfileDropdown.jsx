import {
  ArrowRightStartOnRectangleIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const menuItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

export default function ProfileDropdown({ currentUser, onClose, onLogout, navigate }) {
  const displayName = currentUser?.fullName || currentUser?.username || "Người dùng RabbitCV";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const items = [
    { label: "Thông tin cá nhân", path: "/PersonalInformation", icon: UserIcon },
    { label: "Việc làm đã lưu", path: "/saved-jobs", icon: BookmarkIcon },
    { label: "Cài đặt", path: "/SettingAndPrivate", icon: Cog6ToothIcon },
  ];

  const openPage = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      role="menu"
      aria-label="Tài khoản"
      className="absolute right-0 mt-2 w-[min(243px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-violet-100 bg-white p-2 shadow-[0_14px_36px_rgba(76,29,149,0.14)]"
    >
      <div className="flex items-center gap-2.5 rounded-lg bg-violet-50/80 p-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm shadow-violet-200">
          {initials || "RC"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{displayName}</p>
          <p className="mt-0.5 truncate text-[10px] text-slate-500">{currentUser?.email || "Tài khoản RabbitCV"}</p>
        </div>
      </div>

      <div className="mt-1.5 space-y-0.5">
        {items.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            type="button"
            role="menuitem"
            onClick={() => openPage(path)}
            className={menuItemClass}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className="my-1.5 border-t border-slate-100" />
      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className={`${menuItemClass} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600">
          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
        </span>
        Đăng xuất
      </button>
    </div>
  );
}
