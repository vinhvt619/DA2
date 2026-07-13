import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import ResumePreview from "../Components/ResumePreview";
import useCvZoom from "../hooks/useCvZoom";
import { SAMPLE_CVS } from "../data/sampleCV";
import { ArrowLeftIcon, PrinterIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

export default function ViewResume() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  useCvZoom();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");

  useEffect(() => {
    if (resumeData?.pdfData) {
      try {
        const parts = resumeData.pdfData.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("Lỗi chuyển đổi PDF base64 sang Blob URL:", err);
      }
    }
  }, [resumeData]);

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
      } catch {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [resumeId]);

  const handleDownloadFile = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = resumeData.fileName || "CV_UngVien.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate("/CompanyDashboard", { state: { activeTab: "applications" } });
    }
  };

  const isPdf = resumeData?.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen flex flex-col print:bg-white print:p-0 view-resume-root print:min-h-0 print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Header />
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col items-center print:py-0 print:px-0 view-resume-scroll print:overflow-visible print:h-auto print:flex-none">
        <div className="w-full max-w-5xl flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Quay lại
          </button>

          {resumeData?.pdfData ? (
            <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-2 bg-[#9346F5] hover:bg-[#7e39d1] text-white px-5 py-2.5 rounded-xl shadow-md shadow-[#9346F5]/20 text-sm font-bold transition-all cursor-pointer animate-fade-in"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải CV về máy
            </button>
            <button
              onClick={() => navigate(`/Message?partnerId=${resumeData.userId}`)}
              className="flex items-center gap-2 bg-white text-[#9346F5] border border-[#9346F5] hover:bg-violet-50 px-5 py-2.5 rounded-xl shadow-md text-sm font-bold transition-all cursor-pointer animate-fade-in"
            >
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" /> Nhắn tin cho ứng viên
            </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#9346F5] hover:bg-[#7e39d1] text-white px-5 py-2.5 rounded-xl shadow-md shadow-[#9346F5]/20 text-sm font-bold transition-all cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" /> In / Tải PDF
            </button>
            <button
              onClick={() => navigate(`/Message?partnerId=${resumeData.userId}`)}
              className="flex items-center gap-2 bg-white text-[#9346F5] border border-[#9346F5] hover:bg-violet-50 px-5 py-2.5 rounded-xl shadow-md text-sm font-bold transition-all cursor-pointer animate-fade-in"
            >
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" /> Nhắn tin cho ứng viên
            </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-100 flex flex-col items-center justify-center min-h-[300px] w-full max-w-3xl shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">
              Đang tải hồ sơ ứng viên...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 border border-red-100 text-center w-full max-w-3xl shadow-sm space-y-4">
            <div className="text-red-500 font-black text-lg">
              ⚠️ Lỗi truy cập
            </div>
            <p className="text-gray-600 font-medium text-sm">{error}</p>
            <button
              onClick={handleBack}
              className="mt-2 text-sm text-[#9346F5] font-bold hover:underline"
            >
              Quay lại trang trước
            </button>
          </div>
        ) : resumeData.pdfData ? (
          <div className="w-full max-w-5xl bg-transparent flex flex-col items-center print:max-w-none view-resume-content">
            <div className="w-full text-center mb-4 print:hidden">
              <h1 className="text-xl font-extrabold text-gray-800">
                Hồ sơ ứng viên:{" "}
                <span className="text-[#9346F5]">
                  {resumeData.personalInfo?.fullName || "Chưa đặt tên"}
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                Tài liệu: {resumeData.title}
              </p>
            </div>

            {isPdf ? (
              <div className="cv-wrapper relative aspect-[1/1.414] rounded-sm overflow-hidden shadow-lg bg-white border border-gray-100 mb-10">
                <iframe
                  src={pdfBlobUrl ? `${pdfBlobUrl}#page=1&toolbar=0&navpanes=0&view=FitH` : ""}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Candidate Resume PDF"
                  style={{ background: "white" }}
                />
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-white rounded-3xl p-12 border border-gray-100 shadow-lg text-center flex flex-col items-center gap-6 mb-10 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Tài liệu Word (.doc / .docx)</h2>
                  <p className="text-sm text-gray-500 mt-2 max-w-md">
                    Trình duyệt không hỗ trợ xem trước trực tiếp tài liệu định dạng Word. Bạn vui lòng tải file CV về máy để xem chi tiết thông tin ứng viên.
                  </p>
                </div>
                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-2 bg-[#9346F5] hover:bg-[#7e39d1] text-white px-6 py-3 rounded-xl shadow-md text-sm font-bold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải CV về máy ({resumeData.fileName || "Tải về"})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-transparent flex flex-col items-center print:max-w-none view-resume-content">
            <div className="w-full text-center mb-4 print:hidden">
              <h1 className="text-xl font-extrabold text-gray-800">
                Hồ sơ ứng viên:{" "}
                <span className="text-[#9346F5]">
                  {resumeData.personalInfo?.fullName || "Chưa đặt tên"}
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                CV: {resumeData.title}
              </p>
            </div>

            {/* Wrapper chuẩn hóa */}
            <div className="cv-wrapper bg-white shadow-lg print:shadow-none print:w-full rounded-sm overflow-hidden mb-10">
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
