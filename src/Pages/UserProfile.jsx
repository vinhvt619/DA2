import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Components/Header.jsx";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  UserIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/profile/${userId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setUserData(data.user);
        } else {
          setError(data.message || "Không thể tải thông tin cá nhân của người dùng này.");
        }
      } catch {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl p-16 border border-violet-100 flex flex-col items-center justify-center min-h-[300px] w-full max-w-lg shadow-xl shadow-violet-200/30">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">Đang tải hồ sơ thành viên...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-12 border border-red-100 text-center w-full max-w-lg shadow-xl shadow-violet-200/30 space-y-4">
            <div className="text-red-500 font-black text-lg">⚠️ Lỗi truy cập</div>
            <p className="text-gray-650 font-medium text-sm">{error || "Không tìm thấy người dùng."}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 text-sm text-[#9346F5] font-bold hover:underline"
            >
              Quay lại trang trước
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nameInitials = (userData.fullName || userData.username || "U")
    .substring(0, 2)
    .toUpperCase();

  const isCompany = userData.role === "company";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] font-sans text-gray-900 flex flex-col pb-20">
      <Header />

      <div className="max-w-4xl mx-auto w-full px-4 pt-6 lg:pt-8 flex-1 flex flex-col">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-gray-550 hover:text-violet-700 mb-6 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Quay lại cuộc trò chuyện
        </button>

        <div className="bg-white rounded-2xl border border-violet-100 shadow-xl shadow-violet-200/20 overflow-hidden flex flex-col">
          {/* Cover Photo Gradient */}
          <div className="relative bg-gradient-to-r from-violet-500 to-indigo-600 h-32 w-full flex items-end justify-end p-4">
            {userData.latestResumeId && (
              <button
                type="button"
                onClick={() => navigate(`/resume/view/${userData.latestResumeId}`)}
                className="bg-white/95 hover:bg-white text-violet-700 rounded-xl text-xs font-bold px-4 py-2 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-102 active:scale-98"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Xem CV đầy đủ
              </button>
            )}
          </div>

          {/* Profile Header Details */}
          <div className="px-6 sm:px-8 pb-8 relative">
            {/* Avatar container overlapping the banner */}
            <div className="absolute left-6 sm:left-8 -top-12">
              <div className="h-24 w-24 rounded-2xl border-4 border-white bg-violet-50 flex items-center justify-center font-bold text-violet-700 text-3xl shadow-md overflow-hidden">
                {nameInitials}
              </div>
            </div>

            {/* Profile Meta details */}
            <div className="pt-16">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {userData.fullName || userData.username}
                  </h1>
                  <p className="text-xs font-bold text-[#9346F5] uppercase tracking-wider mt-1">
                    {isCompany ? "Doanh nghiệp / Nhà tuyển dụng" : "Ứng viên / Lập trình viên"}
                  </p>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                {userData.email && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-700">
                    <EnvelopeIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <div>
                      <span className="font-semibold block text-[10px] text-gray-400 uppercase tracking-wide">Email liên hệ</span>
                      <a href={`mailto:${userData.email}`} className="font-semibold hover:text-[#9346F5] transition-colors">{userData.email}</a>
                    </div>
                  </div>
                )}

                {userData.phoneNumber && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-700">
                    <UserIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <div>
                      <span className="font-semibold block text-[10px] text-gray-400 uppercase tracking-wide">Số điện thoại</span>
                      <span className="font-semibold">{userData.phoneNumber}</span>
                    </div>
                  </div>
                )}

                {userData.address && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-700">
                    <MapPinIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <div>
                      <span className="font-semibold block text-[10px] text-gray-400 uppercase tracking-wide">Địa chỉ hiện tại</span>
                      <span className="font-semibold">{userData.address}</span>
                    </div>
                  </div>
                )}

                {(userData.hometown || userData.country) && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-700">
                    <MapPinIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <div>
                      <span className="font-semibold block text-[10px] text-gray-400 uppercase tracking-wide">Quê quán / Quốc tịch</span>
                      <span className="font-semibold">{[userData.hometown, userData.country].filter(Boolean).join(", ")}</span>
                    </div>
                  </div>
                )}

                {userData.birthDate && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-700">
                    <CalendarIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <div>
                      <span className="font-semibold block text-[10px] text-gray-400 uppercase tracking-wide">Ngày sinh / Tuổi</span>
                      <span className="font-semibold">
                        {userData.birthDate} {userData.age ? `(${userData.age} tuổi)` : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sections: Education, Experience, Activities */}
            {!isCompany && (
              <div className="mt-8 space-y-8 border-t border-gray-100 pt-8">
                {/* Education section */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 mb-4">
                    <AcademicCapIcon className="h-4.5 w-4.5 text-violet-600" />
                    Học vấn & Bằng cấp
                  </h3>
                  <div className="space-y-3">
                    {userData.educations && userData.educations.length > 0 ? (
                      userData.educations.map((edu, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 border border-violet-100/50 rounded-xl bg-violet-50/10 hover:bg-violet-50/20 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-lg bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                            E
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs">
                              {edu.school}
                            </h4>
                            <p className="text-xs text-gray-650 mt-0.5">
                              {edu.degree} {edu.major ? `• Ngành: ${edu.major}` : ""}
                            </p>
                            <p className="text-[10px] text-gray-450 mt-1">
                              {edu.startDate} - {edu.endDate} {edu.score ? `| Điểm số: ${edu.score}` : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 font-semibold italic">Chưa cập nhật thông tin học vấn.</p>
                    )}
                  </div>
                </div>

                {/* Experience section */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 mb-4">
                    <BriefcaseIcon className="h-4.5 w-4.5 text-violet-600" />
                    Kinh nghiệm làm việc
                  </h3>
                  <div className="space-y-3">
                    {userData.experiences && userData.experiences.length > 0 ? (
                      userData.experiences.map((exp, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 border border-violet-100/50 rounded-xl bg-violet-50/10 hover:bg-violet-50/20 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-lg bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                            W
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs">
                              {exp.company}
                            </h4>
                            <p className="text-xs text-gray-650 mt-0.5">
                              {exp.position}
                            </p>
                            <p className="text-[10px] text-gray-450 mt-1">
                              {exp.startDate} - {exp.endDate}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 font-semibold italic">Chưa cập nhật thông tin kinh nghiệm.</p>
                    )}
                  </div>
                </div>

                {/* Activities section */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-4.5 w-4.5 text-violet-600" />
                    Hoạt động ngoại khóa
                  </h3>
                  <div className="space-y-3">
                    {userData.activities && userData.activities.length > 0 ? (
                      userData.activities.map((act, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 border border-violet-100/50 rounded-xl bg-violet-50/10 hover:bg-violet-50/20 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-lg bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                            A
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs">
                              {act.name}
                            </h4>
                            <p className="text-xs text-gray-650 mt-0.5">
                              {act.role}
                            </p>
                            <p className="text-[10px] text-gray-450 mt-1">
                              {act.startDate} - {act.endDate}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 font-semibold italic">Chưa cập nhật hoạt động ngoại khóa.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
