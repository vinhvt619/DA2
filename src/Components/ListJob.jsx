import { Button, Popover } from "flowbite-react";
import React from "react";
import { MapPinIcon, HeartIcon } from "@heroicons/react/24/outline";

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
        className={`relative h-24 flex items-center px-5 rounded-2xl border border-black hover:border-[#D946EF] cursor-pointer group ${props.color}`}
      >
        {/* Logo Section - Clean & Modern */}
        <div className="bg-white h-14 w-14 rounded-xl border border-black flex items-center justify-center shrink-0"></div>

        {/* Info Section */}
        <div className="ml-5 flex-1 min-w-0 pr-10">
          <div className="text-[#D946EF] font-extrabold text-sm truncate leading-tight group-hover:underline underline-offset-4 decoration-2">
            Dịch thuật văn bản IT sang tiếng Đức
          </div>

          <div className="text-gray-500 text-xs font-bold truncate mt-1">
            Castus Corporation
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-md border border-black/5">
              <MapPinIcon className="w-3.5 h-3.5 text-[#D946EF]" />
              <span className="text-[10px] font-semibold text-gray-700">
                1 District, HCM
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-md border border-black/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Full Time
              </span>
            </div>
          </div>
        </div>

        {/* Right Bottom Metadata & Interaction */}
        <div className="absolute top-4 right-5">
          <div className="text-gray-400 text-[9px] font-black uppercase tracking-tighter">
            1 day ago
          </div>
        </div>

        <div className="absolute bottom-4 right-5">
          <button className="p-2 rounded-full hover:bg-white group/heart border border-transparent hover:border-black/10 shadow-sm">
            <HeartIcon className="w-5 h-5 text-gray-400 group-hover/heart:text-red-500 fill-transparent group-hover/heart:fill-red-500" />
          </button>
        </div>
      </div>
    </Popover>
  );
}
