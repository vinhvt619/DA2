import { useEffect, useMemo, useState } from "react";
import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import SettingsPageLayout, { SettingsCard } from "../Components/SettingsLayout.jsx";
import AddActivityPopUp from "../Components/AddActivityPopUp.jsx";
import { useToastContext } from "../Components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const initialFormData = {
  fullName: "",
  address: "",
  country: "",
  hometown: "",
  email: "",
  age: "",
  birthDate: "",
  companyIndustry: "",
  companySize: "",
  companyWebsite: "",
  companyDescription: "",
  companyFoundedYear: "",
  companyTaxCode: "",
  educations: [],
  experiences: [],
  activities: [],
};

const formatProfileDate = (value, fallback = "N/A") => {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
};

function ProfileField({ label, name, value, onChange, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[11px] font-semibold text-slate-500">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={`Nhập ${label.toLowerCase()}...`}
        className={inputClass}
      />
    </div>
  );
}

function SectionHeader({ title, count, onAdd }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
        {count !== undefined && <p className="mt-1 text-[11px] text-slate-400">{count} mục đã thêm</p>}
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Thêm ${title.toLowerCase()}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Thêm
        </button>
      )}
    </div>
  );
}

function EntryCard({ icon: Icon, title, subtitle, meta, onEdit }) {
  return (
    <div className="group flex items-start gap-3 border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">{title}</p>
        <p className="mt-1 truncate text-[11px] text-slate-500">{subtitle}</p>
        <p className="mt-1 text-[10px] text-slate-400">{meta}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Chỉnh sửa ${title}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      >
        <PencilIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PersonalInformation() {
  const showToast = useToastContext();
  const { currentUser, refreshUser } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [popupState, setPopupState] = useState({ active: false, type: "", index: -1, data: null });

  useEffect(() => {
    if (!currentUser) return;
    setFormData({
      ...initialFormData,
      ...currentUser,
      educations: currentUser.educations || [],
      experiences: currentUser.experiences || [],
      activities: currentUser.activities || [],
    });
  }, [currentUser]);

  const completion = useMemo(() => {
    const fields = [formData.fullName, formData.email, formData.address, formData.birthDate, formData.country];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const openPopup = (type, index = -1, data = null) => {
    setPopupState({ active: true, type, index, data });
  };

  const closePopup = () => {
    setPopupState({ active: false, type: "", index: -1, data: null });
  };

  const getListName = (type) =>
    type === "education" ? "educations" : type === "experience" ? "experiences" : "activities";

  const handleSaveItem = (itemData) => {
    const listName = getListName(popupState.type);
    setFormData((previous) => {
      const list = [...(previous[listName] || [])];
      if (popupState.index >= 0) list[popupState.index] = itemData;
      else list.push(itemData);
      return { ...previous, [listName]: list };
    });
  };

  const handleDeleteItem = () => {
    if (popupState.index < 0) return;
    const listName = getListName(popupState.type);
    setFormData((previous) => ({
      ...previous,
      [listName]: previous[listName].filter((_, index) => index !== popupState.index),
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        showToast("Lưu thông tin thất bại. Vui lòng thử lại.", "error");
        return;
      }

      showToast("Đã lưu thông tin thành công.", "success");
      refreshUser();
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu hồ sơ:", error);
      showToast("Lỗi kết nối đến máy chủ.", "error");
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
        <SettingsCard padding={false} overflowHidden className="shadow-none">
          <div className="px-5 pb-7 pt-6 sm:px-7 sm:pb-8">
              <div className="flex flex-col items-start justify-between gap-4 pb-5 sm:flex-row sm:items-start">
                <div>
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">Thông tin cá nhân</h1>
                  <p className="mt-1.5 text-xs text-slate-500">Cập nhật thông tin dùng cho hồ sơ và quá trình ứng tuyển.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex min-h-10 items-center rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                >
                  Lưu thay đổi
                </button>
              </div>

              <div className="flex flex-col gap-4 border-y border-slate-100 py-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                    {(formData.fullName || "Rabbit CV").split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{formData.fullName || "Chưa cập nhật tên"}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formData.address || "Chưa cập nhật địa chỉ"}</p>
                  </div>
                </div>
                <div className="w-full sm:ml-auto sm:max-w-[190px]">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-700">
                    <span>Hoàn thiện hồ sơ</span><span className="text-violet-700">{completion}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${completion}%` }} /></div>
                </div>
              </div>

          <section className="border-b border-slate-100 py-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-sm font-bold text-slate-900">Thông tin cơ bản</h2><p className="mt-1 text-[11px] text-slate-400">Cập nhật thông tin liên hệ và nơi sinh sống.</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} />
              <ProfileField label="Ngày sinh" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
              <ProfileField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
              <ProfileField label="Tuổi" name="age" type="number" value={formData.age} onChange={handleChange} />
              <ProfileField label="Địa chỉ hiện tại" name="address" value={formData.address} onChange={handleChange} className="sm:col-span-2" />
              <ProfileField label="Quốc gia" name="country" value={formData.country} onChange={handleChange} />
              <ProfileField label="Quê quán" name="hometown" value={formData.hometown} onChange={handleChange} />
            </div>
          </section>

          {currentUser?.role === "company" && (
            <section className="border-b border-slate-100 py-6">
              <SectionHeader title="Thông tin doanh nghiệp" />
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Lĩnh vực" name="companyIndustry" value={formData.companyIndustry} onChange={handleChange} />
                <ProfileField label="Quy mô" name="companySize" value={formData.companySize} onChange={handleChange} />
                <ProfileField label="Website" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} />
                <ProfileField label="Năm thành lập" name="companyFoundedYear" value={formData.companyFoundedYear} onChange={handleChange} />
                <ProfileField label="Mã số thuế" name="companyTaxCode" value={formData.companyTaxCode} onChange={handleChange} />
                <ProfileField label="Mô tả công ty" name="companyDescription" value={formData.companyDescription} onChange={handleChange} />
              </div>
            </section>
          )}

          <section className="grid gap-8 border-b border-slate-100 py-6 lg:grid-cols-2">
            <div>
              <SectionHeader title="Học vấn" count={formData.educations.length} onAdd={() => openPopup("education")} />
              <div>
                {formData.educations.length ? formData.educations.map((item, index) => (
                  <EntryCard
                    key={`education-${index}`}
                    icon={AcademicCapIcon}
                    title={item.school || "Chưa nhập trường"}
                    subtitle={[item.degree, item.major].filter(Boolean).join(" · ") || "Chưa có thông tin bằng cấp"}
                    meta={`${formatProfileDate(item.startDate)} – ${formatProfileDate(item.endDate)}${item.score ? ` · Điểm: ${item.score}` : ""}`}
                    onEdit={() => openPopup("education", index, item)}
                  />
                )) : <p className="border-t border-slate-100 py-5 text-xs text-slate-400">Chưa có thông tin học vấn</p>}
              </div>
            </div>

            <div>
              <SectionHeader title="Kinh nghiệm" count={formData.experiences.length} onAdd={() => openPopup("experience")} />
              <div>
                {formData.experiences.length ? formData.experiences.map((item, index) => (
                  <EntryCard
                    key={`experience-${index}`}
                    icon={BriefcaseIcon}
                    title={item.position || "Chưa nhập vị trí"}
                    subtitle={item.company || "Chưa nhập tên công ty"}
                    meta={`${formatProfileDate(item.startDate)} – ${formatProfileDate(item.endDate, "Hiện tại")}`}
                    onEdit={() => openPopup("experience", index, item)}
                  />
                )) : <p className="border-t border-slate-100 py-5 text-xs text-slate-400">Chưa có thông tin kinh nghiệm</p>}
              </div>
            </div>
          </section>

          <section className="pt-6">
            <SectionHeader title="Hoạt động" count={formData.activities.length} onAdd={() => openPopup("activity")} />
            <div>
              {formData.activities.length ? formData.activities.map((item, index) => (
                <EntryCard
                  key={`activity-${index}`}
                  icon={BuildingOffice2Icon}
                  title={item.name || "Tên hoạt động"}
                  subtitle={item.role || "Vai trò"}
                  meta={`${formatProfileDate(item.startDate)} – ${formatProfileDate(item.endDate, "Hiện tại")}`}
                  onEdit={() => openPopup("activity", index, item)}
                />
              )) : (
                <button type="button" onClick={() => openPopup("activity")} className="w-full border-t border-slate-100 py-5 text-left transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
                  <span className="mt-2 block text-xs font-semibold text-slate-600">Chưa có hoạt động nào</span>
                  <span className="mt-1 block text-[11px] text-slate-400">Chọn để thêm hoạt động</span>
                </button>
              )}
            </div>
          </section>
          </div>
        </SettingsCard>
      </SettingsPageLayout>
    </>
  );
}

export default PersonalInformation;
