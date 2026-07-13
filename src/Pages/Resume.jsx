import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../Components/Header";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import Toast from "../Components/Toast";
import useCvZoom from "../hooks/useCvZoom";
import { SAMPLE_CVS } from "../data/sampleCV";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function CreateResume() {
  const location = useLocation();
  const navigate = useNavigate();
  useCvZoom();
  const [showForm, setShowForm] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [_id, setId] = useState(location.state?.cvId || null);
  const [title, setTitle] = useState("CV Mới Của Tôi");
  const [selectedTemplate, setSelectedTemplate] = useState(
    location.state?.template || "modern",
  );
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type }), 3000);
  };

  const [image, setImage] = useState(null);
  const [bio, setBio] = useState("");
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    jobTitle: "",
    email: "",
    website: "",
    phone: "",
    location: "",
  });
  const [profile, setProfile] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skill, setSkill] = useState([]);
  const [language, setLanguage] = useState([]);
  const [certificate, setCertificate] = useState([]);
  const [project, setProject] = useState([]);
  const [award, setAward] = useState([]);
  const [hobby, setHobby] = useState([]);

  const handleFillSample = () => {
    // Lấy random 1 CV từ danh sách mẫu
    const randomIndex = Math.floor(Math.random() * SAMPLE_CVS.length);
    const randomCV = SAMPLE_CVS[randomIndex];

    setTitle(randomCV.title);
    setPersonalInfo(randomCV.personalInfo);
    setBio(randomCV.bio);
    setProfile(randomCV.profile);
    setExperience(randomCV.experience);
    setEducation(randomCV.education);
    setSkill(randomCV.skill);
    setLanguage(randomCV.language);
    setCertificate(randomCV.certificate);
    setProject(randomCV.project);
    setAward(randomCV.award);
    setHobby(randomCV.hobby);
    showToast(`Đã điền ${randomCV.title}!`, "success");
  };

  const { currentUser, isAuthChecked } = useAuth();

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchResumeData = async () => {
      if (!_id) return;
      try {
        const response = await fetch(`/api/resume/${_id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data) {
            const mapId = (arr) =>
              arr?.map((item) => ({ ...item, id: item._id || item.id })) || [];
            setTitle(data.title || "CV Mới Của Tôi");
            setImage(data.image || "");
            setPersonalInfo(data.personalInfo || {});
            setBio(data.bio || "");
            setProfile(data.profile ? mapId(data.profile) : []);
            setExperience(data.experience ? mapId(data.experience) : []);
            setEducation(data.education ? mapId(data.education) : []);
            setSkill(data.skill ? mapId(data.skill) : []);
            setLanguage(data.language ? mapId(data.language) : []);
            setCertificate(data.certificate ? mapId(data.certificate) : []);
            setProject(data.project ? mapId(data.project) : []);
            setAward(data.award ? mapId(data.award) : []);
            setHobby(data.hobby ? mapId(data.hobby) : []);
            setSelectedTemplate(data.selectedTemplate || "modern");
          }
        }
      } catch (error) {
        console.error("Lỗi khi kết nối API:", error);
      }
    };
    fetchResumeData();
  }, [_id, currentUser, isAuthChecked, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title,
        image,
        personalInfo,
        bio,
        profile,
        experience,
        education,
        skill,
        language,
        certificate,
        project,
        award,
        hobby,
        selectedTemplate,
      };
      if (_id) payload._id = _id;

      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.resume?._id) setId(responseData.resume._id);
        setLastSaved(new Date());
        showToast("Lưu CV thành công!", "success");
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Lỗi khi lưu CV.", "error");
      }
    } catch {
      showToast("Không thể kết nối đến server!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedTime = lastSaved
    ? lastSaved.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] h-screen flex flex-col overflow-hidden page-transition">
      {/* Top Toolbar */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 z-30">
        <button
          onClick={() => navigate("/ResumeSelection")}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Thư viện
        </button>

        <div className="w-px h-5 bg-gray-200" />

        {/* CV Title editable */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#9346F5] focus:outline-none px-1 py-0.5 min-w-[160px] max-w-[260px]"
        />

        {formattedTime && (
          <span className="text-[10px] text-gray-400 font-medium hidden sm:block">
            Lưu lúc {formattedTime}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Toggle form */}
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              showForm
                ? "border-[#9346F5]/30 bg-violet-50 text-[#9346F5]"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {showForm ? (
              <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDoubleRightIcon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:block">Nội dung</span>
          </button>

          {/* Toggle templates */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              showTemplates
                ? "border-[#9346F5]/30 bg-violet-50 text-[#9346F5]"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Mẫu CV</span>
          </button>

          <button
            onClick={handleFillSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all ml-2"
          >
            Điền CV Mẫu
          </button>

          <div className="w-px h-5 bg-gray-200" />

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all ${
              isSaving
                ? "bg-purple-300 cursor-not-allowed"
                : "bg-[#9346F5] hover:bg-[#7e39d1] shadow-[#9346F5]/20 hover:shadow-md"
            }`}
          >
            <CloudArrowUpIcon className="w-3.5 h-3.5" />
            {isSaving ? "Đang lưu..." : "Lưu CV"}
          </button>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Resume Form) */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-gray-200 bg-white overflow-hidden flex flex-col shrink-0 ${
            showForm ? "w-[480px]" : "w-0"
          }`}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <ResumeForm
              image={image}
              setImage={setImage}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              bio={bio}
              setBio={setBio}
              profile={profile}
              setProfile={setProfile}
              experience={experience}
              setExperience={setExperience}
              education={education}
              setEducation={setEducation}
              skill={skill}
              setSkill={setSkill}
              language={language}
              setLanguage={setLanguage}
              certificate={certificate}
              setCertificate={setCertificate}
              project={project}
              setProject={setProject}
              award={award}
              setAward={setAward}
              hobby={hobby}
              setHobby={setHobby}
            />
          </div>
        </div>

        {/* Center Canvas (Preview) */}
        <div className="flex-1 bg-[#e8e8e8] overflow-y-auto flex flex-col items-center py-8 px-4 gap-4 no-scrollbar">
          {/* Template name badge */}
          <div className="shrink-0 flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold text-gray-600">
            <div className="w-2 h-2 rounded-full bg-[#9346F5]" />
            {selectedTemplate === "classic" && "Mẫu Cơ Bản"}
            {selectedTemplate === "modern" && "Mẫu Hiện Đại"}
            {selectedTemplate === "professional" && "Mẫu Chuyên Nghiệp"}
          </div>

          {/* A4 Shadow wrapper */}
          <div className="cv-wrapper bg-white shadow-lg print:shadow-none print:w-full rounded-sm overflow-hidden mb-10">
            <ResumePreview
              selectedTemplate={selectedTemplate}
              image={image}
              personalInfo={personalInfo}
              bio={bio}
              profile={profile}
              experience={experience}
              education={education}
              skill={skill}
              project={project}
              award={award}
              hobby={hobby}
              language={language}
              certificate={certificate}
            />
          </div>
        </div>

        {/* Right Sidebar (Templates) */}
        <div
          className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white overflow-hidden shrink-0 ${
            showTemplates ? "w-[280px]" : "w-0"
          }`}
        >
          <ResumeTemplate
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}
