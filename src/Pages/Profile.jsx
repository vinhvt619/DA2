import { useState, useEffect } from "react";
import SettingsPageLayout, { SettingsCard } from "../Components/SettingsLayout.jsx";
import AddActivityPopUp from "../Components/AddActivityPopUp.jsx";
import { PlusIcon, PencilIcon, UserIcon } from "@heroicons/react/24/outline";
import { useToastContext } from "../Components/Toast.jsx";

const inputClass =
  "w-full max-w-[300px] border border-violet-200 rounded-xl p-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all";

const TagInput = ({ tag, name, value, onChange, type = "text" }) => (
  <div className="w-full">
    <label className="text-xs font-medium text-gray-600 mb-1.5 block">{tag}</label>
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
  <div className="flex items-start gap-4 p-4 border border-violet-200 rounded-xl hover:bg-violet-50/50 hover:border-violet-300 w-full max-w-[500px] group relative transition-colors">
    <div className="bg-violet-100 rounded-full place-self-center h-12 w-12 shrink-0 border border-violet-200" />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-gray-900 group-hover:text-violet-900">
        {CompanyName}
      </div>
      <div className="text-sm text-gray-600 mt-0.5">{DegreeName}</div>
      <div className="text-xs text-gray-400 mt-1">{Date}</div>
    </div>
    {onEdit && (
      <button
        type="button"
        className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-violet-800 bg-white rounded-full shadow-sm border border-violet-200 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
        onClick={onEdit}
      >
        <PencilIcon className="size-4" />
      </button>
    )}
  </div>
);

const SectionHeader = ({ title, onAdd }) => (
  <div className="flex items-center mt-10 mb-5 justify-between max-w-[500px]">
    <h2 className="font-semibold text-base text-gray-900">{title}</h2>
    {onAdd && (
      <button
        onClick={onAdd}
        type="button"
        className="text-violet-600 hover:text-violet-900 bg-violet-100 p-1.5 rounded-full border border-violet-200 hover:bg-violet-200 transition-colors"
        title="Thêm mới"
      >
        <PlusIcon className="size-4" />
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

      if (response.ok) {
        showToast("Lưu thông tin thành công!", "success");
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
        <SettingsCard padding={false}>
              <div className="relative bg-violet-200 h-28 w-full border-b border-violet-300">
                <div className="absolute left-6 sm:left-8 -bottom-10">
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-violet-100 shadow-md flex items-center justify-center overflow-hidden">
                    <img
                      src="/RabbitCV.png"
                      alt="Avatar"
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </div>
                </div>
                <div className="absolute right-6 sm:right-8 bottom-4">
                  <button
                    type="button"
                    className="bg-violet-800 text-white hover:bg-violet-900 rounded-xl text-sm font-semibold px-5 py-2 shadow-md transition-colors"
                    onClick={handleSave}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>

              <div className="px-6 sm:px-8 pt-14 pb-8">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-3">
                    <UserIcon className="h-3.5 w-3.5" />
                    Hồ sơ cá nhân
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    {formData.fullName || "Chưa có tên"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
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
                      className="w-20 text-center border border-violet-200 rounded-xl p-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
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

              <div className="h-px bg-violet-100 max-w-[500px]" />

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

              <div className="h-px bg-violet-100 max-w-[500px]" />

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

              <div className="h-px bg-violet-100 max-w-[500px]" />

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
                      className="border border-dashed border-violet-300 rounded-xl py-10 px-6 text-center max-w-[500px] hover:border-violet-400 hover:bg-violet-50/50 cursor-pointer group transition-colors"
                      onClick={() => openPopup("activity")}
                    >
                      <p className="text-sm font-medium text-gray-600 group-hover:text-violet-900">
                        Bạn vẫn chưa có hoạt động nào
                      </p>
                      <button
                        type="button"
                        className="mt-4 px-5 py-2 text-sm font-semibold text-violet-800 border border-violet-200 rounded-xl hover:bg-violet-100 outline-none"
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
