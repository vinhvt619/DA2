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
} from "@heroicons/react/24/outline";
import StickyTopCV from "../Components/StickyTopCV.jsx";
import { ChevronLeftIcon, ChevronRightIcon } from "flowbite-react";
import TopCompany from "../Components/TopCompany.jsx";
function App() {
  const [nodes, setNodes] = useState(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="bg-[#F8F4FC] h-svh">
      <Header />
      <div className="flex  items-start">
        <StickyTopCV />
        <div className="w-[80%] my-10 flex justify-center items center">
          <TopCompany />
        </div>
      </div>
    </div>
  );
}

export default App;
