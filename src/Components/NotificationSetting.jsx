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
}) {
  const [step, setStep] = useState("main");

  const selectValue = (val) => {
    onChange(val);
    setStep("main");
    onToggle();
  };

  return (
    <div className="text-sm font-semibold flex justify-between items-center my-3">
      <div>{label}</div>

      <div className="dropdown">
        <div className="dropdown-select flex items-center" onClick={onToggle}>
          {value}
          <ChevronDownIcon className="size-4" />
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            {step === "main" && (
              <div>
                <div className="item" onClick={() => selectValue("Bật")}>
                  Bật
                </div>
                <div className="item" onClick={() => selectValue("Tắt")}>
                  Tắt
                </div>
                <div
                  className="item next flex items-center justify-between"
                  onClick={() => setStep("custom")}
                >
                  Tùy chỉnh thời gian
                  <ChevronRightIcon className="size-4" />
                </div>
              </div>
            )}

            {step === "custom" && (
              <div>
                <div
                  className="item back flex items-center"
                  onClick={() => setStep("main")}
                >
                  <ChevronLeftIcon className="size-4" />
                  <div className="ml-2">Quay lại</div>
                </div>

                {["Sau 1 giờ", "Sau 8 giờ", "Sau 12 giờ", "Sau 24 giờ"].map(
                  (i) => (
                    <div
                      key={i}
                      className="item custom-select"
                      onClick={() => selectValue(i)}
                    >
                      {i}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
