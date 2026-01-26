import React from "react";
import StickyBox from "react-sticky-box";
import Terms from "./TermOfUse";
import ShowMenuChatHook from "../hooks/ShowMenuChatBoxHook.jsx";
import {
  EllipsisHorizontalIcon,
  FaceSmileIcon,
  GifIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
function OpponentChat({ chat }) {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[45%] whitespace-pre-wrap break-all border-1 border-black rounded-r-lg rounded-l-md w-fit p-2 ml-5 mb-1">
        {chat}
      </div>
    </div>
  );
}
function Reply({ chat }) {
  return (
    <div className="flex justify-end w-full">
      <div className="max-w-[45%] whitespace-pre-wrap break-all border-1 border-black rounded-l-lg rounded-r-md w-fit p-2 ml-5 mb-1 mr-3">
        {chat}
      </div>
    </div>
  );
}
export default function ChatBox({ onToggleMenu }) {
  return (
    <div className="bg-white border-1 border-black h-[96%] w-[96%] rounded-2xl">
      <div className="flex p-5 w-full items-center justify-between ">
        <div className="flex">
          <div className="border-1 border-black h-9 w-9 rounded-full"></div>
          <div className="ml-3">
            <div className="text-sm font-semibold">Toàn 36</div>
            <div className="text-xs text-gray-400">Đang hoạt động</div>
          </div>
        </div>
        <div className="flex justify-between w-25">
          <div className="p-2 hover:bg-gray-300 rounded-full cursor-pointer">
            <PhoneIcon className="size-5 " />
          </div>
          <div className="p-2 hover:bg-gray-300 rounded-full cursor-pointer">
            <VideoCameraIcon className="size-5" />
          </div>
          <div
            className="p-2 hover:bg-gray-300 rounded-full cursor-pointer"
            onClick={onToggleMenu}
          >
            <InformationCircleIcon className="size-5" />
          </div>
        </div>
      </div>
      <div className="overflow-y-auto h-[85%] w-full flex-col-reverse border-y-1  border-gray-300">
        <div className=" mt-3 w-full text-sm">
          <div className="text-gray-300 text-xs flex  justify-center items-center">
            12:30
          </div>
          <OpponentChat chat="Đang làm gì thế?aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Đang làm gì thế?" />
          <OpponentChat chat="Rảnh không" />
          <OpponentChat chat="T nhờ cái này cái" />
          <Reply chat="Cái gì?" />
          <Reply chat="Không rảnh" />
          <Reply chat="Lười lắm aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" />
          <OpponentChat chat="=)))" />
          <OpponentChat chat="Mua hộ t ly cà phê đi" />
          <OpponentChat chat="Lên lớp r" />
          <OpponentChat chat="Lười xuống quá :(" />
          <Reply chat="Không" />
          <OpponentChat chat=":(" />
        </div>
      </div>
      <div className=" flex items-center justify-evenly mt-3 px-1">
        <MicrophoneIcon className="size-6" />
        <PhotoIcon className="size-6" />
        <FaceSmileIcon className="size-6" />
        <GifIcon className="size-6" />
        <input
          className="border-1 border-black p-2 pl-3 rounded-3xl w-[75%]"
          placeholder="Aa"
        />
        <PaperAirplaneIcon className="size-6" />
      </div>
    </div>
  );
}
