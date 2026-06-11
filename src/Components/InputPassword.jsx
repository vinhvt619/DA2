import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import React from "react";

function InputPassword({ name, value, show, onChange, onToggle }) {
  return (
    <div className="mt-3">
      <div className="text-sm text-gray-600">{name}</div>
      <div className="flex relative w-[70%] mb-4">
        <input
          type={show ? "text" : "password"}
          className="rounded-2xl p-2.5 px-4 text-xs mt-2 w-full pr-8 border border-gray-300"
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
