import React from "react";
import Header from "./Header.jsx";
import StickyProfileSettings from "./StickyProfileSettings.jsx";

export function SettingsCard({ children, className = "", padding = true, overflowHidden = false }) {
  return (
    <div
      className={`rounded-2xl border border-[#9346F5]/10 bg-white/75 backdrop-blur-lg shadow-[0_8px_32px_rgba(147,70,245,0.06)] ${overflowHidden ? "overflow-hidden" : ""} ${className}`}
    >
      {padding ? <div className="px-5 sm:px-6 py-6 sm:py-8">{children}</div> : children}
    </div>
  );
}

export function SettingsPageHeader({ badge, title, description }) {
  return (
    <div className="mb-6">
      {badge && (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-650 px-2.5 py-1 text-xs font-semibold mb-3">
          {badge}
        </div>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">{title}</h1>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

export function SettingsSectionTitle({ children }) {
  return (
    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

export default function SettingsPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] font-sans text-gray-900 page-transition relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] right-[-5%] w-[350px] h-[350px] rounded-full bg-violet-200/25 blur-3xl pointer-events-none" />

      <Header />
      <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8 pb-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <StickyProfileSettings />
          <div className="flex-1 min-w-0 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
