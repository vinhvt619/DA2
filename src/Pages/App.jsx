import { useState, useEffect } from "react";
import "./../../src/App.css";
import React from "react";
import { NodeService } from "../service/NodeService";
import Header from "../Components/Header.jsx";
import StickyTopCV from "../Components/StickyTopCV.jsx";
import TopCompany from "../Components/TopCompany.jsx";
import TopCVList from "../Components/TopCVList.jsx";
import ListNews from "../Components/NewsList.jsx";
import StickyProfile from "../Components/SitckyProfile.jsx";
import StickySettings from "../Components/StickySettings.jsx";
function App() {
  const [nodes, setNodes] = useState(null);

  useEffect(() => {
    NodeService.getTreeNodes().then((data) => setNodes(data));
  }, []);

  return (
    <div className="bg-[#F8F4FC] ">
      <Header />
      <div className="flex items-start">
        <StickySettings />
        <div className="w-[80%] ">
          <div className="my-10 flex justify-center items center">
            <TopCompany />
          </div>
          <div className="my-10 flex justify-center items center">
            <TopCVList />
          </div>
          <div className="my-10 flex justify-center items center">
            <ListNews />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
