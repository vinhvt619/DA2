import React from "react";
import StickyBox from "react-sticky-box";
import {
  ChatBubbleOvalLeftIcon,
  UserIcon,
  Cog6ToothIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
function Tab({ icon, content }) {
  return (
    <div className="flex cursor-pointer hover:bg-gray-300 p-2 rounded-2xl border border-black bg-[#F8F4FC] mt-3">
      <div className="ml-2">{icon}</div>
      <div className="ml-4">{content}</div>
    </div>
  );
}
export default function StickyProfileSettings() {
  return (
    <StickyBox className=" w-[20%]  flex justify-center items-center ml-10 text-sm">
      <div className="mt-10 bg-white">
        <div className="border-1 border-black h-86 w-70 rounded-2xl p-4">
          <Tab
            icon={<UserIcon className="size-5" />}
            content="Thông tin cá nhân"
          />
          <Tab
            icon={<MoonIcon className="size-5" />}
            content="Màn hình và trợ năng"
          />
          <Tab
            icon={<Cog6ToothIcon className="size-5" />}
            content="Cài đặt và quyền riêng tư"
          />
          <Tab
            icon={<QuestionMarkCircleIcon className="size-5" />}
            content="Trợ giúp và hỗ trợ"
          />
          <Tab
            icon={<ChatBubbleOvalLeftIcon className="size-5" />}
            content="Đóng góp ý kiến"
          />
          <Tab
            icon={<ArrowRightStartOnRectangleIcon className="size-5" />}
            content="Đăng xuất"
          />
        </div>
      </div>
    </StickyBox>
  );
}
