import "../App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "../Components/Toast";
import Login from "./Login.jsx";
import WelcomePage from "./Welcome_Page.jsx";
import Register from "./Register.jsx";
import MainMenu from "./MainMenu.jsx";
import TopPage from "./TopPage.jsx";
import WelcomePageCustomer from "./Welcome_Page_Customer.jsx";
import Profile from "./Profile.jsx";
import Messenger from "./Message.jsx";
import Accessibility from "./Accessibily.jsx";
import SettingAndPrivate from "./SettingAndPrivate.jsx";
import CreateResume from "./Resume.jsx";
import ResumeSelection from "./ResumeSelection.jsx";
import UserDashboard from "./UserDashboard.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import CompanyDashboard from "./CompanyDashboard.jsx";
import ViewResume from "./ViewResume.jsx";
import News from "./News.jsx";
import NewsDetail from "./NewsDetail.jsx";
import JobDetail from "./JobDetail.jsx";
import AllJobs from "./AllJobs.jsx";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/MainMenu" element={<MainMenu />} />
          <Route path="/TopPage" element={<TopPage />} />
          <Route
            path="/WelcomePageCustomer"
            element={<WelcomePageCustomer />}
          />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Message" element={<Messenger />} />
          <Route path="/Accessibility" element={<Accessibility />} />
          <Route path="/SettingAndPrivate" element={<SettingAndPrivate />} />
          <Route path="/resume" element={<CreateResume />} />
          <Route path="/ResumeSelection" element={<ResumeSelection />} />
          <Route path="/UserDashboard" element={<UserDashboard />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
          <Route path="/resume/view/:resumeId" element={<ViewResume />} />
          <Route path="/News" element={<News />} />
          <Route path="/News/:slug" element={<NewsDetail />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/AllJobs" element={<AllJobs />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
export default App;
