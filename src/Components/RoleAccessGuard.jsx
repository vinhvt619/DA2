import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const companyAllowedPaths = [
  "/companydashboard",
  "/message",
  "/resume/view/",
  "/profile/",
  "/user-profile/",
];

const isAdminPath = (pathname) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

const isCompanyPath = (pathname) =>
  companyAllowedPaths.some((path) =>
    path.endsWith("/") ? pathname.startsWith(path) : pathname === path,
  );

export default function RoleAccessGuard() {
  const { currentUser, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--page-background)]">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-700 border-t-transparent" />
      </div>
    );
  }

  const pathname = location.pathname.toLowerCase();
  if (isAdminPath(pathname) && currentUser?.role !== "admin") {
    return <Navigate to={currentUser ? "/MainMenu" : "/login"} replace />;
  }
  if (pathname === "/companydashboard" && currentUser?.role !== "company") {
    return <Navigate to={currentUser ? "/MainMenu" : "/login"} replace />;
  }
  if (currentUser?.role === "admin" && !isAdminPath(pathname)) {
    return <Navigate to="/admin" replace />;
  }
  if (currentUser?.role === "company" && !isCompanyPath(pathname)) {
    return <Navigate to="/CompanyDashboard" replace />;
  }

  return <Outlet />;
}
