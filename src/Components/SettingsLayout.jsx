import React from "react";
import Header from "./Header.jsx";
import StickyProfileSettings from "./StickyProfileSettings.jsx";

export function SettingsCard({ children, className = "", padding = true, overflowHidden = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(76,29,149,0.06)] ${overflowHidden ? "overflow-hidden" : ""} ${className}`}
    >
      {padding ? <div className="px-5 sm:px-6 py-6 sm:py-8">{children}</div> : children}
    </div>
  );
}

export function SettingsPageHeader({ badge, title, description }) {
  return (
    <div className="mb-6">
      {badge && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
          {badge}
        </div>
      )}
      <h1 className="mb-1.5 text-xl font-bold text-slate-950 sm:text-2xl">{title}</h1>
      {description && <p className="text-xs leading-5 text-slate-500">{description}</p>}
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
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 page-transition">
      <Header />
      <div className="mx-auto w-full max-w-[1040px] px-3 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-col items-start gap-4 md:flex-row">
          <StickyProfileSettings />
          <div className="flex-1 min-w-0 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
