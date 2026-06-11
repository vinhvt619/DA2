import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import React from "react";

function InputPassword({ name, value, show, onChange, onToggle }) {
  return (
    <div className="mt-3">
      <div className="text-sm text-gray-600">{name}</div>
      <div className="flex relative w-full max-w-md mb-2">
        <input
          type={show ? "text" : "password"}
          className="rounded-xl p-2.5 px-4 text-sm mt-1 w-full pr-10 border border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
          value={value}
          onChange={onChange}
          autoComplete="new-password"
        />
        <div
          className="cursor-pointer"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
        >
          {show ? (
            <EyeIcon className="size-4 absolute right-3 top-4.5" />
          ) : (
            <EyeSlashIcon className="size-4 absolute right-3 top-4.5" />
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(InputPassword);
