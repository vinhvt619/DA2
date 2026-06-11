import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import ResumePreview from "../Components/ResumePreview";
import { ArrowLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";

export default function ViewResume() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/resumes/view/${resumeId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setResumeData(data);
        } else {
          setError(data.message || "Không thể tải hồ sơ này.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [resumeId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen flex flex-col print:bg-white print:p-0">
      <div className="print:hidden">
        <Header />
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col items-center print:py-0 print:px-0">
        <div className="w-full max-w-5xl flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Quay lại
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#9346F5] hover:bg-[#7e39d1] text-white px-5 py-2.5 rounded-xl shadow-md shadow-[#9346F5]/20 text-sm font-bold transition-all cursor-pointer"
          >
            <PrinterIcon className="w-4 h-4" /> In / Tải PDF
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-100 flex flex-col items-center justify-center min-h-[300px] w-full max-w-3xl shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">Đang tải hồ sơ ứng viên...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 border border-red-100 text-center w-full max-w-3xl shadow-sm space-y-4">
            <div className="text-red-500 font-black text-lg">⚠️ Lỗi truy cập</div>
            <p className="text-gray-600 font-medium text-sm">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 text-sm text-[#9346F5] font-bold hover:underline"
            >
              Quay lại trang trước
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-transparent flex flex-col items-center print:max-w-none">
            <div className="w-full text-center mb-4 print:hidden">
              <h1 className="text-xl font-extrabold text-gray-800">
                Hồ sơ ứng viên: <span className="text-[#9346F5]">{resumeData.personalInfo?.fullName || "Chưa đặt tên"}</span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">CV: {resumeData.title}</p>
            </div>
            
            <div className="w-full flex justify-center print:w-full">
              <ResumePreview
                selectedTemplate={resumeData.selectedTemplate || "modern"}
                image={resumeData.image || ""}
                personalInfo={resumeData.personalInfo || {}}
                bio={resumeData.bio || ""}
                profile={resumeData.profile || []}
                experience={resumeData.experience || []}
                education={resumeData.education || []}
                skill={resumeData.skill || []}
                language={resumeData.language || []}
                certificate={resumeData.certificate || []}
                project={resumeData.project || []}
                award={resumeData.award || []}
                hobby={resumeData.hobby || []}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
