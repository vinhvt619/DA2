import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function AddActivityPopUp({ active, popUp, type, initialData, onSave, onDelete }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({});
    }
  }, [initialData, active]);

  if (!active) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fieldsConfig = {
    education: [
      { name: "school", label: "Trường", type: "text" },
      { name: "degree", label: "Bằng cấp", type: "text" },
      { name: "major", label: "Ngành học", type: "text" },
      { name: "startDate", label: "Ngày bắt đầu", type: "date" },
      { name: "endDate", label: "Ngày kết thúc", type: "date" },
      { name: "score", label: "Điểm số", type: "text" },
    ],
    experience: [
      { name: "company", label: "Tên công ty", type: "text" },
      { name: "position", label: "Vị trí", type: "text" },
      { name: "startDate", label: "Ngày bắt đầu", type: "date" },
      { name: "endDate", label: "Ngày kết thúc", type: "date" },
    ],
    activity: [
      { name: "name", label: "Tên hoạt động", type: "text" },
      { name: "role", label: "Vai trò", type: "text" },
      { name: "startDate", label: "Ngày bắt đầu", type: "date" },
      { name: "endDate", label: "Ngày kết thúc", type: "date" },
    ]
  };

  const fields = fieldsConfig[type] || [];
  const titles = {
    education: "Chỉnh sửa Giáo dục",
    experience: "Chỉnh sửa Kinh nghiệm",
    activity: "Chỉnh sửa Hoạt động"
  };

  return (
    <div className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/10 flex justify-center items-center">
      <div className="border border-gray-200 bg-white w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="font-semibold text-xl">{titles[type]}</div>
          <div className="cursor-pointer p-2 hover:bg-gray-100 rounded-full" onClick={popUp}>
            <XMarkIcon className="size-5 stroke-2" />
          </div>
        </div>
        
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <div className="text-sm font-medium mb-1.5 text-gray-700">{field.label}</div>
              <input
                name={field.name}
                type={field.type}
                value={formData[field.name] || ""}
                onChange={handleChange}
                className="border border-gray-300 p-2.5 w-full rounded-xl focus:outline-none focus:border-black"
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {initialData && onDelete && (
             <button
               className="rounded-full px-8 py-2.5 bg-white border border-red-500 text-red-500 text-base font-semibold cursor-pointer hover:bg-red-50"
               onClick={() => {
                 onDelete();
                 popUp();
               }}
             >
               Xóa
             </button>
          )}

          <button
            className="rounded-full px-8 py-2.5 bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800"
            onClick={() => {
              onSave(formData);
              popUp();
            }}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
