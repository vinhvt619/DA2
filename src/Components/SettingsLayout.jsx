import React from "react";
import Header from "./Header.jsx";
import StickyProfileSettings from "./StickyProfileSettings.jsx";

export function SettingsCard({ children, className = "", padding = true }) {
  return (
    <div
      className={`rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-200/30 overflow-hidden ${className}`}
    >
      {padding ? <div className="px-6 sm:px-8 py-8 sm:py-10">{children}</div> : children}
    </div>
  );
}

export function SettingsPageHeader({ badge, title, description }) {
  return (
    <div className="mb-8">
      {badge && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-3">
          {badge}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{title}</h1>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
}

export function SettingsSectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-3">
      {children}
    </h3>
  );
}

export default function SettingsPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] font-sans text-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8 pb-20">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <StickyProfileSettings />
          <div className="flex-1 min-w-0 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
