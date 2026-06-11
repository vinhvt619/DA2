import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function NotificationItem({
  label,
  value,
  onChange,
  isOpen,
  onToggle,
  placement = "bottom",
}) {
  const [step, setStep] = useState("main");

  const selectValue = (val) => {
    onChange(val);
    setStep("main");
    onToggle();
  };

  const handleToggle = () => {
    if (!isOpen) setStep("main");
    onToggle();
  };

  return (
    <div className="flex justify-between items-center py-3 gap-4">
      <span className="text-sm font-medium text-gray-900">{label}</span>

      <div className="relative min-w-[160px]">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-violet-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
        >
          <span className="truncate">{value}</span>
          <ChevronDownIcon className={`size-4 shrink-0 text-violet-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            className={`absolute left-0 w-full bg-white border border-violet-200 rounded-lg shadow-lg shadow-violet-200/30 z-20 overflow-hidden ${
              placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            {step === "main" ? (
              <>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-100 transition-colors"
                  onClick={() => selectValue("Bật")}
                >
                  Bật
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-100 transition-colors"
                  onClick={() => selectValue("Tắt")}
                >
                  Tắt
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-100 transition-colors border-t border-violet-100"
                  onClick={() => setStep("custom")}
                >
                  Tùy chỉnh thời gian
                  <ChevronRightIcon className="size-4 text-violet-500" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-100 transition-colors border-b border-violet-100"
                  onClick={() => setStep("main")}
                >
                  <ChevronLeftIcon className="size-4 text-violet-500" />
                  Quay lại
                </button>
                {["Sau 1 giờ", "Sau 8 giờ", "Sau 12 giờ", "Sau 24 giờ"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-violet-100 transition-colors"
                    onClick={() => selectValue(option)}
                  >
                    {option}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
