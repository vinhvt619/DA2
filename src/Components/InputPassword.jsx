import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import React from "react";

function InputPassword({
  id,
  name,
  value,
  show,
  onChange,
  onToggle,
  placeholder = "Nhập mật khẩu",
  autoComplete = "new-password",
  preventAutofill = false,
}) {
  const [allowTyping, setAllowTyping] = React.useState(!preventAutofill);

  return (
    <div className="relative w-full">
        <input
          id={id}
          type={show ? "text" : "password"}
          name={name}
          aria-label={placeholder}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          readOnly={!allowTyping}
          onFocus={() => setAllowTyping(true)}
          data-lpignore={preventAutofill ? "true" : undefined}
          data-1p-ignore={preventAutofill ? "true" : undefined}
          data-form-type={preventAutofill ? "other" : undefined}
        />
        <button
          type="button"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
        >
          {show ? (
            <EyeIcon className="h-[18px] w-[18px]" />
          ) : (
            <EyeSlashIcon className="h-[18px] w-[18px]" />
          )}
        </button>
    </div>
  );
}

export default React.memo(InputPassword);
