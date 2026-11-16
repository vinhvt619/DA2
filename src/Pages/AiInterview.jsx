import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import InterviewPractice from "../Components/InterviewPractice.jsx";

export default function AiInterview() {
  const { currentUser, isAuthChecked } = useAuth();
  const [params] = useSearchParams();
  if (!isAuthChecked) {
    return <main className="grid min-h-screen place-items-center" role="status">Đang kiểm tra tài khoản…</main>;
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "employee") return <Navigate to="/MainMenu" replace />;
  const jobId = params.get("jobId");
  return <InterviewPractice key={currentUser._id + ":" + (jobId || "")} userId={currentUser._id} jobId={jobId} />;
}
