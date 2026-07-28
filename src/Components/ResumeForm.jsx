import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import Editor from "./RichText/Editor";
import Toast, { useToast } from "./Toast";
import ConfirmPopUp from "./ConfirmPopUp";
import {
  formatMonthDisplayValue,
  isCurrentDateValue,
  normalizeMonthInputValue,
  normalizeResumeDateValue,
  parseMonthDisplayValue,
} from "../utils/dateInput.js";

function ResumeMonthInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={7}
      placeholder="MM/YYYY"
      value={formatMonthDisplayValue(value)}
      disabled={disabled}
      onChange={(event) => onChange(parseMonthDisplayValue(event.target.value))}
      onBlur={() => onChange(normalizeMonthInputValue(value))}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
    />
  );
}

export default function ResumeForm({
  image,
  setImage,
  personalInfo,
  setPersonalInfo,
  bio,
  setBio,
  profile,
  setProfile,
  experience,
  setExperience,
  education,
  setEducation,
  skill,
  setSkill,
  language,
  setLanguage,
  certificate,
  setCertificate,
  project,
  setProject,
  award,
  setAward,
  hobby,
  setHobby,
}) {
  const { toast, showToast } = useToast();
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [isModalProfileOpen, setIsModalProfileOpen] = useState(false);
  const [isModalExperienceOpen, setIsModalExperienceOpen] = useState(false);
  const [isModalEducationOpen, setIsModalEducationOpen] = useState(false);
  const [isModalSkillOpen, setIsModalSkillOpen] = useState(false);
  const [isModalLanguageOpen, setIsModalLanguageOpen] = useState(false);
  const [isModalCertificateOpen, setIsModalCertificateOpen] = useState(false);
  const [isModalProjectOpen, setIsModalProjectOpen] = useState(false);
  const [isModalAwardOpen, setIsModalAwardOpen] = useState(false);
  const [isModalHobbyOpen, setIsModalHobbyOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCurrentExperience, setIsCurrentExperience] = useState(false);
  const [newProfile, setNewProfile] = useState({
    networkName: "",
    username: "",
    link: "",
  });
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [newEducation, setNewEducation] = useState({
    title: "",
    company: "",
    location: "",
    major: "",
    score: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [newSkill, setNewSkill] = useState({
    title: "",
    description: "",
    performance: "Trung bình",
  });
  const [newLanguage, setNewLanguage] = useState({
    title: "",
    description: "",
  });
  const [newCertificate, setNewCertificate] = useState({
    title: "",
    date: "",
    publisher: "",
    description: "",
  });

  const [newProject, setNewProject] = useState({
    title: "",
    date: "",
    link: "",
    description: "",
  });

  const [newAward, setNewAward] = useState({
    title: "",
    awarder: "",
    date: "",
    description: "",
  });

  const [newHobby, setNewHobby] = useState({
    title: "",
  });

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ảnh đại diện không được lớn hơn 2 MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.onerror = () => showToast("Không thể đọc tệp ảnh này.", "error");
    reader.readAsDataURL(file);
  };

  const handleEditEducation = (item) => {
    setEditingId(item.id);
    setNewEducation({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      major: item.major || "",
      score: item.score || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      description: item.description || "",
    });
    setIsModalEducationOpen(true);
  };
  const handleDeleteEducation = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa mục học vấn này không?",
      onConfirm: () => {
        setEducation(education.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditSkill = (item) => {
    setEditingId(item.id);
    setNewSkill({
      title: item.title,
      description: item.description,
      performance: item.performance,
    });
    setIsModalSkillOpen(true);
  };
  const handleDeleteSkill = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa kỹ năng này không?",
      onConfirm: () => {
        setSkill(skill.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditLanguage = (item) => {
    setEditingId(item.id);
    setNewLanguage({
      title: item.title,
      description: item.description,
    });
    setIsModalLanguageOpen(true);
  };
  const handleDeleteLanguage = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa ngoại ngữ này không?",
      onConfirm: () => {
        setLanguage(language.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditCertificate = (item) => {
    setEditingId(item.id);
    setNewCertificate({
      title: item.title || "",
      description: item.description || "",
      date: normalizeResumeDateValue(item.date),
      publisher: item.publisher || "",
    });
    setIsModalCertificateOpen(true);
  };
  const handleDeleteCertificate = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa chứng chỉ này không?",
      onConfirm: () => {
        setCertificate(certificate.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditProject = (item) => {
    setEditingId(item.id);
    setNewProject({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      date: normalizeResumeDateValue(item.date),
      link: item.link || "",
      description: item.description || "",
    });
    setIsModalProjectOpen(true);
  };
  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa dự án này không?",
      onConfirm: () => {
        setProject(project.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditAward = (item) => {
    setEditingId(item.id);
    setNewAward({
      title: item.title || "",
      awarder: item.awarder || "",
      date: normalizeResumeDateValue(item.date),
      description: item.description || "",
    });
    setIsModalAwardOpen(true);
  };
  const handleDeleteAward = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa giải thưởng này không?",
      onConfirm: () => {
        setAward(award.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  const handleEditHobby = (item) => {
    setEditingId(item.id);
    setNewHobby({
      title: item.title,
    });
    setIsModalHobbyOpen(true);
  };
  const handleDeleteHobby = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa sở thích này không?",
      onConfirm: () => {
        setHobby(hobby.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  const handleDeleteExperience = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa kinh nghiệm làm việc này không?",
      onConfirm: () => {
        setExperience(experience.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditProfile = (item) => {
    setEditingId(item.id);
    setNewProfile({
      networkName: item.networkName,
      username: item.username,
      link: item.link || "",
    });
    setIsModalProfileOpen(true);
  };
  const handleEditExperience = (item) => {
    setEditingId(item.id);
    setIsCurrentExperience(isCurrentDateValue(item.endDate));
    setNewExperience({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      description: item.description || "",
    });
    setIsModalExperienceOpen(true);
  };

  const handleDeleteProfile = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa tài khoản mạng xã hội này không?",
      onConfirm: () => {
        setProfile(profile.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  return (
    <div className="w-full bg-white overflow-y-auto h-full">
      <Toast toast={toast} />

      {/* Form header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Thông tin CV</p>
      </div>

      <div className="p-5 space-y-6">
      {/* Avatar */}
      <div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Ảnh đại diện</div>
        <label
          htmlFor="avatar"
          className={`w-20 h-20 rounded-xl cursor-pointer flex items-center justify-center overflow-hidden border-2 transition-all ${
            image ? "border-transparent" : "border-dashed border-gray-300 hover:border-[#9346F5] bg-gray-50 hover:bg-violet-50"
          }`}
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-gray-400 text-[11px] font-semibold text-center px-2">Chọn ảnh</span>
          )}
        </label>

        <input
          id="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onImageChange}
          className="hidden"
        />
      </div>
      <div className="w-full">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Thông tin cá nhân</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Họ và tên</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tiêu đề / Vị trí</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
              value={personalInfo.jobTitle}
              onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })}
              placeholder="Frontend Developer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trang web</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.website}
                onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Điện thoại</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                placeholder="0901 234 567"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Địa điểm</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Tiểu sử</div>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <Editor content={bio} onChange={setBio} className="min-h-[160px]" />
        </div>
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">Profile / Mạng xã hội</div>
        </div>
      {profile.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditProfile(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.networkName}</div>
              <div className="text-sm text-gray-500">{item.username}</div>
              {item.link && (
                <div className="text-xs text-blue-500 truncate max-w-[200px]">
                  {item.link}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteProfile(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewProfile({ networkName: "", username: "", link: "" });
          setIsModalProfileOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm mục mới
      </div>

      {isModalProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Profile" : "Thêm Profile Mới"}
              </h3>
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mạng lưới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: LinkedIn, GitHub"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.networkName}
                  onChange={(e) =>
                    setNewProfile({
                      ...newProfile,
                      networkName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: nguyenvan_a"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.username}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Đường dẫn
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.link}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, link: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProfile.networkName || !newProfile.username) {
                    alert("Vui lòng điền tên mạng lưới và tên người dùng!");
                    return;
                  }

                  if (editingId) {
                    setProfile(
                      profile.map((item) =>
                        item.id === editingId
                          ? { ...newProfile, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setProfile([
                      ...profile,
                      { ...newProfile, id: Date.now() },
                    ]);
                  }

                  setIsModalProfileOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newProfile.networkName || !newProfile.username
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newProfile.networkName || !newProfile.username}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 my-4" />
      <div>
        <div className="flex items-center justify-between mb-3 mt-4">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">Kinh nghiệm làm việc</div>
        </div>
      {experience.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditExperience(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{item.title}</div>
              <div className="text-xs text-gray-500">{item.company}</div>
              <div className="text-xs text-gray-400">{item.location}</div>
              <div className="text-xs text-gray-400">
                {item.startDate} - {item.endDate}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteExperience(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 text-xs text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setIsCurrentExperience(false);
          setNewExperience({
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            description: "",
          });
          setIsModalExperienceOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm kinh nghiệm làm việc
      </div>
      {isModalExperienceOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Kinh Nghiệm" : "Thêm Kinh Nghiệm Mới"}
              </h3>
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newExperience.company}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newExperience.title}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian bắt đầu
                  </label>
                  <ResumeMonthInput
                    value={newExperience.startDate}
                    onChange={(value) =>
                      setNewExperience({
                        ...newExperience,
                        startDate: value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian kết thúc
                  </label>
                  <ResumeMonthInput
                    value={newExperience.endDate}
                    disabled={isCurrentExperience}
                    onChange={(value) =>
                      setNewExperience({
                        ...newExperience,
                        endDate: value,
                      })
                    }
                  />
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={isCurrentExperience}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        setIsCurrentExperience(isCurrent);
                        if (isCurrent) {
                          setNewExperience({
                            ...newExperience,
                            endDate: "",
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#9346F5] focus:ring-[#9346F5]"
                    />
                    Đang làm việc tại đây
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newExperience.location}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newExperience.description}
                  onChange={(html) =>
                    setNewExperience({ ...newExperience, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newExperience.company || !newExperience.title) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
                    return;
                  }

                  const experienceData = {
                    ...newExperience,
                    endDate: isCurrentExperience
                      ? "Hiện tại"
                      : newExperience.endDate,
                  };

                  if (editingId) {
                    setExperience(
                      experience.map((item) =>
                        item.id === editingId
                          ? { ...experienceData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setExperience([
                      ...experience,
                      { ...experienceData, id: Date.now() },
                    ]);
                  }

                  setIsModalExperienceOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newExperience.company || !newExperience.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newExperience.company || !newExperience.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Học vấn</div>
      {education.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditEducation(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500">{item.company}</div>
              {(item.major || item.score) && (
                <div className="text-sm text-gray-500">
                  {item.major}{item.major && item.score ? " - " : ""}{item.score}
                </div>
              )}
              <div className="text-xs text-gray-500">{item.location}</div>
              <div className="text-xs text-gray-500">
                {item.startDate} - {item.endDate}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteEducation(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}

      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewEducation({
            title: "",
            company: "",
            location: "",
            major: "",
            score: "",
            startDate: "",
            endDate: "",
            description: "",
          });
          setIsModalEducationOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm học vấn
      </div>
      {isModalEducationOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Học Vấn" : "Thêm Học Vấn Mới"}
              </h3>
              <button
                onClick={() => setIsModalEducationOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Trường <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại học Bách Khoa"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.company}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bằng cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cử nhân"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.title}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Lĩnh vực học tập
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kỹ thuật phần mềm"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.major}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        major: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bảng điểm
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 3.8/4.0"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.score}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        score: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian bắt đầu
                  </label>
                  <ResumeMonthInput
                    value={newEducation.startDate}
                    onChange={(value) =>
                      setNewEducation({
                        ...newEducation,
                        startDate: value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian kết thúc
                  </label>
                  <ResumeMonthInput
                    value={newEducation.endDate}
                    onChange={(value) =>
                      setNewEducation({
                        ...newEducation,
                        endDate: value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newEducation.location}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newEducation.description}
                  onChange={(html) =>
                    setNewEducation({ ...newEducation, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalEducationOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newEducation.company || !newEducation.title) {
                    alert("Vui lòng điền tên trường và bằng cấp!");
                    return;
                  }

                  if (editingId) {
                    setEducation(
                      education.map((item) =>
                        item.id === editingId
                          ? { ...newEducation, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setEducation([
                      ...education,
                      { ...newEducation, id: Date.now() },
                    ]);
                  }

                  setIsModalEducationOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newEducation.company || !newEducation.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newEducation.company || !newEducation.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Kỹ năng</div>
      {skill.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditSkill(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
              <div className="text-xs text-gray-500">{item.performance}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteSkill(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewSkill({
            title: "",
            description: "",
            performance: "Trung bình",
          });
          setIsModalSkillOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm kỹ năng
      </div>
      {isModalSkillOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Kỹ Năng" : "Thêm Kỹ Năng Mới"}
              </h3>
              <button
                onClick={() => setIsModalSkillOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên kỹ năng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: ReactJS, Lãnh đạo"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newSkill.title}
                    onChange={(e) =>
                      setNewSkill({
                        ...newSkill,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Mô tả (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newSkill.description}
                    onChange={(e) =>
                      setNewSkill({
                        ...newSkill,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Trình độ:{" "}
                  <span className="text-blue-600 font-bold">
                    {newSkill.performance || "Trung bình"}
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={
                    newSkill.performance === "Tệ"
                      ? 1
                      : newSkill.performance === "Trung bình"
                        ? 2
                        : newSkill.performance === "Tạm được"
                          ? 3
                          : newSkill.performance === "Tốt"
                            ? 4
                            : newSkill.performance === "Xuất sắc"
                              ? 5
                              : 2
                  }
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    let textVal = "Trung bình";
                    if (val === 1) textVal = "Tệ";
                    if (val === 2) textVal = "Trung bình";
                    if (val === 3) textVal = "Tạm được";
                    if (val === 4) textVal = "Tốt";
                    if (val === 5) textVal = "Xuất sắc";

                    setNewSkill({
                      ...newSkill,
                      performance: textVal,
                    });
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>Tệ</span>
                  <span>Trung bình</span>
                  <span>Tạm được</span>
                  <span>Tốt</span>
                  <span>Xuất sắc</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalSkillOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newSkill.title) {
                    alert("Vui lòng điền tên kỹ năng!");
                    return;
                  }

                  if (editingId) {
                    setSkill(
                      skill.map((item) =>
                        item.id === editingId
                          ? { ...newSkill, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setSkill([...skill, { ...newSkill, id: Date.now() }]);
                  }

                  setIsModalSkillOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newSkill.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newSkill.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Ngoại ngữ</div>
      {language.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditLanguage(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteLanguage(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewLanguage({
            title: "",
            description: "",
          });
          setIsModalLanguageOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm ngoại ngữ
      </div>
      {isModalLanguageOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Ngoại Ngữ" : "Thêm Ngoại Ngữ Mới"}
              </h3>
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên ngoại ngữ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newLanguage.title}
                    onChange={(e) =>
                      setNewLanguage({
                        ...newLanguage,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newLanguage.description}
                    onChange={(e) =>
                      setNewLanguage({
                        ...newLanguage,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newLanguage.title || !newLanguage.description) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
                    return;
                  }

                  if (editingId) {
                    setLanguage(
                      language.map((item) =>
                        item.id === editingId
                          ? { ...newLanguage, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setLanguage([
                      ...language,
                      { ...newLanguage, id: Date.now() },
                    ]);
                  }

                  setIsModalLanguageOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newLanguage.title || !newLanguage.description
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newLanguage.title || !newLanguage.description}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Chứng chỉ</div>
      {certificate.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditCertificate(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.publisher}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteCertificate(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewCertificate({
            title: "",
            publisher: "",
            date: "",
            description: "",
          });
          setIsModalCertificateOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm chứng chỉ
      </div>
      {isModalCertificateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Chứng Chỉ" : "Thêm Chứng Chỉ Mới"}
              </h3>
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.title}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bên cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.publisher}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        publisher: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.date}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newCertificate.description}
                  onChange={(html) =>
                    setNewCertificate({ ...newCertificate, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newCertificate.title || !newCertificate.publisher) {
                    alert("Vui lòng điền tên chứng chỉ và bên cấp!");
                    return;
                  }

                  const certificateData = {
                    ...newCertificate,
                    date: normalizeResumeDateValue(newCertificate.date),
                  };

                  if (editingId) {
                    setCertificate(
                      certificate.map((item) =>
                        item.id === editingId
                          ? { ...certificateData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setCertificate([
                      ...certificate,
                      { ...certificateData, id: Date.now() },
                    ]);
                  }

                  setIsModalCertificateOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newCertificate.title || !newCertificate.publisher
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newCertificate.title || !newCertificate.publisher}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Dự án</div>
      {project.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditProject(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteProject(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewProject({
            title: "",
            date: "",
            link: "",
            description: "",
          });
          setIsModalProjectOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm dự án
      </div>
      {isModalProjectOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
              </h3>
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dự án sinh viên xuất sắc"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.date}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Link dự án (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.link}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        link: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả (Tùy chọn)
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newProject.description}
                  onChange={(html) =>
                    setNewProject({ ...newProject, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProject.title) {
                    alert("Vui lòng điền tên dự án!");
                    return;
                  }

                  const projectData = {
                    ...newProject,
                    date: normalizeResumeDateValue(newProject.date),
                  };

                  if (editingId) {
                    setProject(
                      project.map((item) =>
                        item.id === editingId
                          ? { ...projectData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setProject([
                      ...project,
                      { ...projectData, id: Date.now() },
                    ]);
                  }

                  setIsModalProjectOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newProject.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newProject.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Giải thưởng</div>
      {award.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditAward(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.awarder}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteAward(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewAward({
            title: "",
            awarder: "",
            date: "",
            description: "",
          });
          setIsModalAwardOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm giải thưởng
      </div>
      {isModalAwardOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Giải Thưởng" : "Thêm Giải Thưởng Mới"}
              </h3>
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên giải thưởng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giải thưởng sinh viên xuất sắc"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.title}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bên trao tặng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Trường Đại học Hà Nội"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.awarder}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        awarder: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.date}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newAward.description}
                  onChange={(html) =>
                    setNewAward({ ...newAward, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newAward.title || !newAward.awarder) {
                    alert("Vui lòng điền tên giải thưởng và bên trao tặng!");
                    return;
                  }

                  const awardData = {
                    ...newAward,
                    date: normalizeResumeDateValue(newAward.date),
                  };

                  if (editingId) {
                    setAward(
                      award.map((item) =>
                        item.id === editingId
                          ? { ...awardData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setAward([...award, { ...awardData, id: Date.now() }]);
                  }

                  setIsModalAwardOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newAward.title || !newAward.awarder
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newAward.title || !newAward.awarder}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Sở thích</div>
      {hobby.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditHobby(item)}
        >
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm text-gray-800">{item.title}</div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteHobby(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewHobby({ title: "" });
          setIsModalHobbyOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm sở thích
      </div>
      {isModalHobbyOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Sở Thích" : "Thêm Sở Thích Mới"}
              </h3>
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Sở thích <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đọc sách, Nghe nhạc"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newHobby.title}
                  onChange={(e) => setNewHobby({ ...newHobby, title: e.target.value })}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newHobby.title) {
                    showToast("Vui lòng điền tên sở thích!", "error");
                    return;
                  }

                  if (editingId) {
                    setHobby(hobby.map((item) => item.id === editingId ? { ...newHobby, id: editingId } : item));
                  } else {
                    setHobby([...hobby, { ...newHobby, id: Date.now() }]);
                  }

                  setIsModalHobbyOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${!newHobby.title ? "bg-purple-300 cursor-not-allowed" : "bg-[#9346F5] hover:bg-[#7e39d1]"}
                `}
                disabled={!newHobby.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
        </div>
        </div>
        {confirmState.isOpen && (
        <ConfirmPopUp
          message={confirmState.message}
          confirm={confirmState.onConfirm}
          cancel={() => setConfirmState({ isOpen: false, message: "", onConfirm: null })}
        />
      )}
    </div>
  );
}
