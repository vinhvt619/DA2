import { useState, useEffect } from "react";
import "./../../src/App.css";
import React from "react";
import { NodeService } from "../service/NodeService.jsx";
import Header from "../Components/Header.jsx";
import StickyTopCV from "../Components/StickyTopCV.jsx";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import StickySettings from "../Components/StickySettings.jsx";
import ShowMenuChatHook from "../hooks/ShowMenuChatBoxHook.jsx";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import ListChatBox from "../Components/ListChatBox.jsx";
import ChatBox from "../Components/ChatBox.jsx";
import ProfileChatBox from "../Components/ProfileChatBox.jsx";
function Messenger() {
  // const [nodes, setNodes] = useState(null);
  // useEffect(() => {
  //   NodeService.getTreeNodes().then((data) => setNodes(data));
  // }, []);
  const { openMenu, toggleMenu } = ShowMenuChatHook(true);
  return (
    <div className="bg-[#F8F4FC]">
      <Header />
      <div className="flex items-start h-screen">
        <StickySettings />
        <div className="w-full flex h-full">
          <div className="border border-black w-[20%] bg-white rounded-2xl flex flex-col h-[96%] mt-5 pb-7 ">
            <div className=" flex items-center justify-between m-3">
              <div className="font-semibold text-xl">Đoạn chat</div>
              <EllipsisHorizontalIcon className="size-6 rounded-full hover:bg-gray-300 p-0.5 cursor-pointer" />
            </div>
            <div className="flex justify-center relative ">
              <MagnifyingGlassIcon className="size-5 text-gray-400 absolute left-6 top-2" />
              <input
                type="search"
                placeholder="Tìm kiếm trên Messenger"
                className="rounded-4xl p-2 text-sm w-[90%] box-border pl-8"
              />
            </div>
            <div className="flex justify-between w-[95%] items-center">
              <div className="bg-[#c879ecbb] rounded-4xl ml-3 mt-3 p-2 text-xs font-semibold text-[#ffffff] w-15 cursor-pointer hover:bg-[#c779ec60] hover:text-[#d76cfd98]">
                <div className="flex justify-center ">Tất cả</div>
              </div>
              <div className="rounded-4xl ml-3 mt-3 p-2 text-xs font-semibold text-[#c879ecbb] w-20 cursor-pointer hover:bg-[#c779ec60] hover:text-white">
                <div className="flex justify-center ">Chưa đọc</div>
              </div>
              <div className="rounded-4xl ml-3 mt-3 p-2 text-xs font-semibold text-[#c879ecbb] w-15 cursor-pointer hover:bg-[#c779ec60] hover:text-white">
                <div className="flex justify-center ">Nhóm</div>
              </div>
              <div>
                <EllipsisHorizontalIcon className=" mt-3 size-6 ml-1 rounded-full hover:bg-gray-300 p-0.5 cursor-pointer" />
              </div>
            </div>
            <div className="place-items-center flex-1 w-full mt-5 overflow-y-auto ">
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={true}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
              <ListChatBox
                name="Toàn 36"
                chat="raumania"
                hour="12 hours"
                choose={false}
              />
            </div>
          </div>
          <div
            className={` h-screen   flex justify-center items-center ${
              openMenu ? "w-[55%]" : "w-[80%]"
            }`}
          >
            <ChatBox onToggleMenu={toggleMenu} />
          </div>
          <div
            className={`h-screen w-[25%]  flex justify-center items-center ${
              openMenu ? "" : "hidden"
            }`}
          >
            <ProfileChatBox />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messenger;
