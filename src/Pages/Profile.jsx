import { useState, useEffect } from "react";
import SettingsPageLayout, { SettingsCard } from "../Components/SettingsLayout.jsx";
import AddActivityPopUp from "../Components/AddActivityPopUp.jsx";
import { PlusIcon, PencilIcon, UserIcon } from "@heroicons/react/24/outline";
import { useToastContext } from "../Components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
  "w-full max-w-[300px] border border-gray-200 rounded-lg p-2 text-xs text-gray-900 bg-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all";

const TagInput = ({ tag, name, value, onChange, type = "text" }) => (
  <div className="w-full">
    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{tag}</label>
    <input
      type={type}
      name={name}
      className={inputClass}
      placeholder={`Nhập ${tag.toLowerCase()}...`}
      value={value}
      onChange={onChange}
    />
  </div>
);

const ExperienceTag = ({ CompanyName, DegreeName, Date, onEdit }) => (
  <div className="flex items-start gap-3.5 p-3.5 border border-gray-200 rounded-lg bg-white w-full max-w-[500px] group relative hover:bg-gray-50/30 transition-colors">
    <div className="bg-gray-50 rounded-lg h-10 w-10 shrink-0 border border-gray-150 flex items-center justify-center text-gray-400 font-bold">
      C
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
        {CompanyName}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{DegreeName}</div>
      <div className="text-[10px] text-gray-400 mt-1">{Date}</div>
    </div>
    {onEdit && (
      <button
        type="button"
        className="absolute right-3.5 top-3.5 p-1 text-gray-400 hover:text-violet-600 bg-white rounded-md border border-gray-200 opacity-0 group-hover:opacity-100 cursor-pointer"
        onClick={onEdit}
      >
        <PencilIcon className="size-3.5" />
      </button>
    )}
  </div>
);

const SectionHeader = ({ title, onAdd }) => (
  <div className="flex items-center mt-8 mb-4 justify-between max-w-[500px]">
    <h2 className="font-semibold text-sm text-gray-900">{title}</h2>
    {onAdd && (
      <button
        onClick={onAdd}
        type="button"
        className="text-gray-500 hover:text-violet-600 bg-gray-50 p-1 rounded-md border border-gray-200 hover:bg-gray-100"
        title="Thêm mới"
      >
        <PlusIcon className="size-3.5" />
      </button>
    )}
  </div>
);

function Profile() {
  const showToast = useToastContext();
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

  const { currentUser, refreshUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        address: currentUser.address || "",
        country: currentUser.country || "",
        hometown: currentUser.hometown || "",
        email: currentUser.email || "",
        age: currentUser.age || "",
        birthDate: currentUser.birthDate || "",
        educations: currentUser.educations || [],
        experiences: currentUser.experiences || [],
        activities: currentUser.activities || [],
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast("Lưu thông tin thành công!", "success");
        refreshUser();
      } else {
        showToast("Lưu thông tin thất bại. Vui lòng thử lại.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối đến máy chủ.", "error");
      console.error("Lỗi khi lưu dữ liệu profile:", error);
    }
  };

  return (
    <>
      <AddActivityPopUp
        active={popupState.active}
        popUp={closePopup}
        type={popupState.type}
        initialData={popupState.data}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      <SettingsPageLayout>
        <SettingsCard padding={false} overflowHidden={true}>
          <div className="relative bg-gradient-to-r from-violet-600 to-indigo-650 h-24 w-full">
            <div className="absolute left-6 sm:left-8 -bottom-8">
              <div className="h-16 w-16 rounded-xl border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src="/RabbitCV.png"
                  alt="Avatar"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
            </div>
            <div className="absolute right-6 sm:right-8 bottom-3">
              <button
                type="button"
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold px-4 py-1.5 transition-colors"
                onClick={handleSave}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-8 pt-12 pb-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-650 px-2.5 py-1 text-xs font-semibold mb-3">
                <UserIcon className="h-3.5 w-3.5" />
                Hồ sơ cá nhân
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {formData.fullName || "Chưa có tên"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý hồ sơ và chi tiết liên hệ
              </p>
            </div>

            <section className="mb-8">
              <SectionHeader title="Thông tin cá nhân" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
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
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Tuổi
                  </label>
                  <input
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-16 text-center border border-gray-200 rounded-lg p-2 text-xs text-gray-900 bg-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
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

            <div className="h-px bg-gray-100 max-w-[500px]" />

            <section className="mb-8">
              <SectionHeader
                title="Giáo dục"
                onAdd={() => openPopup("education")}
              />
              <div className="space-y-2.5">
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
                  <p className="text-xs text-gray-400">
                    Chưa có thông tin giáo dục
                  </p>
                )}
              </div>
            </section>

            <div className="h-px bg-gray-100 max-w-[500px]" />

            <section className="mb-8">
              <SectionHeader
                title="Kinh nghiệm"
                onAdd={() => openPopup("experience")}
              />
              <div className="space-y-2.5">
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
                  <p className="text-xs text-gray-400">
                    Chưa có thông tin kinh nghiệm
                  </p>
                )}
              </div>
            </section>

            <div className="h-px bg-gray-100 max-w-[500px]" />

            <section className="mb-4">
              <SectionHeader
                title="Hoạt động"
                onAdd={() => openPopup("activity")}
              />
              <div className="space-y-2.5">
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
                    className="border border-dashed border-gray-200 rounded-lg py-8 px-5 text-center max-w-[500px] group hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => openPopup("activity")}
                  >
                    <p className="text-xs font-semibold text-gray-500 group-hover:text-violet-600">
                      Chưa có hoạt động nào
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-1.5 text-xs font-semibold text-violet-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
                    >
                      Thêm hoạt động
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </SettingsCard>
      </SettingsPageLayout>
    </>
  );
}

export default Profile;
