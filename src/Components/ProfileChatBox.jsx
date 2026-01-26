import {
  BellIcon,
  BellSlashIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FlagIcon,
  InboxArrowDownIcon,
  MinusCircleIcon,
  PhotoIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
export default function ProfileChatBox() {
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  return (
    <div className=" border-1 border-black h-[96%] w-[96%] rounded-2xl bg-white">
      <div className="flex justify-center mt-10">
        <div className=" border border-black rounded-full h-25 w-25"></div>
      </div>
      <div className="flex justify-center items-center text-xs text-gray-500 mt-2">
        Đang hoạt động
      </div>
      <div className="flex justify-center items-center mt-2">
        <UserCircleIcon className="size-6" />
        <BellIcon className="size-6" />
      </div>
      <div className=" flex flex-col items-center mt-5">
        <div
          className="font-semibold border border-black p-2 px-4 rounded-xl w-[90%] flex justify-between items-center bg-[#f8f4fc60] cursor-pointer"
          onClick={() => setShowChatInfo((prev) => !prev)}
        >
          <div>Thông tin về đoạn chat</div>
          <ChevronDownIcon
            className={`size-5 transition-transform duration-200 ${
              showChatInfo ? "rotate-180" : ""
            }`}
          />
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 rounded-x-xl rounded-b-xl w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showChatInfo ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <InboxArrowDownIcon className="size-6" />
            <div className="ml-3">Tin nhắn đã ghim</div>
          </div>
        </div>
      </div>
      <div className=" flex flex-col items-center mt-2">
        <div
          className="font-semibold border border-black p-2 px-4 rounded-xl w-[90%] flex justify-between items-center bg-[#f8f4fc60] cursor-pointer"
          onClick={() => setShowFile((prev) => !prev)}
        >
          <div>File phương tiện & file</div>
          <ChevronDownIcon
            className={`size-5 transition-transform duration-200 ${
              showFile ? "rotate-180" : ""
            }`}
          />
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showFile ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <PhotoIcon className="size-6" />
            <div className="ml-3">File phương tiện</div>
          </div>
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 rounded-x-xl rounded-b-xl w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showFile ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <DocumentTextIcon className="size-6" />
            <div className="ml-3">File</div>
          </div>
        </div>
      </div>
      <div className=" flex flex-col items-center mt-2">
        <div
          className="font-semibold border border-black p-2 px-4 rounded-xl w-[90%] flex justify-between items-center bg-[#f8f4fc60] cursor-pointer"
          onClick={() => setShowSupport((prev) => !prev)}
        >
          <div>Quyền riêng tư và hỗ trợ</div>
          <ChevronDownIcon
            className={`size-5 transition-transform duration-200 ${
              showSupport ? "rotate-180" : ""
            }`}
          />
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showSupport ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <BellSlashIcon className="size-6" />
            <div className="ml-3">Tắt thông báo</div>
          </div>
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showSupport ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <ShieldCheckIcon className="size-6" />
            <div className="ml-3">Quyền nhắn tin</div>
          </div>
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showSupport ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <MinusCircleIcon className="size-6" />
            <div className="ml-3">Hạn chế</div>
          </div>
        </div>
        <div
          className={`border-x border-b border-black p-2 px-4 rounded-x-xl rounded-b-xl w-[80%] bg-[#f8f4fc60] cursor-pointer hover:bg-gray-200 transition-transform duration-200 ${
            showSupport ? "" : "hidden"
          }`}
        >
          <div className="flex justify-start items-center">
            <FlagIcon className="size-6" />
            <div className="ml-3">
              <div>Báo cáo</div>
              <div className="text-[10px] text-gray-400">
                Đóng góp ý kiến và báo cáo cuộc trò chuyện
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
