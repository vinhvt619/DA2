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
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
function MainMenu() {
  const [nodes, setNodes] = useState(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFE] flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 pt-8">
        <div className="flex items-start gap-8">
          <StickyProfile />

          <div className="flex-1 pb-20">
            {/* Search Bar Section */}
            <div className="mb-8">
              <label className="flex items-center border-2 border-black rounded-2xl h-12 bg-white px-4 group">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  placeholder="Vị trí tuyển dụng, công việc, ngành nghề..."
                  className="flex-1 outline-none text-sm placeholder:text-gray-400"
                />
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200 ml-2">
                  <div className="flex items-center gap-1.5 text-gray-500 cursor-pointer hover:text-black transition-colors">
                    <Bars3Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">Mới nhất</span>
                  </div>
                  <button className="bg-[#9346F5] text-white px-6 py-1.5 rounded-xl font-bold text-xs hover:bg-[#7c38c9] transition-all cursor-pointer">
                    Tìm kiếm
                  </button>
                </div>
              </label>
            </div>

            <div className="space-y-8">
              {/* Recommend Section */}
              <div className="border-2 border-black rounded-3xl bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-800 flex items-center gap-3">
                    Gợi ý cho bạn
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <ArrowPathIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                </div>
              </div>

              {/* Newest Posts Section */}
              <div className="border-2 border-black rounded-2xl bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-800">
                    Tin tuyển dụng mới nhất
                  </h2>
                  <button className="text-xs font-bold text-[#9346F5] flex items-center gap-1 hover:underline">
                    Xem tất cả
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                </div>
                <div className="flex justify-end gap-3">
                  <button className="w-8 h-8 rounded-lg border border-black flex items-center justify-center bg-white hover:bg-gray-100 transition-colors cursor-pointer group">
                    <ChevronLeftIcon className="w-4 h-4 text-gray-500 group-hover:text-black" />
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-black flex items-center justify-center bg-white hover:bg-gray-100 transition-colors cursor-pointer group">
                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-black" />
                  </button>
                </div>
              </div>

              {/* Filter Section */}
              <div className="border-2 border-black rounded-3xl bg-white p-6">
                <div className="flex items-center gap-4 mb-6 pt-2">
                  <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                    <Bars3Icon className="w-4 h-4" />
                    <span>Lọc theo:</span>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <TreeSelect
                      value={selectedNodeKey}
                      onChange={(e) => setSelectedNodeKey(e.value)}
                      options={nodes}
                      className="w-full text-xs h-10 flex items-center"
                      selectionMode="checkbox"
                      display="chip"
                      showClear
                      filter
                      placeholder="Lọc tiêu chí"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                  <Jobs color="bg-[#FDF4FF]" />
                </div>
                <div className="flex justify-center pt-4">
                  <button className="text-xs font-bold text-[#9346F5] bg-[#9346F5]/5 px-8 py-2.5 rounded-full border border-[#9346F5] hover:bg-[#9346F5] hover:text-white transition-all cursor-pointer">
                    Xem toàn bộ tin tuyển dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
