import React, { useState, useEffect } from "react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { normalizeActivityDateFields } from "../utils/dateInput.js";

export default function AddActivityPopUp({ active, popUp, type, initialData, onSave, onDelete }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(normalizeActivityDateFields(initialData));
    } else {
      setFormData({});
    }
  }, [initialData, active]);

  if (!active) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    ],
  };

  const fields = fieldsConfig[type] || [];
  const titles = {
    education: "Giáo dục",
    experience: "Kinh nghiệm",
    activity: "Hoạt động",
  };
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9346F5]">
              {isEditing ? "Chỉnh sửa" : "Thêm mới"}
            </p>
            <h3 className="text-base font-bold text-gray-900">{titles[type]}</h3>
          </div>
          <button
            onClick={popUp}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              onClick={() => { onDelete(); popUp(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Xóa
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={popUp}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => { onSave(formData); popUp(); }}
              className="px-5 py-2 rounded-xl bg-[#9346F5] hover:bg-[#7e39d1] text-white text-sm font-bold shadow-sm shadow-[#9346F5]/20 transition-all"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
