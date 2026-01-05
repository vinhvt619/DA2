import React from "react";
import StickyBox from "react-sticky-box";
import {
  BriefcaseIcon,
  UserIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import Terms from "./TermOfUse";
export default function StickyProfile() {
  return (
    <StickyBox className=" w-[20%]  flex justify-center items-center ml-10">
      <div className="mt-10">
        <div className="w-60 h-65 static">
          <div className="border-2 border-b-1 border-black h-15 rounded-t-3xl w-full bg-[#FFD8D8]"></div>
          <div className="border-2 border-black rounded-full h-15 w-15 bg-white top-17 left-21 absolute"></div>
          <div className="border-2 border-t-1 border-black h-45 rounded-b-3xl w-full bg-white">
            <div className="p-5 mt-6 text-[10px]">
              <div className=" font-bold text-sm">Nguyễn Thành Vinh</div>
              <div className="line-clamp-2">
                Ph.D at Ho Chi Minh University of Technology. Chill n free.
                Software Engineer. I&apos;m looking for a job that can help me
                to get rich in the future.
              </div>
              <div className="flex py-2">
                <span className="fi fi-vn "></span>
                <div className="text-gray-500 ml-2">
                  Ho Chi Minh City, Viet Nam
                </div>
              </div>
              Trường đại học Bách Khoa Hồ Chí Minh
            </div>
          </div>
        </div>

        <div className="border-2 border-black w-60 h-40 rounded-3xl flex justify-center bg-white text-sm">
          <div>
            <div className="flex p-2 items-center mt-3 hover:bg-gray-300 hover:rounded-2xl w-50">
              <div className="w-5 h-5 mr-3">
                <BriefcaseIcon />
              </div>
              <a href="#">Tìm công việc</a>
            </div>
            <div className="flex p-2 items-center mt-3 hover:bg-gray-300 hover:rounded-2xl">
              <div className="w-5 h-5 mr-3">
                <UserIcon />
              </div>
              <a href="#">Công việc của tôi</a>
            </div>
            <div className="flex p-2 items-center mt-3 hover:bg-gray-300 hover:rounded-2xl">
              <div className="w-5 h-5 mr-3">
                <BookmarkIcon />
              </div>
              <a href="#">Ưa thích</a>
            </div>
          </div>
        </div>
        <Terms />
      </div>
    </StickyBox>
  );
}
