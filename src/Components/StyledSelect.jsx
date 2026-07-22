import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

export default function StyledSelect({ value, onChange, options, label, className = "sm:w-[164px]" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-10 w-full min-w-[154px] items-center justify-between gap-3 rounded-xl border bg-white px-3.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 ${
          open
            ? "border-violet-500 text-violet-700 shadow-[0_0_0_3px_rgba(124,58,237,0.08)]"
            : "border-slate-200 text-slate-700 hover:border-violet-300"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-violet-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-30 mt-2 min-w-full overflow-hidden rounded-xl border border-violet-100 bg-white p-1.5 shadow-lg shadow-violet-200/30"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-xs transition ${
                  active
                    ? "bg-violet-50 font-semibold text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-violet-700"
                }`}
              >
                {option.label}
                {active && <CheckIcon className="h-4 w-4 shrink-0 text-violet-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
