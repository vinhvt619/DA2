import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
export default function AddActivity({ active, popUp }) {
  return (
    <div
      className={`fixed inset-0 backdrop-blur-none flex justify-center items-center ${
        active ? "" : "hidden"
      }`}
    >
      <div className="border border-black bg-white w-150 h-200 rounded-4xl">
        <div className="relative flex justify-center items-center mt-7">
          <div className="font-semibold text-xl">Chỉnh sửa hoạt động</div>
          <div className="absolute right-7 cursor-pointer" onClick={popUp}>
            <XMarkIcon className="size-5 stroke-2" />
          </div>
        </div>
        <div className="ml-12 mt-5">
          <div className="text-sm font-medium ml-2">Trường</div>
          <input
            className="border border-black p-1 pl-5 w-[90%] rounded-2xl mt-1.5"
            placeholder="Aa"
          />
        </div>
        <div className="ml-12 mt-3">
          <div className="text-sm font-medium ml-2">Bằng cấp</div>
          <input
            className="border border-black p-1 pl-5 w-[90%] rounded-2xl mt-1.5"
            placeholder="Aa"
          />
        </div>
        <div className="ml-12 mt-3">
          <div className="text-sm font-medium ml-2">Ngành học</div>
          <input
            className="border border-black p-1 pl-5 w-[90%] rounded-2xl mt-1.5"
            placeholder="Aa"
          />
        </div>
        <div className="ml-12 mt-7 flex gap-14">
          <div className="flex flex-col">
            <div className="text-sm font-medium ml-2">Ngày bắt đầu</div>
            <input
              className="border border-black rounded-2xl mt-2 p-1 pl-5 "
              type="date"
            ></input>
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-medium ml-2">Ngày kết thúc</div>
            <input
              className="border border-black rounded-2xl mt-2 p-1 pl-5"
              type="date"
            />
          </div>
        </div>
        <div className="ml-12 mt-5">
          <div className="text-sm font-medium ml-2">Điểm số</div>
          <input
            className="border border-black p-1 pl-5 w-[90%] rounded-2xl mt-1.5"
            placeholder="Aa"
            type="number"
          />
        </div>
        <div className="flex flex-col items-center mt-7">
          <div
            className="border border-black rounded-4xl p-2 px-5 bg-indigo-300 text-white text-base font-semibold cursor-pointer hover:bg-indigo-500"
            onClick={popUp}
          >
            Chỉnh sửa
          </div>
        </div>
      </div>
    </div>
  );
}
