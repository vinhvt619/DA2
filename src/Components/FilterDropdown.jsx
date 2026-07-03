import { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

export default function FilterDropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-violet-200 rounded-full shadow-sm hover:border-violet-400 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-52 mt-2 origin-top-right bg-white border border-violet-100 rounded-xl shadow-xl shadow-violet-200/40 outline-none overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center px-4 py-2.5 text-sm text-left transition-colors ${
                  value === option.value
                    ? "bg-violet-50 text-violet-700 font-semibold"
                    : "text-gray-700 hover:bg-violet-50/50"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
