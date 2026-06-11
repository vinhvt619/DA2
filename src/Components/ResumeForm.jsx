import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import Editor from "./RichText/Editor";
import Toast, { useToast } from "./Toast";

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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditEducation = (item) => {
    setEditingId(item.id);
    setNewEducation({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      major: item.major || "",
      score: item.score || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      description: item.description || "",
    });
    setIsModalEducationOpen(true);
  };
  const handleDeleteEducation = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa giáo dục này không?")) {
      setEducation(education.filter((item) => item.id !== id));
    }
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
    if (confirm("Bạn có chắc chắn muốn xóa kỹ năng này không?")) {
      setSkill(skill.filter((item) => item.id !== id));
    }
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
    if (confirm("Bạn có chắc chắn muốn xóa ngoại ngữ này không?")) {
      setLanguage(language.filter((item) => item.id !== id));
    }
  };
  const handleEditCertificate = (item) => {
    setEditingId(item.id);
    setNewCertificate({
      title: item.title,
      description: item.description,
      date: item.date,
      publisher: item.publisher,
    });
    setIsModalCertificateOpen(true);
  };
  const handleDeleteCertificate = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa chứng chỉ này không?")) {
      setCertificate(certificate.filter((item) => item.id !== id));
    }
  };
  const handleEditProject = (item) => {
    setEditingId(item.id);
    setNewProject({
      title: item.title,
      company: item.company,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      date: item.date,
      link: item.link || "",
      description: item.description,
    });
    setIsModalProjectOpen(true);
  };
  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa dự án này không?")) {
      setProject(project.filter((item) => item.id !== id));
    }
  };
  const handleEditAward = (item) => {
    setEditingId(item.id);
    setNewAward({
      title: item.title,
      awarder: item.awarder,
      date: item.date,
      description: item.description,
    });
    setIsModalAwardOpen(true);
  };
  const handleDeleteAward = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa giải thưởng này không?")) {
      setAward(award.filter((item) => item.id !== id));
    }
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
    if (confirm("Bạn có chắc chắn muốn xóa sở thích này không?")) {
      setHobby(hobby.filter((item) => item.id !== id));
    }
  };

  const handleDeleteExperience = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa kinh nghiệm này không?")) {
      setExperience(experience.filter((item) => item.id !== id));
    }
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
    setNewExperience({
      title: item.title,
      company: item.company,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
    });
    setIsModalExperienceOpen(true);
  };

  const handleDeleteProfile = (e, id) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa profile này không?")) {
      setProfile(profile.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="w-full border-r bg-white p-8 overflow-y-scroll h-full">
      <Toast toast={toast} />
      <div>
        <div className="font-semibold mb-4">Hình ảnh</div>

        <label
          htmlFor="avatar"
          className={`
          w-25 h-25 rounded-full cursor-pointer
          flex items-center justify-center
          overflow-hidden border hover:bg-gray-400
          ${image ? "bg-transparent" : "bg-gray-200"}
        `}
        >
          {image ? (
            <img
              src={image}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm text-center">Chọn ảnh</span>
          )}
        </label>

        <input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="hidden"
        />
      </div>
      <div className=" my-5 w-full">
        <div className="font-semibold mb-2">Họ và tên</div>
        <input
          className="rounded-sm border p-1.5 px-4 w-full text-sm"
          value={personalInfo.fullName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, fullName: e.target.value })
          }
        />
      </div>
      <div className="my-5">
        <div className="font-semibold mb-2">Tiêu đề</div>
        <input
          className="rounded-sm border p-1.5 px-4 w-full text-sm"
          value={personalInfo.jobTitle}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })
          }
        />
      </div>
      <div className="flex gap-5">
        <div className="my-5">
          <div className="font-semibold mb-2">Email</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.email}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, email: e.target.value })
            }
          />
        </div>
        <div className="my-5">
          <div className="font-semibold mb-2">Trang web</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.website}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, website: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex gap-5">
        <div className="my-5">
          <div className="font-semibold mb-2">Điện thoại</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.phone}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, phone: e.target.value })
            }
          />
        </div>
        <div className="my-5">
          <div className="font-semibold mb-2">Vị trí</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.location}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, location: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex items-center hover:underline cursor-pointer hover:bg-gray-300 w-fit rounded-2xl py-2 px-4 pr-7">
        <PlusIcon className="size-4" />
        <div className="ml-2 text-sm">Thêm một trường tùy chỉnh</div>
      </div>
      <div className="border-b border-gray-300 mt-5"></div>
      <div className="font-semibold mt-5">Tiểu sử</div>
      <div className="card">
        <Editor content={bio} onChange={setBio} className="min-h-[200px]" />
      </div>
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold">Profile</div>
      {profile.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditProfile(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.networkName}</div>
              <div className="text-sm text-gray-500">{item.username}</div>
              {item.link && (
                <div className="text-xs text-blue-500 truncate max-w-[200px]">
                  {item.link}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteProfile(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${profile.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Profile" : "Thêm Profile Mới"}
              </h3>
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mạng lưới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: LinkedIn, GitHub"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: nguyenvan_a"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={newProfile.username}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Đường dẫn
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={newProfile.link}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, link: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
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
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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

      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Kinh nghiệm làm việc</div>
      {experience.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditExperience(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.company}</div>
              <div className="text-xs text-gray-500">{item.location}</div>
              <div className="text-xs text-gray-500">
                {item.startDate} - {item.endDate}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteExperience(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="mt-2 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${experience.length === 0 ? "w-full justify-center" : "w-fit"}`}
        onClick={() => {
          setEditingId(null);
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Kinh Nghiệm" : "Thêm Kinh Nghiệm Mới"}
              </h3>
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newExperience.startDate}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newExperience.endDate}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newExperience.company || !newExperience.title) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
                    return;
                  }

                  if (editingId) {
                    setExperience(
                      experience.map((item) =>
                        item.id === editingId
                          ? { ...newExperience, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setExperience([
                      ...experience,
                      { ...newExperience, id: Date.now() },
                    ]);
                  }

                  setIsModalExperienceOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newExperience.company || !newExperience.title
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Học vấn</div>
      {education.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditEducation(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.company}</div>
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
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteEducation(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="mt-2 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}

      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${education.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Học Vấn" : "Thêm Học Vấn Mới"}
              </h3>
              <button
                onClick={() => setIsModalEducationOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Trường <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại học Bách Khoa"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bằng cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cử nhân"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lĩnh vực học tập
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kỹ thuật phần mềm"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bảng điểm
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 3.8/4.0"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newEducation.startDate}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newEducation.endDate}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
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
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Kỹ năng</div>
      {skill.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditSkill(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
              <div className="text-xs text-gray-500">{item.performance}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteSkill(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${skill.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Kỹ Năng" : "Thêm Kỹ Năng Mới"}
              </h3>
              <button
                onClick={() => setIsModalSkillOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên kỹ năng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: ReactJS, Lãnh đạo"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mô tả (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalSkillOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
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
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Ngoại ngữ</div>
      {language.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditLanguage(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteLanguage(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${language.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Ngoại Ngữ" : "Thêm Ngoại Ngữ Mới"}
              </h3>
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên ngoại ngữ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
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
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Chứng chỉ</div>
      {certificate.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditCertificate(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.publisher}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteCertificate(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="mt-2 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${certificate.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Chứng Chỉ" : "Thêm Chứng Chỉ Mới"}
              </h3>
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bên cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newCertificate.title || !newCertificate.publisher) {
                    alert("Vui lòng điền tên chứng chỉ và bên cấp!");
                    return;
                  }

                  if (editingId) {
                    setCertificate(
                      certificate.map((item) =>
                        item.id === editingId
                          ? { ...newCertificate, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setCertificate([
                      ...certificate,
                      { ...newCertificate, id: Date.now() },
                    ]);
                  }

                  setIsModalCertificateOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newCertificate.title || !newCertificate.publisher
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Dự án</div>
      {project.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditProject(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteProject(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="mt-2 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${project.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
              </h3>
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dự án sinh viên xuất sắc"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Link dự án (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProject.title) {
                    alert("Vui lòng điền tên dự án!");
                    return;
                  }

                  if (editingId) {
                    setProject(
                      project.map((item) =>
                        item.id === editingId
                          ? { ...newProject, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setProject([
                      ...project,
                      { ...newProject, id: Date.now() },
                    ]);
                  }

                  setIsModalProjectOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newProject.title
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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
      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Giải thưởng</div>
      {award.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditAward(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.awarder}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteAward(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="mt-2 text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: item.description }}
          ></div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${award.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Giải Thưởng" : "Thêm Giải Thưởng Mới"}
              </h3>
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên giải thưởng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giải thưởng sinh viên xuất sắc"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bên trao tặng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Trường Đại học Hà Nội"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời gian
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newAward.title || !newAward.awarder) {
                    alert("Vui lòng điền tên giải thưởng và bên trao tặng!");
                    return;
                  }

                  if (editingId) {
                    setAward(
                      award.map((item) =>
                        item.id === editingId
                          ? { ...newAward, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setAward([...award, { ...newAward, id: Date.now() }]);
                  }

                  setIsModalAwardOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newAward.title || !newAward.awarder
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform"
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

      <div className="border-b border-gray-300 my-5 "></div>
      <div className="font-semibold ">Sở thích</div>
      {hobby.map((item) => (
        <div
          key={item.id}
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group"
          onClick={() => handleEditHobby(item)}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium">{item.title}</div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-500 cursor-pointer"
                onClick={(e) => handleDeleteHobby(e, item.id)}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 ${hobby.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Sở Thích" : "Thêm Sở Thích Mới"}
              </h3>
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sở thích <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đọc sách, Nghe nhạc"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={newHobby.title}
                  onChange={(e) => setNewHobby({ ...newHobby, title: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
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
                  ${!newHobby.title ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:transform"}
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
  );
}
