import React from "react";
import { useState } from "react";
import StickyBox from "react-sticky-box";
import Terms from "./TermOfUse";
import { Button } from "flowbite-react";
import { HiOutlineArrowRight, HiShoppingCart } from "react-icons/hi";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function StickyTopCV() {
  const [active, setActive] = useState("b1");
  return (
    <StickyBox className=" w-[20%]  flex justify-center items-center ml-10">
      <div className="mt-10">
        <Button
          color="light"
          className={`mb-3 w-60 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "b1"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("b1")}
        >
          Top các công ty hàng đầu
          <ChevronRightIcon className="h-4 w-4 ml-4" />
        </Button>
        <Button
          color="light"
          className={`mb-3 w-60 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "b2"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("b2")}
        >
          <span className="line-clamp-2 w-[80%]">
            Top các CV được sử dụng nhiều nhất
          </span>
          <ChevronRightIcon className="h-4 w-4 ml-4" />
        </Button>
        <Button
          color="light"
          className={`mb-3 w-60 hover:bg-linear-to-r hover:from-[#F5D9FF] hover:to-[#F8E6FF] ${
            active === "b3"
              ? "bg-linear-to-r  from-[#E49AF6] to-[#CBA3FF]"
              : "bg-white"
          }`}
          onClick={() => setActive("b3")}
        >
          <span className="w-[80%]">Tin tức</span>
          <ChevronRightIcon className="h-4 w-4 ml-4" />
        </Button>
        <Terms />
      </div>
    </StickyBox>
  );
}
