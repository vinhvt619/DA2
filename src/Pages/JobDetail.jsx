import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../Components/Header";
import { getJobById, jobsData } from "../data/jobsData";
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
  AcademicCapIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  SignalIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import SelectDropdown from "../Components/SelectDropdown.jsx";
import { useSavedJobs } from "../context/SavedJobsContext";

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const showToast = useToastContext();

  const fileInputRef = useRef(null);

  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [applying, setApplying] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  const { isSaved, toggleSave, pendingIds } = useSavedJobs();

  useEffect(() => {
    const getJob = async () => {
      setLoadingJob(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("job not found");
        const data = await res.json();
        setJob({
          ...data,
          id: data._id,
          postedAt: new Date(data.createdAt).toLocaleDateString("vi-VN"),
          requirements: data.requirements || [],
          benefits: data.benefits || [],
          tags: data.tags || [],
        });
      } catch {
        const staticJob = getJobById(jobId);
        setJob(staticJob || null);
      } finally {
        setLoadingJob(false);
      }
    };
    getJob();
  }, [jobId]);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await fetch("/api/resumes", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSavedResumes(data);
          if (data.length > 0) {
            setSelectedCv(data[0]._id);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách CV:", err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  useEffect(() => {
    if (!job) return;

    const fetchSimilarJobs = async () => {
      let dbJobsList = [];
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          dbJobsList = data.map((j) => ({
            ...j,
            id: j._id,
            postedAt: new Date(j.createdAt).toLocaleDateString("vi-VN"),
            tags: j.tags || [],
          }));
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách công việc tương tự:", err);
      }

      const allJobs = [...dbJobsList, ...jobsData];
      
      const scored = allJobs
        .filter((j) => j.id !== job.id)
        .map((j) => {
          let score = 0;
          
          if (job.tags && j.tags) {
            const commonTags = j.tags.filter((t) => job.tags.includes(t));
            score += commonTags.length * 3;
          }
          
          if (job.location && j.location) {
            const loc1 = job.location.toLowerCase();
            const loc2 = j.location.toLowerCase();
            if ((loc1.includes("hồ chí minh") && loc2.includes("hồ chí minh")) ||
                (loc1.includes("hcm") && loc2.includes("hcm")) ||
                (loc1.includes("hà nội") && loc2.includes("hà nội")) ||
                (loc1.includes("đà nẵng") && loc2.includes("đà nẵng"))) {
              score += 2;
            }
          }

          if (job.type && j.type && job.type === j.type) {
            score += 1;
          }

          return { job: j, score };
        });

      const top3 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.job);

      setSimilarJobs(top3);
    };

    fetchSimilarJobs();
  }, [job, jobId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!", "success");
  };

  const handleApply = async () => {
    if (!selectedCv) return showToast("Vui lòng chọn một CV để ứng tuyển.", "error");

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
        
        if (res.status === 401) {
          showToast("Vui lòng đăng nhập để ứng tuyển.", "info");
          return navigate("/login");
        }

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
      if (!currentUser) {
        showToast("Vui lòng đăng nhập để ứng tuyển.", "info");
        return navigate("/login");
      }
      const cvName = savedResumes.find((x) => x._id === selectedCv)?.title || "CV đã chọn";
      showToast(`Đã nộp hồ sơ "${cvName}" cho ${job.company}.`, "success");
      setTimeout(() => navigate("/MainMenu"), 1000);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleApplyUploadedFile = async () => {
    if (!uploadedFile) return;

    // 1. Validate file size (Giới hạn 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return showToast("Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB).", "error");
    }

    // Check đăng nhập trước khi tiếp tục
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để ứng tuyển.", "info");
      return navigate("/login");
    }

    const dbJobId = job._id || job.id;

    // 2. Nếu là static job -> Giả lập thành công không gọi API
    if (!job._id) {
      showToast(`Đã nộp hồ sơ "${uploadedFile.name}" cho ${job.company}.`, "success");
      setTimeout(() => navigate("/MainMenu"), 1000);
      return;
    }

    // 3. Nếu là DB Job -> Đọc base64 qua Promise và gửi API
    try {
      setApplying(true);
      
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Lỗi đọc file."));
        reader.readAsDataURL(uploadedFile);
      });

      const res = await fetch("/api/jobs/apply-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobId: dbJobId,
          fileData,
          fileName: uploadedFile.name
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Đã nộp hồ sơ "${uploadedFile.name}" thành công!`, "success");
        setTimeout(() => navigate("/MainMenu"), 1000);
      } else {
        showToast(data.message || "Lỗi khi nộp hồ sơ.", "error");
      }
    } catch (err) {
      showToast(err.message || "Lỗi kết nối đến máy chủ.", "error");
    } finally {
      setApplying(false);
    }
  };



  if (loadingJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-slate-900 text-sm">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 text-gray-400 font-medium">
          Đang tải thông tin tuyển dụng...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-slate-900 text-sm">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 w-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              Không tìm thấy tin tuyển dụng
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Tin tuyển dụng này có thể đã hết hạn hoặc không tồn tại.
            </p>
            <button
              type="button"
              onClick={() => navigate("/MainMenu")}
              className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Quay lại danh sách việc làm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-slate-900 text-sm page-transition">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate("/MainMenu")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Quay lại
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-slate-500 hover:text-slate-700 text-xs font-medium"
          >
            <ShareIcon className="w-3.5 h-3.5" />
            Chia sẻ
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-7">
          <div className="flex-1 min-w-0 space-y-5">

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(255,255,255,0.12),transparent_55%)]" />
                <div className="absolute -bottom-7 left-6">
                  <div className="w-14 h-14 rounded-2xl rounded-br-md bg-white flex items-center justify-center ring-[3px] ring-white shadow-sm">
                    <BuildingOfficeIcon className="w-7 h-7 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="px-6 pt-11 pb-5">
                <h1 className="text-xl font-bold text-slate-900 leading-snug">
                  {job.title}
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">{job.company}</span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>{job.postedAt}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Đang tuyển
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>{job.applicants || "Mới"} ứng viên</span>
                  <span className="text-slate-300">·</span>
                  <span>{job.views || "10"} lượt xem</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const section = document.getElementById("apply-section");
                      if (section) section.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 active:scale-[0.98] transition-colors"
                  >
                    <BriefcaseIcon className="w-4 h-4" />
                    Nộp đơn ngay
                  </button>
                  <button
                    disabled={pendingIds.has(jobId)}
                    onClick={() => toggleSave(jobId)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      isSaved(jobId)
                        ? "border-violet-300 text-violet-700 bg-violet-50"
                        : "border-gray-200 text-slate-600 hover:bg-gray-50"
                    } ${pendingIds.has(jobId) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSaved(jobId) ? (
                      <BookmarkSolid className="w-4 h-4" />
                    ) : (
                      <BookmarkIcon className="w-4 h-4" />
                    )}
                    {isSaved(jobId) ? "Đã lưu" : "Lưu"}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Thông tin chung
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 flex items-center gap-3 bg-green-50/50 border border-green-100/60 rounded-lg px-4 py-3">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-green-600/80 font-semibold uppercase">Mức lương</p>
                    <p className="text-[15px] font-bold text-green-700">{job.salary}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                  <ClockIcon className="w-5 h-5 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Hạn nộp</p>
                    <p className="text-[15px] font-bold text-slate-700">{job.deadline || "Đang mở"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Hình thức</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400" />
                    {job.type}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Kinh nghiệm</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <LightBulbIcon className="w-3.5 h-3.5 text-slate-400" />
                    {job.experience || "Không yêu cầu"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Trình độ</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <AcademicCapIcon className="w-3.5 h-3.5 text-slate-400" />
                    {job.education || "Không yêu cầu"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Mô hình</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <ComputerDesktopIcon className="w-3.5 h-3.5 text-slate-400" />
                    {job.workModel || "Tại văn phòng"}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-slate-400 font-medium uppercase mb-2">Kỹ năng yêu cầu</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Mô tả công việc</h3>
                <p className="text-[13px] leading-relaxed text-slate-600 whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Yêu cầu ứng viên</h3>
                <ul className="space-y-2">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <CheckCircleIcon className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-5 mb-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Quyền lợi</h3>
                <ul className="space-y-2">
                  {job.benefits.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Địa điểm</h3>
                <p className="text-[13px] text-slate-600 flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  {job.location}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <UserGroupIcon className="w-4 h-4 text-slate-400" />
                  <strong className="text-slate-700">{job.applicants || "Mới"}</strong> ứng tuyển · Cạnh tranh trung bình
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  Phản hồi trong 2 ngày
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                  Đăng {job.postedAt}
                </span>
              </div>
            </div>
          </div>

          <div
            className="w-full lg:w-[310px] shrink-0 space-y-4 lg:sticky lg:top-[30px]"
            id="apply-section"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-[2px_4px_20px_rgba(100,80,150,0.08)] p-5">
              <h3 className="text-sm font-bold text-slate-900">
                Ứng tuyển ngay
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Chọn CV đã lưu hoặc tải lên file PDF.
              </p>

              <div className="mt-3.5">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Chọn CV ứng tuyển
                </label>
                {loadingResumes ? (
                  <div className="text-xs text-gray-400 italic">
                    Đang tải danh sách CV...
                  </div>
                ) : (
                  <SelectDropdown
                    options={savedResumes.map((cv) => ({
                      value: cv._id,
                      label: cv.title || "CV Mới Của Tôi",
                    }))}
                    value={selectedCv}
                    onChange={(val) => setSelectedCv(val)}
                    placeholder="-- Bạn chưa có CV nào --"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedCv || applying}
                className={`mt-3.5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white cursor-pointer ${
                  !selectedCv || applying
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {applying ? "Đang xử lý..." : "Nộp CV đã chọn"}
              </button>

              <div className="relative my-3.5 flex items-center">
                <div className="flex-1 border-t border-gray-100" />
                <span className="px-2 text-[10px] text-gray-400 uppercase">hoặc</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-2.5 text-xs font-medium text-slate-600 cursor-pointer truncate hover:border-violet-300 hover:bg-violet-50/30"
              >
                {uploadedFile
                  ? `📄 ${uploadedFile.name}`
                  : "Tải lên CV từ máy tính (PDF/Word)"}
              </button>

              {uploadedFile && (
                <button
                  type="button"
                  onClick={handleApplyUploadedFile}
                  disabled={applying}
                  className="mt-3 w-full rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  {applying ? "Đang nộp..." : "Nộp file CV tải lên"}
                </button>
              )}


            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <BuildingOfficeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{job.company}</h4>
                  <p className="text-[11px] text-gray-400">15,000+ người theo dõi</p>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-2.5">
                <p className="flex items-center gap-2"><UserGroupIcon className="w-3.5 h-3.5 text-gray-400" /> 50 – 150 nhân sự</p>
                <p className="flex items-center gap-2"><LightBulbIcon className="w-3.5 h-3.5 text-gray-400" /> Công nghệ phần mềm</p>
                <p className="flex items-center gap-2"><GlobeAltIcon className="w-3.5 h-3.5 text-gray-400" /> www.{job.company.toLowerCase().replace(/\s/g, "")}.com</p>
                <p className="flex items-center gap-2"><MapPinIcon className="w-3.5 h-3.5 text-gray-400" /> {job.location}</p>
              </div>

              <button className="mt-4 w-full py-2 border border-violet-200 text-violet-600 font-semibold text-xs rounded-lg hover:bg-violet-50">
                + Theo dõi
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Việc làm tương tự
              </h3>
              {similarJobs.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Không có việc làm tương tự phù hợp.</p>
              ) : (
                similarJobs.map((item, i, arr) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(`/jobs/${item.id}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`py-2.5 cursor-pointer ${i < arr.length - 1 ? "border-b border-dashed border-gray-100" : ""}`}
                  >
                    <p className="text-xs font-semibold text-slate-700 hover:text-[#9346F5] transition-colors">{item.title}</p>
                    <div className="flex items-center justify-between mt-0.5 text-[11px] text-gray-400">
                      <span>{item.company} · {item.postedAt || "Vừa xong"}</span>
                      <span className="text-violet-500 font-semibold">{item.salary}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
