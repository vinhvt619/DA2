import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import Editor from "./RichText/Editor";

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
}) {
  const [isModalProfileOpen, setIsModalProfileOpen] = useState(false);
  const [isModalExperienceOpen, setIsModalExperienceOpen] = useState(false);
  const [isModalEducationOpen, setIsModalEducationOpen] = useState(false);
  const [isModalSkillOpen, setIsModalSkillOpen] = useState(false);
  const [isModalLanguageOpen, setIsModalLanguageOpen] = useState(false);
  const [isModalCertificateOpen, setIsModalCertificateOpen] = useState(false);
  const [isModalProjectOpen, setIsModalProjectOpen] = useState(false);
  const [isModalAwardOpen, setIsModalAwardOpen] = useState(false);
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

  const onImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleEditEducation = (item) => {
    setEditingId(item.id);
    setNewEducation({
      title: item.title,
      company: item.company,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
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
      <div>
        <div className="font-semibold  mb-4">Hình ảnh</div>

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
        <div className="font-semibold  mb-2">Họ và tên</div>
        <input
          className="rounded-sm border p-1.5 px-4 w-full text-sm"
          value={personalInfo.fullName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, fullName: e.target.value })
          }
        />
      </div>
      <div className="my-5">
        <div className="font-semibold  mb-2">Tiêu đề</div>
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
          <div className="font-semibold  mb-2">Email</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.email}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, email: e.target.value })
            }
          />
        </div>
        <div className="my-5">
          <div className="font-semibold  mb-2">Trang web</div>
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
          <div className="font-semibold  mb-2">Điện thoại</div>
          <input
            className="rounded-sm border p-1.5 px-4 w-full text-sm"
            value={personalInfo.phone}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, phone: e.target.value })
            }
          />
        </div>
        <div className="my-5">
          <div className="font-semibold  mb-2">Vị trí</div>
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
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

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${profile.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Profile" : "Thêm Profile Mới"}
              </h3>
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                      { ...newProfile, id: profile.length + 1 },
                    ]);
                  }

                  setIsModalProfileOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newProfile.networkName || !newProfile.username
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
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
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${experience.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Kinh Nghiệm" : "Thêm Kinh Nghiệm Mới"}
              </h3>
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                      { ...newExperience, id: experience.length + 1 },
                    ]);
                  }

                  setIsModalExperienceOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newExperience.company || !newExperience.title
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditEducation(item)}
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
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${education.length === 0 ? "w-full justify-center" : "w-fit"}`}
        onClick={() => {
          setEditingId(null);
          setNewEducation({
            title: "",
            company: "",
            location: "",
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Học Vấn" : "Thêm Học Vấn Mới"}
              </h3>
              <button
                onClick={() => setIsModalEducationOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newEducation.company || !newEducation.title) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
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
                      { ...newEducation, id: education.length + 1 },
                    ]);
                  }

                  setIsModalEducationOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newEducation.company || !newEducation.title
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditSkill(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
              <div className="text-xs text-gray-500">{item.performance}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${skill.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Kỹ Năng" : "Thêm Kỹ Năng Mới"}
              </h3>
              <button
                onClick={() => setIsModalSkillOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newSkill.title || !newSkill.description) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
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
                    setSkill([...skill, { ...newSkill, id: skill.length + 1 }]);
                  }

                  setIsModalSkillOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newSkill.title || !newSkill.description
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
                  }
                `}
                disabled={!newSkill.title || !newSkill.description}
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditLanguage(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${language.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Ngoại Ngữ" : "Thêm Ngoại Ngữ Mới"}
              </h3>
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                      { ...newLanguage, id: language.length + 1 },
                    ]);
                  }

                  setIsModalLanguageOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newLanguage.title || !newLanguage.description
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditCertificate(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.publisher}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${certificate.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Chứng Chỉ" : "Thêm Chứng Chỉ Mới"}
              </h3>
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                      { ...newCertificate, id: certificate.length + 1 },
                    ]);
                  }

                  setIsModalCertificateOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newCertificate.title || !newCertificate.publisher
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditProject(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${project.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
              </h3>
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    Thời gian
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    Link dự án
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                  Mô tả
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProject.title || !newProject.date) {
                    alert("Vui lòng điền tên dự án và thời gian!");
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
                      { ...newProject, id: project.length + 1 },
                    ]);
                  }

                  setIsModalProjectOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newProject.title || !newProject.date
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
                  }
                `}
                disabled={!newProject.title || !newProject.date}
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
          className="border border-gray-300 p-3 px-8 hover:bg-gray-50 cursor-pointer rounded-md mt-3 relative group transition-colors"
          onClick={() => handleEditAward(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">{item.awarder}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`mt-4 border border-blue-500 text-blue-500 p-2 px-6 hover:bg-blue-50 cursor-pointer rounded-md place-self-end flex items-center gap-2 transition-colors ${award.length === 0 ? "w-full justify-center" : "w-fit"}`}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Chỉnh Sửa Giải Thưởng" : "Thêm Giải Thưởng Mới"}
              </h3>
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                    setAward([...award, { ...newAward, id: award.length + 1 }]);
                  }

                  setIsModalAwardOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md
                  ${
                    !newAward.title || !newAward.awarder
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
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
    </div>
  );
}
