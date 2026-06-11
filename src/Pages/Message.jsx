import "../App.css";
import React, { useState } from "react";
import Header from "../Components/Header.jsx";
import ShowMenuChatHook from "../hooks/ShowMenuChatBoxHook.jsx";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import ListChatBox from "../Components/ListChatBox.jsx";
import ChatBox from "../Components/ChatBox.jsx";
import ProfileChatBox from "../Components/ProfileChatBox.jsx";

function Messenger() {
  const { openMenu, toggleMenu } = ShowMenuChatHook(true);
  const [openSettingChat, setOpenSettingChat] = useState(false);

  return (
    <div className="bg-[#F8F4FC] h-screen flex flex-col font-sans overflow-hidden">
      <Header />

      <div className="flex flex-1 items-start h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-4 gap-4 overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="border border-gray-200 w-[340px] bg-white rounded-2xl flex flex-col h-full shadow-sm shrink-0 overflow-hidden relative">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h1 className="font-extrabold text-xl text-gray-900 tracking-tight">
              Đoạn chat
            </h1>
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full p-2 cursor-pointer border border-gray-200"
                type="button"
                onClick={() => setOpenSettingChat(!openSettingChat)}
              >
                <EllipsisHorizontalIcon className="size-5" />
              </button>
              
              {openSettingChat && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-[#9346F5] font-semibold">
                    Cài đặt đoạn chat
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-[#9346F5] font-semibold border-t border-gray-100">
                    Trợ giúp & Hỗ trợ
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 mb-4 relative">
            <MagnifyingGlassIcon className="size-5 text-gray-400 absolute left-8 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full outline-none focus:border-[#9346F5] focus:bg-white font-medium placeholder:text-gray-400 text-gray-800"
            />
          </div>

          <div className="flex items-center gap-2 px-5 mb-4 overflow-x-auto no-scrollbar">
            <div className="bg-[#9346F5] text-white rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap">
              Tất cả
            </div>
            <div className="text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap">
              Chưa đọc
            </div>
            <div className="text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap">
              Nhóm
            </div>
          </div>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
            <div className="space-y-1 mt-1 px-3 pb-3 flex flex-col">
              {[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((list, i) => (
                <ListChatBox
                  key={i}
                  name={i === 0 ? "Phòng nhóm chung" : i === 1 ? "Nguyễn Văn Toàn" : "Trần Tiến Đạt"}
                  chat={i === 0 ? "Xin chào cả nhóm!" : "Dạ vâng ạ"}
                  hour={i === 0 ? "Vừa xong" : "12 giờ trước"}
                  choose={list === 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <div className="h-full border border-gray-200 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1">
          <ChatBox onToggleMenu={toggleMenu} />
        </div>

        {/* Profile Chat Box */}
        <div
          className={`h-full border border-gray-200 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 ${
            openMenu ? "w-[320px]" : "w-0 border-none opacity-0 pointer-events-none"
          }`}
        >
          {openMenu && (
            <div className="min-w-[320px] h-full overflow-y-auto no-scrollbar">
              <ProfileChatBox />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messenger;
