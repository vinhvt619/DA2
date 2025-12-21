import React, { useState } from "react";
import { Button } from "flowbite-react";

export default function TopCVList() {
  const [active, setActive] = useState("t1");

  function ListCV() {
    return (
      <div className="bg-white border-1 border-black rounded-2xl p-2.5 mt-4 w-80 text-sm cursor-pointer hover:bg-[#FEEFFB]">
        <div className="flex items-center space-x-3">
          <div className="pl-4">1st</div>
          <div className="ml-4">
            <div>Thanh lịch</div>
            <div className="flex text-xs">
              <div className="mr-5">Được sử dụng:</div>
              <div>2520 lượt sử dụng</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[80%] bg-[#F5F1FB] border-2 border-gray-300 rounded-3xl p-5">
      <div className="font-medium text-lg">Top Công ty / Doanh nghiệp</div>
      <div className="pl-13 pt-2 pb-5">
        <div className="flex mt-3">
          <Button
            color="light"
            size="xs"
            className={`pill mr-3 shadow-none  hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
              active === "t1"
                ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
                : "bg-white"
            }`}
            onClick={() => setActive("t1")}
          >
            Được sử dụng nhiều nhất
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill mr-3 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
              active === "t2"
                ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
                : "bg-white"
            }`}
            onClick={() => setActive("t2")}
          >
            Được xem nhiều nhất
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill mr-3 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
              active === "t3"
                ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
                : "bg-white"
            }`}
            onClick={() => setActive("t3")}
          >
            Theo ngày
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
              active === "t4"
                ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
                : "bg-white"
            }`}
            onClick={() => setActive("t4")}
          >
            Theo thứ tự tăng dần
          </Button>
        </div>
        <div className="p-3 grid grid-cols-2 gap-1">
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
          <ListCV />
        </div>
      </div>
    </div>
  );
}
