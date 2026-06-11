import { useState, useEffect } from "react";
import "../App.css";
import React from "react";
import Header from "../Components/Header.jsx";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";
import AddActivityPopUp from "../Components/AddActivityPopUp.jsx";
import { PlusIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";

const TagInput = ({ tag, name, value, onChange, type = "text" }) => (
  <div className="w-full">
    <label className="text-xs font-medium text-gray-500 mb-1.5 block">
      {tag}
    </label>
    <input
      type={type}
      name={name}
      className="w-full max-w-[300px] border-2 border-gray-400 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-black"
      placeholder={`Nhập ${tag.toLowerCase()}...`}
      value={value}
      onChange={onChange}
    />
  </div>
);

const ExperienceTag = ({ CompanyName, DegreeName, Date, onEdit }) => (
  <div className="flex items-start gap-4 p-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-purple-200 w-full max-w-[500px] group relative">
    <div className="bg-gray-100 rounded-full place-self-center h-12 w-12 shrink-0 border border-gray-400"></div>
    <div className="flex-1">
      <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-600">
        {CompanyName}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{DegreeName}</div>
      <div className="text-xs text-gray-400 mt-1">{Date}</div>
    </div>
    {onEdit && (
      <div
        className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-black bg-white rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 cursor-pointer"
        onClick={onEdit}
      >
        <PencilIcon className="size-4" />
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, onAdd }) => (
  <div className="flex items-center mt-10 mb-5 justify-between max-w-[500px]">
    <h2 className="font-semibold text-lg text-gray-900">{title}</h2>
    {onAdd && (
      <button
        onClick={onAdd}
        type="button"
        className="text-gray-400 hover:text-black bg-gray-50 p-1.5 rounded-full border border-gray-200 hover:bg-gray-100"
        title="Thêm mới"
      >
        <PlusIcon className="size-4" />
      </button>
    )}
  </div>
);

function Profile() {
  const [notify, setNotify] = useState({ show: false, success: true });
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    country: "",
    hometown: "",
    email: "",
    age: "",
    birthDate: "",
    educations: [],
    experiences: [],
    activities: [],
  });

  const [popupState, setPopupState] = useState({
    active: false,
    type: "",
    index: -1,
    data: null,
  });

  const openPopup = (type, index = -1, data = null) => {
    setPopupState({ active: true, type, index, data });
  };

  const closePopup = () => {
    setPopupState({ active: false, type: "", index: -1, data: null });
  };

  const handleSaveItem = (itemData) => {
    const { type, index } = popupState;
    const listName =
      type === "education"
        ? "educations"
        : type === "experience"
          ? "experiences"
          : "activities";

    setFormData((prev) => {
      const newList = [...(prev[listName] || [])];
      if (index >= 0) {
        newList[index] = itemData;
      } else {
        newList.push(itemData);
      }
      return { ...prev, [listName]: newList };
    });
  };

  const handleDeleteItem = () => {
    const { type, index } = popupState;
    if (index < 0) return;

    const listName =
      type === "education"
        ? "educations"
        : type === "experience"
          ? "experiences"
          : "activities";

    setFormData((prev) => {
      const newList = [...(prev[listName] || [])];
      newList.splice(index, 1);
      return { ...prev, [listName]: newList };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setFormData({
              fullName: data.user.fullName || "",
              address: data.user.address || "",
              country: data.user.country || "",
              hometown: data.user.hometown || "",
              email: data.user.email || "",
              age: data.user.age || "",
              birthDate: data.user.birthDate || "",
              educations: data.user.educations || [],
              experiences: data.user.experiences || [],
              activities: data.user.activities || [],
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu profile:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const isSuccess = response.ok;
      setNotify({ show: true, success: isSuccess });
      setTimeout(() => setNotify({ show: false, success: isSuccess }), 2000);
    } catch (error) {
      setNotify({ show: true, success: false });
      setTimeout(() => setNotify({ show: false, success: false }), 2000);
      console.error("Lỗi khi lưu dữ liệu profile:", error);
    }
  };

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <Header />
      <AddActivityPopUp
        active={popupState.active}
        popUp={closePopup}
        type={popupState.type}
        initialData={popupState.data}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      <div className="pt-10 flex items-start max-w-6xl mx-auto w-full px-4 lg:px-8 gap-8 pb-20">
        <div className="top-0 bg-white rounded-3xl pr-2 pl-7 pb-5 shrink-0 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-[#ffffff]">
          <StickyProfileSettings />
        </div>

        <div className="flex-1 min-w-0 flex justify-center relative">
          <div className="fixed right-6 top-24 z-50 pointer-events-none">
            <div
              className={`relative bg-gray-200 border rounded-xl px-6 py-3 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
              ${notify.show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"}
              ${notify.success ? "border-green-400 text-green-700" : "border-red-400 text-red-700"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${notify.success ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-sm font-medium">
                {notify.success
                  ? "Lưu thông tin thành công"
                  : "Lưu thông tin thất bại"}
              </span>
              <button
                onClick={() => setNotify((prev) => ({ ...prev, show: false }))}
                className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-0"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          </div>

          <div className="w-full max-w-[800px] bg-white rounded-3xl border border-gray-50 shadow-[0_2px_20px_rgba(0,0,0,0.03)] overflow-hidden pb-12">
            <div className="relative bg-[#f1f1f1] h-32 w-full border-b">
              <div className="absolute left-8 -bottom-10">
                <div className="h-20 w-20 rounded-full border bg-white shadow-xs flex items-center justify-center overflow-hidden">
                  <img
                    src="../RabbitCV.png"
                    alt="Avatar"
                    className="w-[60%] h-[60%] object-contain"
                  />
                </div>
              </div>
              <div className="absolute right-8 -bottom-5 z-10">
                <button
                  className="bg-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium px-5 py-2"
                  onClick={handleSave}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>

            <div className="px-8 mt-16 mb-8">
              <div className="mb-10">
                <h1 className="text-2xl font-bold tracking-tight">
                  {formData.fullName || "Chưa có tên"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Quản lý hồ sơ và chi tiết liên hệ
                </p>
              </div>

              <section className="mb-10">
                <SectionHeader title="Thông tin cá nhân"/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <TagInput
                    tag="Họ và tên"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  <TagInput
                    tag="Ngày sinh"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                      Tuổi
                    </label>
                    <input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-15 text-center border-2 border-gray-400 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <TagInput
                    tag="Địa chỉ"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <TagInput
                    tag="Quốc gia"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                  <TagInput
                    tag="Quê quán"
                    name="hometown"
                    value={formData.hometown}
                    onChange={handleChange}
                  />
                  <TagInput
                    tag="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </section>

              <div className="h-px bg-gray-100 max-w-[500px]"></div>

              <section className="mb-10">
                <SectionHeader
                  title="Giáo dục"
                  onAdd={() => openPopup("education")}
                />
                <div className="space-y-3">
                  {formData.educations?.length > 0 ? (
                    formData.educations.map((edu, idx) => (
                      <ExperienceTag
                        key={idx}
                        CompanyName={edu.school || "Chưa nhập trường"}
                        DegreeName={
                          edu.degree || edu.major
                            ? `${edu.degree || ""} ${edu.major ? `- ${edu.major}` : ""}`
                            : "Chưa có thông tin bằng cấp"
                        }
                        Date={`${edu.startDate || "N/A"} đến ${edu.endDate || "N/A"} ${edu.score ? `| Điểm: ${edu.score}` : ""}`}
                        onEdit={() => openPopup("education", idx, edu)}
                      />
                    ))
                  ) : (
                    <p className="text-sm font-medium text-gray-500">
                      Bạn vẫn chưa có thông tin giáo dục
                    </p>
                  )}
                </div>
              </section>

              <div className="h-px bg-gray-100 max-w-[500px]"></div>

              <section className="mb-10">
                <SectionHeader
                  title="Kinh nghiệm"
                  onAdd={() => openPopup("experience")}
                />
                <div className="space-y-3">
                  {formData.experiences?.length > 0 ? (
                    formData.experiences.map((exp, idx) => (
                      <ExperienceTag
                        key={idx}
                        CompanyName={exp.company || "Chưa nhập tên công ty"}
                        DegreeName={exp.position || "Cấp bậc/Vị trí"}
                        Date={`${exp.startDate || "N/A"} đến ${exp.endDate || "N/A"}`}
                        onEdit={() => openPopup("experience", idx, exp)}
                      />
                    ))
                  ) : (
                    <p className="text-sm font-medium text-gray-500">
                      Bạn vẫn chưa có thông tin kinh nghiệm
                    </p>
                  )}
                </div>
              </section>

              <div className="h-px bg-gray-100 max-w-[500px]"></div>

              <section className="mb-6">
                <SectionHeader
                  title="Hoạt động"
                  onAdd={() => openPopup("activity")}
                />
                <div className="space-y-3">
                  {formData.activities?.length > 0 ? (
                    formData.activities.map((act, idx) => (
                      <ExperienceTag
                        key={idx}
                        CompanyName={act.name || "Tên hoạt động"}
                        DegreeName={act.role || "Vai trò"}
                        Date={`${act.startDate || "N/A"} đến ${act.endDate || "N/A"}`}
                        onEdit={() => openPopup("activity", idx, act)}
                      />
                    ))
                  ) : (
                    <div
                      className="border border-dashed border-gray-200 rounded-xl py-10 px-6 text-center max-w-[500px] hover:border-gray-400 cursor-pointer group"
                      onClick={() => openPopup("activity")}
                    >
                      <p className="text-sm font-medium text-gray-600 group-hover:text-black">
                        Bạn vẫn chưa có hoạt động nào
                      </p>
                      <button className="mt-4 px-5 py-2 text-sm font-medium text-black border border-gray-200 rounded-lg hover:bg-gray-50 outline-none focus:ring-0">
                        Thêm hoạt động
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
