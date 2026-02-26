import "./../../src/App.css";
import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Header from "../Components/Header";

function WelcomePage() {
  return (
    <div className="w-full h-full">
      <Header />
      <div className="flex pt-15">
        <div className="flex w-[70%] pl-35">
          <div>
            <h1 className="stroke1"> Chào mừng </h1>
            <h1 className="stroke2">Bạn đến với</h1>
            <h1 className="stroke2 stroke3">RabbitCV!</h1>
            <div className="pt-5 text-2xl">
              <p>
                Hãy tạo cho mình những bản CV thật chất lượng và hoàn thiện
                nhất.
              </p>
            </div>
            <button className="bg-linear-to-r from-[#DBCBEF] to-[#c5b3e3] px-8 py-3 flex items-center gap-2 mt-8 rounded-full transition-all duration-300 hover:shadow-xl cursor-pointer shadow-md font-bold text-base">
              <span className="stroke4">Tạo ngay</span>
              <ArrowRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
        <div className="w-[30%] pt-20">
          <img alt="" src="../RabbitCV.png" className="h-60 w-60 size-5" />
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
