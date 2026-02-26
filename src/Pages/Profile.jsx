import { useState } from "react";
import "./../../src/App.css";
import React from "react";
import Header from "../Components/Header.jsx";
import StickyProfileSettings from "../Components/StickyProfileSettings.jsx";
import ShowActivityPopUp from "../hooks/ShowActivityPopUp.jsx";
import AddActivity from "../Components/AddActivityPopUp.jsx";
import { PlusIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

// Reusable components for the Profile page
const TagInput = ({ tag, name, value, onChange }) => (
  <div className="w-full">
    <label className="text-[11px] font-bold text-gray-700 ml-1 mb-1 block uppercase tracking-tight">
      {tag}
    </label>
    <input
      name={name}
      className="border border-black font-medium rounded-xl p-2 mt-1 pl-5 w-full max-w-[300px] text-sm outline-none focus:ring-2 focus:ring-[#01A4FF]/20"
      placeholder={`Nhập ${tag.toLowerCase()}...`}
      value={value}
      onChange={onChange}
    />
  </div>
);

const ExperienceTag = ({ CompanyName, DegreeName, Date }) => (
  <div className="border border-black bg-[#F8F4FC] rounded-2xl h-20 w-full max-w-[480px] mt-3 ml-4 cursor-pointer hover:bg-white transition-colors">
    <div className="flex p-3 ml-2 items-center">
      <div className="bg-[#B4A6A6] rounded-full h-10 w-10 shrink-0"></div>
      <div className="ml-4 overflow-hidden">
        <div className="text-sm font-bold truncate">{CompanyName}</div>
        <div className="text-[12px] text-gray-600 truncate">{DegreeName}</div>
        <div className="text-[10px] text-gray-400">{Date}</div>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, onAdd, onEdit }) => (
  <div className="flex items-center mt-6 mb-2">
    <h2 className="font-bold text-lg">{title}</h2>
    <div className="flex gap-1.5 ml-3">
      <button
        onClick={onAdd}
        className="rounded-full hover:bg-gray-100 p-1.5 transition-colors"
      >
        <PlusIcon className="size-3.5" />
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-full hover:bg-gray-100 p-1.5 transition-colors"
        >
          <PencilIcon className="size-3.5" />
        </button>
      )}
    </div>
  </div>
);

function Profile() {
  const { openPopUp, togglePopUp } = ShowActivityPopUp(false);
  const [notify, setNotify] = useState({ show: false, success: true });
  const [formData, setFormData] = useState({
    fullName: "Nguyễn Thành Vinh",
    address: "244 Lý Thường Kiệt, Quận 10, Tp.HCM",
    country: "Việt Nam",
    hometown: "Hà Tĩnh",
    email: "vinhvt619@gmail.com",
    age: 22,
    birthDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const isSuccess = Object.values(formData).every((val) => val !== "");
    setNotify({ show: true, success: isSuccess });
    setTimeout(() => setNotify({ show: false, success: isSuccess }), 1500);
  };

  return (
    <div className="bg-[#F8F4FC] min-h-screen">
      <Header />

      <div className="pt-6 flex items-start px-4">
        <StickyProfileSettings />

        <div className="flex-1 pb-16 flex justify-center mt-6">
          <div className="fixed right-0 top-0 z-50 pointer-events-none">
            <div
              className={`relative border rounded-xl p-3 px-10 flex flex-col items-center m-3 backdrop-blur-3xl shadow-lg transition-all duration-300 ease-out 
              ${notify.show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"}
              ${notify.success ? "border-[#01A4FF] text-[#01A4FF]" : "border-[#ff0116] text-[#ff0116]"}`}
            >
              {notify.success
                ? "Lưu thông tin thành công!"
                : "Lưu thông tin thất bại!"}
              <div
                onClick={() => setNotify((prev) => ({ ...prev, show: false }))}
                className={`absolute top-1.5 right-2.5 hover:opacity-70 cursor-pointer pointer-events-auto ${notify.success ? "text-[#01A4FF]" : "text-[#ff0116]"}`}
              >
                <XMarkIcon className="size-4" />
              </div>
            </div>
          </div>

          <div className="border border-black w-full max-w-[750px] bg-white shadow-sm pb-10">
            <div className="relative bg-[#D9D9D9] border-b border-b-black h-24 mb-12">
              <div className="absolute border border-black rounded-full h-24 w-24 -bottom-12 left-10 bg-[#D9D9D9] flex items-center justify-center overflow-hidden"></div>
              <button
                className="bg-[#01A4FF] hover:bg-[#0094E8] rounded-full text-white text-sm font-bold px-6 py-2 absolute -bottom-4 right-8 z-10 transition-all active:scale-95"
                onClick={handleSave}
              >
                Lưu
              </button>
            </div>

            <div className="px-10">
              <div className="text-lg font-semibold mb-6 tracking-tight">
                {formData.fullName}
              </div>
              <section>
                <h2 className="font-semibold text-lg mb-4">
                  Thông tin cá nhân
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 ml-4">
                  <TagInput
                    tag="Họ và tên"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 ml-1 mb-1 block uppercase tracking-tight">
                      Ngày sinh
                    </label>
                    <input
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="border border-black font-medium rounded-xl p-2 mt-1 pl-5 w-full max-w-[300px] text-sm outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="font-bold text-[11px] text-gray-700 uppercase tracking-tight">
                      Tuổi:
                    </span>
                    <input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      className="border border-black rounded-xl w-16 p-1.5 text-center text-sm outline-none"
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
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </section>
              <section className="ml-4">
                <SectionHeader
                  title="Giáo dục"
                  onAdd={togglePopUp}
                  onEdit={togglePopUp}
                />
                <ExperienceTag
                  CompanyName="Ho Chi Minh University of Technology"
                  DegreeName="Bachelor's degree, Computer Science"
                  Date="Sep 2020 - Nov 2024"
                />
                <AddActivity active={openPopUp} popUp={togglePopUp} />
              </section>
              <section className="ml-4">
                <SectionHeader
                  title="Hoạt động"
                  onAdd={() => {}}
                  onEdit={() => {}}
                />
                <div className="ml-6 mt-1">
                  <p className="text-base font-medium">
                    Bạn vẫn chưa có hoạt động nào
                  </p>
                  <p className="font-medium text-[10px] text-gray-400">
                    Các bài đăng hoạt động sẽ được hiển thị ở đây
                  </p>
                </div>
              </section>
              <section className="ml-4">
                <SectionHeader
                  title="Kinh nghiệm"
                  onAdd={() => {}}
                  onEdit={() => {}}
                />
                <div className="space-y-3">
                  <ExperienceTag
                    CompanyName="FPT Software Telecom"
                    DegreeName="Internship"
                    Date="Oct 2024 - Dec 2024"
                  />
                  <ExperienceTag
                    CompanyName="VNG Corporation"
                    DegreeName="Fresher"
                    Date="Jan 2025 - Dec 2025"
                  />
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
