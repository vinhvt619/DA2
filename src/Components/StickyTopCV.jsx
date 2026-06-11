import React, { useState } from "react";
import Terms from "./TermOfUse";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function StickyTopCV() {
  const [active, setActive] = useState("b1");

  const buttonClass = (name) =>
    `mb-3 flex w-60 items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
      active === name
        ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF]"
        : "bg-white"
    }`;

  return (
    <aside className="ml-10 flex w-[20%] items-start justify-center lg:sticky lg:top-4">
      <div className="mt-10">
        <button
          type="button"
          className={buttonClass("b1")}
          onClick={() => setActive("b1")}
        >
          Top c?c c?ng ty h?ng ??u
          <ChevronRightIcon className="ml-4 h-4 w-4" />
        </button>
        <button
          type="button"
          className={buttonClass("b2")}
          onClick={() => setActive("b2")}
        >
          <span className="line-clamp-2 w-[80%] text-left">
            Top c?c CV ???c s? d?ng nhi?u nh?t
          </span>
          <ChevronRightIcon className="ml-4 h-4 w-4" />
        </button>
        <button
          type="button"
          className={buttonClass("b3")}
          onClick={() => setActive("b3")}
        >
          <span className="w-[80%] text-left">Tin t?c</span>
          <ChevronRightIcon className="ml-4 h-4 w-4" />
        </button>
        <Terms />
      </div>
    </aside>
  );
}
