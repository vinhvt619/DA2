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
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import Login from "./Login.jsx";
import WelcomePage from "./Welcome_Page.jsx";
import Register from "./Register.jsx";
import MainMenu from "./MainMenu.jsx";
import TopPage from "./TopPage.jsx";
import WelcomePageCustomer from "./Welcome_Page_Customer.jsx";
import Profile from "./Profile.jsx";
import Messenger from "./ChatBox.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/MainMenu" element={<MainMenu />} />
        <Route path="/TopPage" element={<TopPage />} />
        <Route path="/WelcomePageCustomer" element={<WelcomePageCustomer />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Message" element={<Messenger />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
