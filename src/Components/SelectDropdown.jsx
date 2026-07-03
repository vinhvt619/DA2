import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function SelectDropdown({ options, value, onChange, placeholder = "Chọn một tùy chọn" }) {
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm bg-white border border-violet-200 rounded-xl shadow-sm hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
      >
        <span className={`truncate ${selectedOption ? "text-gray-800 font-medium" : "text-gray-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`w-4 h-4 text-violet-500 transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 origin-top bg-white border border-violet-100 rounded-xl shadow-xl shadow-violet-200/40 outline-none overflow-hidden max-h-60 overflow-y-auto">
          <div className="py-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                Không có dữ liệu
              </div>
            ) : (
              options.map((option) => (
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
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
