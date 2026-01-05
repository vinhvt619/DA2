import { useState, useEffect } from "react";
import "./../../src/App.css";
import React from "react";
import { NodeService } from "../service/NodeService";
import Header from "../Components/Header.jsx";
import StickyTopCV from "../Components/StickyTopCV.jsx";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import StickySettings from "../Components/StickySettings.jsx";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
function Messenger() {
  const [nodes, setNodes] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="bg-[#F8F4FC] ">
      <Header />
      <div className="flex items-start">
        <StickySettings />
        <div className="w-[80%] flex ">
          <div className="border-1 border-black h-screen w-[20%] bg-white">
            <div className=" flex items-center justify-between m-3">
              <div className="font-semibold text-xl">Đoạn chat</div>
              <EllipsisHorizontalIcon className="size-6 rounded-full hover:bg-gray-300 p-0.5 cursor-pointer" />
            </div>
            <div className="flex justify-center relative">
              <MagnifyingGlassIcon className="size-5 text-gray-400 absolute left-6 top-2" />
              <input
                type="search"
                placeholder="Tìm kiếm trên Messenger"
                className="rounded-4xl p-2 text-sm w-[90%] box-border pl-8"
              />
            </div>
          </div>
          <div></div>
          <div className="border-1 border-black h-screen w-[50%] bg-white"></div>
          <div className="border-1 border-black h-screen w-[30%] bg-white"></div>
        </div>
      </div>
    </div>
  );
}

export default Messenger;
