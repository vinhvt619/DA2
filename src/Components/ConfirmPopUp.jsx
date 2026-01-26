import { MinusCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
export default function ConfirmPopUp({ confirm, cancel }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div className="border w-[20%] bg-white rounded-2xl p-3">
        <div className="place-self-center font-semibold">Xác nhận</div>
        <div className="mt-2 ml-3">
          <div className="text-xs">
            Bạn chắc chắn muốn xóa địa chỉ email này của mình?
          </div>
          <div className="flex text-sm justify-between px-5 pr-10 mt-3">
            <div
              className="p-2 px-3 border rounded-2xl text-cyan-500 font-bold hover:text-white hover:bg-cyan-500 cursor-pointer"
              onClick={confirm}
            >
              Xác nhận
            </div>
            <div
              className="p-2 px-5 border rounded-2xl text-red-500 font-bold hover:text-white hover:bg-red-500 cursor-pointer"
              onClick={cancel}
            >
              Hủy bỏ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
