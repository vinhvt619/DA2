import React from "react";
import StickyBox from "react-sticky-box";
import Terms from "./TermOfUse";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
export default function ListChatBox({ name, chat, hour, choose }) {
  return (
    <div
      className={`group border-2 border-[#c879ecbb] mb-5 w-[90%] h-15 rounded-xl cursor-pointer flex items-center justify-between px-2 ${
        choose ? "bg-[#F8F4FC] " : "bg-white  hover:bg-[#F8F4FC]"
      }`}
    >
      <div className="flex justify-start items-center">
        <div className="border-1 border-black h-10 w-10 rounded-full m-2 bg-gray-300" />
        <div className="text-sm">
          <div className="font-semibold">{name}</div>
          <div className="flex justify-between w-30 items-center text-xs text-gray-600">
            <div>{chat}</div>
            <div className="font-bold text-xs">.</div>
            <div>{hour}</div>
          </div>
        </div>
      </div>

      <div className="hidden group-hover:flex items-center text-xl font-bold text-black pr-2 pb-3">
        <EllipsisHorizontalIcon className=" mt-3 size-7 ml-1 rounded-full hover:bg-gray-300 p-0.5 cursor-pointer" />
      </div>
    </div>
  );
}
