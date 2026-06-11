import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import { getJobById } from "../data/jobsData";
import { useToastContext } from "../Components/Toast";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  LightBulbIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const showToast = useToastContext();
  const fileInputRef = useRef(null);

  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch job from DB first, fall back to static data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob({
            ...data,
            id: data._id,
            postedAt: new Date(data.createdAt).toLocaleDateString("vi-VN"),
            requirements: data.requirements || [],
            benefits: data.benefits || [],
            tags: data.tags || [],
          });
        } else {
          // Fall back to static jobsData
          const staticJob = getJobById(jobId);
          setJob(staticJob || null);
        }
      } catch {
        const staticJob = getJobById(jobId);
        setJob(staticJob || null);
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSavedResumes(data);
          if (data.length > 0) {
            setSelectedCv(data[0]._id);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách CV:", error);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!", "success");
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    showToast(
      !isSaved ? "Đã lưu công việc này vào danh sách!" : "Đã bỏ lưu công việc!",
      "success",
    );
  };

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 text-gray-500 font-semibold">
          Đang tải thông tin tuyển dụng...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 w-full">
          <div className="rounded-2xl border border-white/80 bg-white/70 shadow-sm p-8 text-center backdrop-blur-xl">
            <h1 className="text-xl font-bold text-slate-900">
              Không tìm thấy tin tuyển dụng
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Tin tuyển dụng này có thể đã hết hạn hoặc không tồn tại.
            </p>
            <button
              type="button"
              onClick={() => navigate("/MainMenu")}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-750 transition-all"
            >
              Quay lại danh sách việc làm
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    if (!selectedCv) {
      showToast("Vui lòng chọn một CV để ứng tuyển.", "error");
      return;
    }

    const dbJobId = job._id || job.id;
    if (job._id) {
      try {
        setApplying(true);
        const res = await fetch("/api/jobs/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobId: dbJobId, resumeId: selectedCv }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Đã nộp hồ sơ thành công cho ${job.company}!`, "success");
          setTimeout(() => navigate("/MainMenu"), 1000);
        } else {
          showToast(data.message || "Lỗi khi nộp hồ sơ.", "error");
        }
      } catch {
        showToast("Lỗi kết nối đến máy chủ.", "error");
      } finally {
        setApplying(false);
      }
    } else {
      const selectedCvName =
        savedResumes.find((item) => item._id === selectedCv)?.title ||
        "CV đã chọn";
      showToast(
        `Đã nộp hồ sơ "${selectedCvName}" cho ${job.company}.`,
        "success",
      );
      setTimeout(() => navigate("/MainMenu"), 1000);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleApplyUploadedFile = () => {
    if (uploadedFile) {
      showToast(
        `Đã nộp hồ sơ "${uploadedFile.name}" cho ${job.company}.`,
        "success",
      );
      setTimeout(() => {
        navigate("/MainMenu");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8">
        {/* Navigation & Utilities */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate("/MainMenu")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-all hover:text-[#9346F5]"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Quay lại
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-[#9346F5] shadow-xs transition-colors"
              title="Chia sẻ công việc"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveToggle}
              className="p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-600 shadow-xs transition-colors"
              title="Lưu công việc"
            >
              {isSaved ? (
                <BookmarkSolid className="w-4 h-4 text-[#9346F5]" />
              ) : (
                <BookmarkIcon className="w-4 h-4 hover:text-[#9346F5]" />
              )}
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.65fr] items-start">
          {/* Left Column: Job Info */}
          <div className="space-y-6">
            {/* Header Box */}
            <div className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-6 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                Chi tiết tuyển dụng
              </p>

              <h1 className="mt-2 text-xl lg:text-2xl font-extrabold text-slate-900 leading-snug">
                {job.title}
              </h1>

              <div className="mt-3 flex items-center gap-2 text-slate-600">
                <span className="font-semibold text-xs bg-slate-100 rounded-lg px-2.5 py-1 text-slate-700">
                  {job.company}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs inline-flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                  {job.location}
                </span>
              </div>

              {/* Metadata Highlights */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Mức lương
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                    <CurrencyDollarIcon className="w-4 h-4 shrink-0" />
                    {job.salary}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Hình thức
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-violet-600 text-xs">
                    <BriefcaseIcon className="w-4 h-4 shrink-0" />
                    {job.type}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Ngày cập nhật
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-700 text-xs font-semibold">
                    <CalendarDaysIcon className="w-4 h-4 shrink-0 text-gray-400" />
                    {job.postedAt}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Hạn nộp
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-750 text-xs font-semibold">
                    <ClockIcon className="w-4 h-4 shrink-0 text-gray-400" />
                    Sau 30 ngày
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-violet-50/50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-6 backdrop-blur-xl space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#9346F5] pl-2.5 mb-3">
                  Mô tả công việc
                </h2>
                <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#9346F5] pl-2.5 mb-3">
                  Yêu cầu công việc
                </h2>
                <ul className="space-y-2">
                  {job.requirements.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-slate-650"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#9346F5] pl-2.5 mb-3">
                  Quyền lợi được hưởng
                </h2>
                <ul className="space-y-2">
                  {job.benefits.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-slate-650"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 backdrop-blur-xl">
              <h3 className="text-sm font-extrabold text-slate-900">
                Ứng tuyển ngay
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Chọn CV đã lưu hoặc tải lên CV của bạn dưới dạng file PDF.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn CV ứng tuyển
                </label>
                {loadingResumes ? (
                  <div className="text-xs text-gray-500 italic">
                    Đang tải danh sách CV...
                  </div>
                ) : (
                  <select
                    value={selectedCv}
                    onChange={(e) => setSelectedCv(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-xs outline-none focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10"
                  >
                    {savedResumes.length === 0 && (
                      <option value="">-- Bạn chưa có CV nào --</option>
                    )}
                    {savedResumes.map((cv) => (
                      <option key={cv._id} value={cv._id}>
                        {cv.title || "CV Mới Của Tôi"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedCv || applying}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-xs font-bold text-white transition-all shadow-sm ${
                  !selectedCv || applying
                    ? "bg-slate-350 cursor-not-allowed"
                    : "bg-linear-to-r from-[#9346F5] to-[#7A34D8] hover:from-[#7A34D8] hover:to-[#6023C3] hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {applying ? "Đang xử lý..." : "Nộp CV đã chọn"}
              </button>

              <div className="relative mt-4 flex items-center justify-center">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-[#faf7fc] px-2 text-[10px] text-gray-400 font-bold uppercase">
                  Hoặc
                </span>
              </div>

              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full rounded-xl border border-dashed border-violet-300 bg-violet-50/20 hover:bg-violet-50/50 px-4 py-3 text-xs font-semibold text-violet-750 cursor-pointer truncate transition-colors"
              >
                {uploadedFile
                  ? `📄 ${uploadedFile.name}`
                  : "Tải lên CV từ máy tính (PDF)"}
              </button>

              {uploadedFile && (
                <button
                  type="button"
                  onClick={handleApplyUploadedFile}
                  className="mt-3.5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:shadow-sm"
                >
                  Nộp file CV tải lên
                </button>
              )}
            </div>

            {/* Company Info Box */}
            <div className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-5 backdrop-blur-xl">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                <BuildingOfficeIcon className="w-4 h-4 text-violet-600" />
                Thông tin công ty
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-gray-500 font-medium">Tên công ty</span>
                  <span className="font-semibold text-slate-800">
                    {job.company}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <UserGroupIcon className="w-3.5 h-3.5 text-gray-400" /> Quy
                    mô
                  </span>
                  <span className="font-semibold text-slate-800">
                    50 - 150 nhân sự
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Địa điểm</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {job.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
