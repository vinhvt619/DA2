import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ADDITIONAL_RESUME_TEMPLATES, RESUME_TEMPLATES } from "../../shared/resumeTemplates.js";
import { AdditionalResumeThumbnail } from "./ResumePreview.jsx";

const templates = [
  {
    id: "classic",
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
  {
    id: "elegant",
    preview: (
      <div className="h-28 overflow-hidden rounded-lg border border-stone-200 bg-white p-2 text-[3.5px]">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-1.5">
          <div>
            <div className="text-[6px] font-bold text-slate-900">Họ và Tên</div>
            <div className="mt-0.5 uppercase tracking-wider text-slate-500">Vị trí công việc</div>
          </div>
          <div className="h-5 w-5 bg-slate-200" />
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          <div className="col-span-3 space-y-1">
            <div className="border-b border-slate-300 font-bold text-slate-800">KINH NGHIỆM</div>
            <div className="h-1 rounded bg-slate-200" />
            <div className="h-1 w-4/5 rounded bg-slate-100" />
            <div className="border-b border-slate-300 pt-1 font-bold text-slate-800">HỌC VẤN</div>
            <div className="h-1 rounded bg-slate-200" />
          </div>
          <div className="col-span-2 border-l border-stone-200 pl-1.5">
            <div className="border-b border-slate-300 font-bold text-slate-800">KỸ NĂNG</div>
            <div className="mt-1 border-b border-slate-100 pb-0.5">Kỹ năng 1</div>
            <div className="mt-1 border-b border-slate-100 pb-0.5">Kỹ năng 2</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "creative",
    preview: (
      <div className="h-28 overflow-hidden rounded-lg border border-teal-100 bg-white text-[3.5px]">
        <div className="flex h-[36%] items-center gap-2 bg-teal-800 px-2 text-white">
          <div className="h-6 w-6 rounded-full border border-white/30 bg-white/15" />
          <div>
            <div className="text-[6px] font-black">HỌ VÀ TÊN</div>
            <div className="mt-0.5 text-teal-100">Vị trí công việc</div>
          </div>
        </div>
        <div className="grid h-[64%] grid-cols-5">
          <div className="col-span-3 p-2">
            <div className="mt-2 border-b border-teal-200 pb-0.5 font-bold text-teal-800">KINH NGHIỆM</div>
            <div className="mt-1 h-1 rounded bg-slate-200" />
            <div className="mt-1 h-1 w-5/6 rounded bg-slate-100" />
          </div>
          <div className="col-span-2 bg-teal-50 p-2">
            <div className="border-b border-teal-200 pb-0.5 font-bold text-teal-900">KỸ NĂNG</div>
            <div className="mt-1">Kỹ năng 1</div>
            <div className="mt-1">Kỹ năng 2</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "compact",
    preview: (
      <div className="h-28 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 text-[3.5px]">
        <div className="border-b border-slate-800 pb-1.5">
          <div className="text-[6px] font-bold tracking-wide text-slate-900">HỌ VÀ TÊN</div>
          <div className="font-semibold uppercase text-slate-600">Vị trí công việc</div>
          <div className="mt-0.5 text-slate-400">Email · Điện thoại · Địa điểm</div>
        </div>
        <div className="mt-1.5 space-y-1">
          <div className="border-b border-slate-400 font-bold text-slate-800">KINH NGHIỆM LÀM VIỆC</div>
          <div className="flex justify-between font-semibold">
            <span>Vị trí · Công ty</span><span>2022–nay</span>
          </div>
          <div className="h-1 rounded bg-slate-100" />
          <div className="h-1 w-5/6 rounded bg-slate-100" />
          <div className="border-b border-slate-400 pt-1 font-bold text-slate-800">HỌC VẤN</div>
          <div className="font-semibold">Chuyên ngành · Trường đại học</div>
          <div className="border-b border-slate-400 pt-1 font-bold text-slate-800">KỸ NĂNG</div>
          <div className="text-slate-500">Kỹ năng 1 · Kỹ năng 2 · Kỹ năng 3</div>
        </div>
      </div>
    ),
  },
].map(({ id, preview }) => {
  const definition = RESUME_TEMPLATES.find((template) => template.id === id);
  return { ...definition, desc: definition.description, preview };
});

const additionalTemplates = ADDITIONAL_RESUME_TEMPLATES.map((template) => ({
  ...template,
  desc: template.description,
  preview: (
    <div aria-hidden="true" className={`flex h-28 items-center justify-center overflow-hidden rounded-lg border border-gray-100 ${template.soft}`}>
      <div className="relative h-[100px] w-[71px] overflow-hidden bg-white shadow-sm">
        <div className="pointer-events-none absolute left-0 top-0 h-[1123px] w-[794px] origin-top-left scale-[0.089]">
          <AdditionalResumeThumbnail template={template.id} />
        </div>
      </div>
    </div>
  ),
}));

export default function ResumeTemplate({ selectedTemplate, setSelectedTemplate }) {
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Mẫu CV</p>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {[...templates, ...additionalTemplates].map((t) => {
          const isActive = selectedTemplate === t.id;
          return (
            <div key={t.id}>
            <button
              type="button"
              aria-pressed={isActive}
              aria-label={`Chọn mẫu ${t.name}`}
              onClick={() => setSelectedTemplate(t.id)}
              className={`w-full text-left rounded-xl p-2 border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
                isActive
                  ? "border-[#9346F5] ring-2 ring-[#9346F5]/15 shadow-md shadow-[#9346F5]/10"
                  : "border-gray-200 hover:border-[#9346F5]/40 hover:shadow-sm"
              }`}
            >
              {/* Preview thumbnail */}
              <div className="cv-template-thumbnail relative">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
