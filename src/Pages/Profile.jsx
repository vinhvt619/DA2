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
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import StickySettings from "../Components/StickySettings.jsx";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";
import { Button } from "@heroui/react";

import { InputText } from "primereact/inputtext";
function TagInput({ tag, content }) {
  return (
    <div>
      <div> {tag}</div>

      <input
        className="border-1 border-black font-medium rounded-2xl p-3 mt-2 pl-7 w-90"
        placeholder={tag}
        value={content}
      ></input>
    </div>
  );
}
function ExperienceTag({ CompanyName, DegreeName, Date }) {
  return (
    <div className="border-1 border-black bg-[#F8F4FC] rounded-3xl h-24 w-130 mt-5 ml-5 cursor-pointer">
      <div className="flex p-4.5 ml-3 items-center">
        <div className="bg-[#B4A6A6] rounded-full h-12 w-12"></div>
        <div className="ml-6">
          <div className="text-base font-medium">{CompanyName}</div>
          <div className="text-sm">{DegreeName}</div>
          <div className="text-xs">{Date}</div>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const [nodes, setNodes] = useState(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="bg-[#F8F4FC]">
      <Header />
      <div className="pt-10 flex  items-start">
        <StickyProfileSettings />
        <div className="w-[80%] pb-20 flex justify-center mt-10">
          <div className="border-1 border-black h-325 w-[65%] bg-white">
            <div className=" relative bg-[#D9D9D9] border-b-1 border-b-black h-30">
              <div className="absolute border-1 border-black rounded-full h-30 w-30 top-15 left-15 bg-[#D9D9D9]"></div>
            </div>
            <div className="mt-17 ml-17 text-lg">Nguyễn Vinh</div>
            <div className="relative">
              <Button className=" bg-[#01A4FF] rounded-full text-white text-lg p-5 w-25 absolute -top-16 right-20">
                Lưu
              </Button>
            </div>
            <div className="ml-7 mt-10">
              <div className="font-medium text-2xl ">Thông tin cá nhân</div>
              <div className="flex justify-between ml-5 text-sm mt-2">
                <TagInput tag="Họ và tên" content="Nguyễn Thành Vinh" />
                <div className="mr-15">
                  <div> Ngày sinh</div>

                  <input
                    className="border-1 border-black font-medium rounded-2xl p-3 mt-2 pl-7 w-90"
                    type="date"
                  ></input>
                </div>
              </div>
              <div className="ml-5 text-sm mt-4 flex items-center ">
                <div className="font-medium">Tuổi</div>
                <input
                  className="border-1 border-black rounded-2xl w-20 ml-10 pr-4 text-center"
                  type="number"
                  value={22}
                ></input>
              </div>
              <div className="flex justify-between ml-5 text-sm mt-2">
                <TagInput
                  tag="Địa chỉ"
                  content="244 Lý Thường Kiệt, Quận 10, Tp.HCM"
                />
                <div className="mr-15">
                  <TagInput tag="Quốc gia" content="Việt Nam" />
                </div>
              </div>
              <div className="flex justify-between ml-5 text-sm mt-2">
                <TagInput tag="Quê quán" content="Hà Tĩnh" />
                <div className="mr-15">
                  <TagInput tag="Email" content="vinhvt619@gmail.com" />
                </div>
              </div>
            </div>

            <div className="ml-8 mt-10">
              <div className="flex items-center">
                <div className="font-medium text-2xl">Giáo dục</div>
                <div className=" mx-2 rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PlusIcon className="size-4" />
                </div>
                <div className="rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PencilIcon className="size-4" />
                </div>
              </div>
              <ExperienceTag
                CompanyName={"Ho Chi Minh University of Technology"}
                DegreeName={"Bachelor's degree, Computer Science"}
                Date={"Sep 2020 - Nov 2024"}
              />
            </div>
            <div className="ml-8 mt-10">
              <div className="flex items-center">
                <div className="font-medium text-2xl">Hoạt động</div>
                <div className=" mx-2 rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PlusIcon className="size-4" />
                </div>
                <div className="rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PencilIcon className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 ml-7 ">
                <div className="font-normal text-xl">
                  Bạn vẫn chưa có hoạt động nào
                </div>
                <div className="font-light text-xs">
                  Các bài đăng hoạt động sẽ được hiển thị ở đây
                </div>
              </div>
            </div>
            <div className="ml-8 mt-10">
              <div className="flex items-center">
                <div className="font-medium text-2xl">Kinh nghiệm</div>
                <div className=" mx-2 rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PlusIcon className="size-4" />
                </div>
                <div className="rounded-full hover:bg-gray-300 p-2 cursor-pointer">
                  <PencilIcon className="size-4" />
                </div>
              </div>
              <ExperienceTag
                CompanyName={"FPT Software Telecom"}
                DegreeName={"Internship"}
                Date={"Oct 2024 - Dec 2024"}
              />
              <ExperienceTag
                CompanyName={"VNG Corporation"}
                DegreeName={"Fresher"}
                Date={"Jan 2025 - Dec 2025"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
