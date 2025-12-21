import React from "react";
import StickyBox from "react-sticky-box";
import {
  BriefcaseIcon,
  UserIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import Terms from "./TermOfUse";
export default function StickySettings() {
  return (
    <StickyBox className=" w-[20%]  flex justify-center items-center ml-10">
      <div className="mt-10">
        <Terms />
      </div>
    </StickyBox>
  );
}
