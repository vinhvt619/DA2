import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

const templates = [
  {
    id: "classic",
    name: "Cơ Bản",
    desc: "Truyền thống, rõ ràng",
    accent: "bg-gray-100",
    preview: (
      <div className="h-28 bg-white border border-gray-100 rounded-lg overflow-hidden p-2 text-[3.5px]">
        <div className="text-center mb-1 border-b border-gray-200 pb-1">
          <div className="w-5 h-5 rounded-full bg-gray-200 mx-auto mb-0.5" />
          <div className="font-bold text-gray-800">Họ và Tên</div>
          <div className="text-gray-400">Vị trí công việc</div>
        </div>
        <div className="grid grid-cols-5 gap-1">
          <div className="col-span-2 space-y-0.5">
            <div className="font-bold text-gray-500 border-b border-gray-200 pb-0.5">KỸ NĂNG</div>
            <div className="bg-gray-100 rounded px-0.5 py-0.5">Kỹ năng 1</div>
            <div className="bg-gray-100 rounded px-0.5 py-0.5">Kỹ năng 2</div>
          </div>
          <div className="col-span-3 space-y-0.5">
            <div className="font-bold text-gray-500 border-b border-gray-200 pb-0.5">KINH NGHIỆM</div>
            <div className="font-semibold">Vị trí 1</div>
            <div className="text-gray-400">Công ty A · 2022</div>
            <div className="font-bold text-gray-500 border-b border-gray-200 pb-0.5 mt-0.5">HỌC VẤN</div>
            <div className="font-semibold">Đại học ABC</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Hiện Đại",
    desc: "Sáng tạo, nổi bật",
    accent: "bg-blue-50",
    preview: (
      <div className="h-28 bg-white border border-gray-100 rounded-lg overflow-hidden text-[3.5px]">
        <div className="grid grid-cols-5 h-full">
          <div className="col-span-3 p-2 space-y-0.5">
            <div className="font-bold text-[5.5px] text-gray-900">Họ và Tên</div>
            <div className="text-blue-600 font-semibold">Vị trí công việc</div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-500 mt-0.5">KINH NGHIỆM</div>
            <div className="font-semibold">Vị trí 1</div>
            <div className="text-gray-400">Công ty A · 2022–nay</div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-500">HỌC VẤN</div>
            <div className="font-semibold">Đại học ABC</div>
          </div>
          <div className="col-span-2 bg-gray-50 p-2 space-y-0.5 border-l border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-gray-200 mx-auto mb-1" />
            <div className="border-b border-gray-200 pb-0.5 font-bold text-gray-500">KỸ NĂNG</div>
            <div className="bg-blue-50 rounded px-0.5 py-0.5 text-blue-700">Kỹ năng 1</div>
            <div className="bg-blue-50 rounded px-0.5 py-0.5 text-blue-700">Kỹ năng 2</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "professional",
    name: "Chuyên Nghiệp",
    desc: "Tối giản, lịch sự",
    accent: "bg-slate-800",
    preview: (
      <div className="h-28 bg-white border border-gray-100 rounded-lg overflow-hidden text-[3.5px]">
        <div className="grid grid-cols-5 h-full">
          <div className="col-span-2 bg-slate-800 p-2 text-white space-y-0.5">
            <div className="w-6 h-6 rounded-full bg-slate-600 mx-auto mb-1 border border-slate-500" />
            <div className="font-bold text-[5px] text-center">Họ và Tên</div>
            <div className="text-slate-400 text-center">Vị trí</div>
            <div className="border-b border-slate-600 pb-0.5 font-bold text-slate-400 mt-0.5">KỸ NĂNG</div>
            <div className="text-slate-300">Kỹ năng 1</div>
            <div className="text-slate-300">Kỹ năng 2</div>
          </div>
          <div className="col-span-3 p-2 space-y-0.5">
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-500">KINH NGHIỆM</div>
            <div className="font-semibold">Vị trí 1</div>
            <div className="text-gray-400">Công ty A · 2022</div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-500">HỌC VẤN</div>
            <div className="font-semibold">Đại học ABC</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function ResumeTemplate({ selectedTemplate, setSelectedTemplate }) {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Mẫu CV</p>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {templates.map((t) => {
          const isActive = selectedTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={`w-full text-left rounded-xl p-2 border-2 transition-all ${
                isActive
                  ? "border-[#9346F5] ring-2 ring-[#9346F5]/15 shadow-md shadow-[#9346F5]/10"
                  : "border-gray-200 hover:border-[#9346F5]/40 hover:shadow-sm"
              }`}
            >
              {/* Preview thumbnail */}
              <div className="relative">
                {t.preview}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#9346F5] flex items-center justify-center shadow-sm">
                    <CheckIcon className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Name + desc */}
              <div className="mt-2 px-0.5">
                <p className={`text-xs font-bold ${isActive ? "text-[#9346F5]" : "text-gray-700"}`}>
                  {t.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
