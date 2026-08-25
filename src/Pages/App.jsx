import "../App.css";
import React, { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SavedJobsProvider } from "../context/SavedJobsContext";
import { AuthProvider } from "../context/AuthContext.jsx";
import { SocketProvider } from "../context/SocketContext.jsx";
import { ConfirmDialogProvider } from "../context/ConfirmDialogContext.jsx";
import { queryClient } from "../utils/queryClient.js";
import ScrollToTop from "../Components/ScrollToTop.jsx";
import RoleAccessGuard from "../Components/RoleAccessGuard.jsx";
import { CompanyAwarePage } from "./CompanyPortalShell.jsx";
const Login = lazy(() => import("./Login.jsx"));
const WelcomePage = lazy(() => import("./WelcomePage.jsx"));
const Register = lazy(() => import("./Register.jsx"));
const MainMenu = lazy(() => import("./MainMenu.jsx"));
const Jobs = lazy(() => import("./Jobs.jsx"));
const TopPage = lazy(() => import("./TopPage.jsx"));
const PersonalInformation = lazy(() => import("./PersonalInformation.jsx"));
const Messenger = lazy(() => import("./Message.jsx"));
const Accessibility = lazy(() => import("./Accessibility.jsx"));
const SettingAndPrivate = lazy(() => import("./SettingAndPrivate.jsx"));
const CreateResume = lazy(() => import("./Resume.jsx"));
const ResumeSelection = lazy(() => import("./ResumeSelection.jsx"));
const AiInterview = lazy(() => import("./AiInterview.jsx"));
const UserDashboard = lazy(() => import("./UserDashboard.jsx"));
const AdminLayout = lazy(() => import("./AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./AdminUsers.jsx"));
const AdminJobs = lazy(() => import("./AdminJobs.jsx"));
const AdminCompanies = lazy(() => import("./AdminCompanies.jsx"));
const CompanyDashboard = lazy(() => import("./CompanyDashboard.jsx"));
const ViewResume = lazy(() => import("./ViewResume.jsx"));
const PublicProfile = lazy(() => import("./PublicProfile.jsx"));
const News = lazy(() => import("./News.jsx"));
const NewsDetail = lazy(() => import("./NewsDetail.jsx"));
const JobDetail = lazy(() => import("./JobDetail.jsx"));
const AllJobs = lazy(() => import("./AllJobs.jsx"));
const MyApplications = lazy(() => import("./MyApplications.jsx"));
const SavedJobs = lazy(() => import("./SavedJobs.jsx"));
const NotificationsPage = lazy(() => import("./NotificationsPage.jsx"));


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <SavedJobsProvider>
            <BrowserRouter>
              <ConfirmDialogProvider>
              <ScrollToTop />
              <Toaster
                closeButton
                position="bottom-center"
                richColors
                toastOptions={{ duration: 3000 }}
              />
              <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm font-semibold text-slate-500">Đang tải...</div>}>
              <Routes>
                <Route element={<RoleAccessGuard />}>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/MainMenu" element={<MainMenu />} />
                <Route path="/Jobs" element={<Jobs />} />
                <Route path="/TopPage" element={<TopPage />} />
                <Route path="/WelcomePageCustomer" element={<Navigate to="/MainMenu" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/PersonalInformation" element={<PersonalInformation />} />
                <Route path="/Profile" element={<Navigate to="/PersonalInformation" replace />} />
                <Route path="/Message" element={<CompanyAwarePage activeItem="messages"><Messenger /></CompanyAwarePage>} />
                <Route path="/Accessibility" element={<Accessibility />} />
                <Route path="/SettingAndPrivate" element={<SettingAndPrivate />} />
                <Route path="/resume" element={<CreateResume />} />
                <Route path="/resume/:resumeId" element={<CreateResume />} />
                <Route path="/ResumeSelection" element={<ResumeSelection />} />
                <Route path="/ai-interview" element={<AiInterview />} />
                <Route path="/UserDashboard" element={<UserDashboard />} />
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/jobs" element={<AdminJobs />} />
                  <Route path="/admin/reports" element={<Navigate to="/admin" replace />} />
                  <Route path="/admin/companies" element={<AdminCompanies />} />
                  <Route path="/admin/reviews" element={<Navigate to="/admin/companies" replace />} />
                  <Route path="/admin/system-logs" element={<Navigate to="/admin" replace />} />
                </Route>
                <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
                <Route path="/resume/view/:resumeId" element={<CompanyAwarePage activeItem="applications"><ViewResume /></CompanyAwarePage>} />
                <Route path="/profile/:userId" element={<CompanyAwarePage activeItem="applications"><PublicProfile /></CompanyAwarePage>} />
                <Route path="/user-profile/:userId" element={<CompanyAwarePage activeItem="applications"><PublicProfile /></CompanyAwarePage>} />
                <Route path="/News" element={<News />} />
                <Route path="/News/:slug" element={<NewsDetail />} />
                <Route path="/jobs/:jobId" element={<JobDetail />} />
                <Route path="/AllJobs" element={<AllJobs />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/saved-jobs" element={<SavedJobs />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
              </Suspense>
              </ConfirmDialogProvider>
          </BrowserRouter>
        </SavedJobsProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
