import { MinusCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
export default function AddEmail() {
  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div className="border h-[40%] w-[20%] bg-white rounded-2xl p-3">
        <div className="place-self-center font-semibold">
          Thêm địa chỉ email
        </div>
        <div className="mt-2 ml-3">
          <div className="font-medium">Địa chỉ email của bạn</div>
          <div className="flex items-center">
            <div className="text-sm text-gray-600">vinhvt619@gmail.com</div>
            <div className="text-red-800 hover:bg-red-800 hover:text-white cursor-pointer p-0.5 rounded-2xl ml-1">
              <MinusCircleIcon className="size-4 stroke-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
