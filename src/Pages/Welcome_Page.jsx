import "./../../src/App.css";
import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Header from "../Components/Header";

function App() {
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
            <button className="bg-[#DBCBEF] pl-6 py-3 flex justify-center mt-10 rounded-[50px]">
              <div>
                <a href="#">
                  <h1 className="stroke4 flex">
                    Tạo ngay <ArrowRightIcon className="h-10 w-20 mt-2" />
                  </h1>
                </a>
              </div>
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

export default App;
