import { useState, useEffect } from "react";
import "./../../src/App.css";
import React from "react";
import { TreeSelect } from "primereact/treeselect";
import { NodeService } from "../service/NodeService";
import Jobs from "../Components/ListJob.jsx";
import Header from "../Components/Header.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import {
  ArrowPathIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import StickyTopCV from "../Components/StickyTopCV.jsx";
import { ChevronLeftIcon, ChevronRightIcon } from "flowbite-react";
function App() {
  const [nodes, setNodes] = useState(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="bg-[#F8F4FC]">
      <Header />
      <div className="flex  items-start">
        <StickyTopCV />
        <div className="w-[80%] pb-20 pt-10">
          <div className="flex justify-center items-center ">
            <label className=" flex justify-center items-center border-2 border-black rounded-3xl h-10 w-[85%] bg-white">
              <input
                placeholder="Vị trí tuyển dụng, công việc, ngành nghề,..."
                className="h-10 w-[75%] flex-start outline-0 border-0 ml-7"
              />
              <div className="grid grid-cols-2 divide-x-2 divide-gray-300 text-gray-300 flex-end w-[25%]">
                <div className="flex items-center justify-center pr-1">
                  <div className="h-5 w-5">
                    <Bars3Icon />
                  </div>
                  <div className=" ml-1">Mới nhất</div>
                </div>
                <div className="flex items-center ml-3">
                  <div className="h-5 w-5">
                    <MagnifyingGlassIcon />
                  </div>
                  <div className=" ml-1">Search</div>
                </div>
              </div>
            </label>
          </div>
          <div className="flex justify-center mt-10">
            <div className="border-2 border-black w-[85%] h-120 rounded-3xl bg-white p-5 ">
              <div className="font-semibold flex items-center">
                Recommend for you
                <div className="h-6 w-10 rounded-xl flex justify-center items-center ml-3 hover:bg-gray-300">
                  <div className="w-5 h-5 ">
                    <ArrowPathIcon />
                  </div>
                </div>
              </div>
              <div className="h-80 w-230 p-3 grid grid-cols-2 gap-3 ml-5 ">
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-10 ">
            <div className="w-[85%] p-5 border-2 border-gray-300 rounded-2xl">
              <div className="place-content-between flex">
                <div className="font-semibold text-lg">Newest posts</div>
                <div className="text-sm text-gray-400 flex ">
                  Show all
                  <div className="h-5 w-5 ml-1">
                    <ArrowRightIcon />
                  </div>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 ml-5 gap-5 mt-5">
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
                <Jobs color="bg-white" />
              </div>
              <div className="place-self-end flex">
                <button
                  type="button"
                  className="text-black bg-white cursor-pointer border-2 border-black hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm p-0.5 text-center inline-flex items-center me-2 "
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className="text-black bg-white cursor-pointer border-2 border-black hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm p-0.5 text-center inline-flex items-center me-2 "
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center ">
            <div className="border-2 border-black bg-white h-140 w-[85%] rounded-3xl p-5 mt-10">
              <div className="flex items-center">
                <div className="h-5 w-5 mr-3 text-gray-400">
                  <Bars3Icon />
                </div>
                <div className="text-gray-400">Lọc theo:</div>

                <div className="card flex justify-content-center items-center place-content-center ml-5">
                  <TreeSelect
                    value={selectedNodeKey}
                    onChange={(e) => setSelectedNodeKey(e.value)}
                    options={nodes}
                    className="w-70 card h-12 pl-3"
                    selectionMode="checkbox"
                    display="chip"
                    showClear
                    filter
                    placeholder="Tìm kiếm lựa chọn"
                  ></TreeSelect>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 ml-5 gap-5 mt-5">
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
                <Jobs color="bg-[#F8F4FC]" />
              </div>
              <div className="flex justify-center items-center ">
                <button
                  type="button"
                  className=" text-sm italic text-cyan-400 underline mt-3 p-2 hover:bg-gray-200  rounded-3xl cursor-pointer"
                >
                  Show all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
