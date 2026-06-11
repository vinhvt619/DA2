import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../Components/Header";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import Toast from "../Components/Toast";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

export default function CreateResume() {
  const location = useLocation();
  const [showForm, setShowForm] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [_id, setId] = useState(location.state?.cvId || null);
  const [title, setTitle] = useState("CV Mới Của Tôi");
  const [selectedTemplate, setSelectedTemplate] = useState(
    location.state?.template || "modern",
  );
  const [toast, setToast] = useState({ message: "", type: "success" });

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

  useEffect(() => {
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
        console.error("Lỗi khi kết nối API lấy dữ liệu:", error);
      }
    };

    fetchResumeData();
  }, [_id]);

  const [isSaving, setIsSaving] = useState(false);

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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.resume?._id) setId(responseData.resume._id);
        showToast("Lưu CV vào Database thành công! ✓", "success");
      } else {
        const errorData = await response.json();
        showToast(
          errorData.message || "Lỗi khi lưu CV, vui lòng thử lại.",
          "error",
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
      showToast("Không thể kết nối đến server!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] h-screen flex flex-col">
      <Header />
      <Toast message={toast.message} type={toast.type} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Toggle */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`absolute top-4 z-20 bg-white p-1 rounded-r-lg shadow-md hover:bg-gray-50 transition-all duration-300 ${
            showForm ? "left-[30%]" : "left-0"
          }`}
          title={showForm ? "Thu gọn Form" : "Mở rộng Form"}
        >
          {showForm ? (
            <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Left Sidebar (Resume Form) */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-gray-200 bg-white overflow-hidden flex flex-col ${
            showForm ? "w-[30%]" : "w-0"
          }`}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#9346F5] focus:outline-none px-1 py-0.5 w-[60%]"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#9346F5] hover:bg-[#7e39d1] disabled:bg-purple-300 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              {isSaving ? "Đang lưu..." : "Lưu CV"}
            </button>
          </div>

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
        <div className="flex-1 bg-gray-100 overflow-hidden flex justify-center py-8">
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

        {/* Right Sidebar Toggle */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`absolute top-4 z-20 bg-white p-1 rounded-l-lg shadow-md hover:bg-gray-50 transition-all duration-300 ${
            showTemplates ? "right-[20%]" : "right-0"
          }`}
          title={showTemplates ? "Thu gọn Templates" : "Mở rộng Templates"}
        >
          {showTemplates ? (
            <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Right Sidebar (Templates) */}
        <div
          className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white overflow-hidden ${
            showTemplates ? "w-[20%]" : "w-0"
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
