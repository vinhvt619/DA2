import "../App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "../Components/Toast";
import { SavedJobsProvider } from "../context/SavedJobsContext";
import { AuthProvider } from "../context/AuthContext.jsx";
import { SocketProvider } from "../context/SocketContext.jsx";
import ScrollToTop from "../Components/ScrollToTop.jsx";
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
import AdminLayout from "./AdminLayout.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminJobs from "./AdminJobs.jsx";
import AdminReports from "./AdminReports.jsx";
import AdminReviews from "./AdminReviews.jsx";
import AdminSystemLogs from "./AdminSystemLogs.jsx";
import CompanyDashboard from "./CompanyDashboard.jsx";
import ViewResume from "./ViewResume.jsx";
import UserProfile from "./UserProfile.jsx";
import News from "./News.jsx";
import NewsDetail from "./NewsDetail.jsx";
import JobDetail from "./JobDetail.jsx";
import AllJobs from "./AllJobs.jsx";
import SavedJobs from "./SavedJobs.jsx";
import NotificationsPage from "./NotificationsPage.jsx";


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <SavedJobsProvider>
            <BrowserRouter>
              <ScrollToTop />
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
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/Profile" element={<Profile />} />
              <Route path="/Message" element={<Messenger />} />
              <Route path="/Accessibility" element={<Accessibility />} />
              <Route path="/SettingAndPrivate" element={<SettingAndPrivate />} />
              <Route path="/resume" element={<CreateResume />} />
              <Route path="/resume/:resumeId" element={<CreateResume />} />
              <Route path="/ResumeSelection" element={<ResumeSelection />} />
              <Route path="/UserDashboard" element={<UserDashboard />} />
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/jobs" element={<AdminJobs />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/system-logs" element={<AdminSystemLogs />} />
              </Route>
              <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
              <Route path="/resume/view/:resumeId" element={<ViewResume />} />
              <Route path="/user-profile/:userId" element={<UserProfile />} />
              <Route path="/News" element={<News />} />
              <Route path="/News/:slug" element={<NewsDetail />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/AllJobs" element={<AllJobs />} />
              <Route path="/saved-jobs" element={<SavedJobs />} />
            </Routes>
          </BrowserRouter>
        </SavedJobsProvider>
      </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;
