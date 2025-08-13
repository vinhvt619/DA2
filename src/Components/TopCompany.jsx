import React from "react";
import { useState } from "react";
import { Button } from "flowbite-react";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";

export default function TopCompany() {
  const [active, setActive] = useState("t1");
  return (
    <div className="h-100 w-[80%] bg-[#E8DEF5] border-2 border-gray-300 rounded-3xl p-5">
      <div className="font-medium text-lg">Top Công ty / Doanh nghiệp</div>
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
          Theo lượt đánh giá
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
          Theo số lượng sử dụng
        </Button>
        <Button
          color="light"
          size="xs"
          className={`pill hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "t3"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("t3")}
        >
          Theo thứ tự tăng dần
        </Button>
      </div>
      <div className="bg-white border-2 border-black h-15 w-100 rounded-2xl p-2">
        <div className="flex items-center">
          <div className="text-md">1st</div>
          <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-300"></div>
          <div>
            <div className="text-xs">Công ty TNHH Sorimachi VN</div>
            <div className="flex text-xs items-center">
              <div>Review</div>
              <Stack spacing={1}>
                <Rating size="small" defaultValue={2.5} precision={0.5} />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
