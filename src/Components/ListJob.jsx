import { Button, Popover } from "flowbite-react";

import React from "react";
export default function Jobs(props) {
  const content = (
    <div className="w-120 h-80 bg-white p-5">
      <div className="flex items-center">
        <div className="border-2 border-black bg-gray-300 h-7 w-7 rounded-md mr-4"></div>
        <div>Castus Corporation</div>
      </div>
      <div className=" mt-4 font-medium text-md ">
        Dịch thuật văn bản IT sang tiếng Đức
      </div>
      <div className="flex text-xs">
        <div>1 District, Ho Chi Minh City</div>
        <div className="text-gray-300 ml-5">a day ago</div>
      </div>
      <div className="flex text-xs place-content-between w-50">
        <div>Full time</div>
        <div>Contract</div>
        <div>On-site</div>
      </div>
      <div className="flex mt-3">
        <Button color="purple" pill tabIndex={-1} className=" mr-5 ">
          Apply
        </Button>
        <Button color="light" pill tabIndex={-1}>
          Cancel
        </Button>
      </div>
      <div className="font-semibold text-md mt-3">Mô tả công việc</div>
      <div className="line-clamp-3">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="hover" placement="right">
      <div
        className={`h-20 flex items-center px-3 rounded-lg border-2 border-black hover:bg-gray-300 ${props.color}`}
      >
        <div className="bg-gray-400 h-12 w-12 rounded-lg"></div>
        <div className="h-15 ml-4 mb-2">
          <div className="text-[#CB37FF] font-semibold text-md">
            Dịch thuật văn bản IT sang tiếng Đức
          </div>
          <div className="text-gray-400 text-sm -mt-1">Castus Corporation</div>
          <div className="text-xs -mt-1">1 District, Ho Chi Minh City</div>
          <div className="text-xs text-gray-400 -mt-1">a day ago</div>
        </div>
      </div>
    </Popover>
  );
}
