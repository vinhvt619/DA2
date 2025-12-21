import React, { useState } from "react";

export default function ListNews() {
  function ListCV() {
    return (
      <div className="w-45 pt-10 group hover:underline cursor-pointer">
        <div className="border-2 border-black bg-gray-300 rounded-2xl h-20 group-hover:bg-gray-500"></div>
        <div className="text-xs font-semibold">
          Hướng dẫn viết CV dành cho người mới
        </div>
        <div className="text-xs text-[#A2A2A2] font-light">07/05/2002</div>
        <div className="line-clamp-3 text-xs text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
    );
  }

  return (
    <div className="w-[80%] bg-white border-2 border-gray-300 rounded-3xl p-5">
      <div className="font-medium text-xl pt-2 pl-2">Tin tức</div>
      <div className="pl-15 pb-5 grid grid-cols-3 gap-1">
        <ListCV />
        <ListCV />
        <ListCV />
        <ListCV />
        <ListCV />
        <ListCV />
      </div>
    </div>
  );
}
