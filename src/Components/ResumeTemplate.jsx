import React from "react";

const templates = [
  {
    id: "classic",
    name: "Mẫu Cơ Bản",
    preview: (
      <div className="h-32 bg-white border border-gray-200 rounded overflow-hidden p-2 text-[4px]">
        <div className="text-center mb-1">
          <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto mb-0.5"></div>
          <div className="font-bold text-gray-800">Họ và Tên</div>
          <div className="text-gray-400">Vị trí công việc</div>
        </div>
        <div className="grid grid-cols-5 gap-1 mt-1">
          <div className="col-span-2 space-y-1">
            <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5">KỸ NĂNG</div>
            <div className="bg-gray-100 rounded px-0.5">Kỹ năng 1</div>
            <div className="bg-gray-100 rounded px-0.5">Kỹ năng 2</div>
            <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5 mt-1">NGOẠI NGỮ</div>
            <div className="bg-gray-100 rounded px-0.5">Tiếng Anh</div>
          </div>
          <div className="col-span-3 space-y-1">
            <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5">KINH NGHIỆM</div>
            <div><div className="font-semibold">Vị trí 1</div><div className="text-gray-400">Công ty A · 2022</div></div>
            <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5">HỌC VẤN</div>
            <div><div className="font-semibold">Đại học ABC</div><div className="text-gray-400">2018–2022</div></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Mẫu Hiện Đại",
    preview: (
      <div className="h-32 bg-white border border-gray-200 rounded overflow-hidden text-[4px]">
        <div className="grid grid-cols-5 h-full">
          <div className="col-span-3 p-2 space-y-1">
            <div className="font-bold text-[6px] text-gray-900">Họ và Tên</div>
            <div className="text-blue-600 font-semibold">Vị trí công việc</div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-600">KINH NGHIỆM</div>
            <div><div className="font-semibold">Vị trí 1</div><div className="text-gray-400">Công ty A · 2022–nay</div></div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-600">HỌC VẤN</div>
            <div><div className="font-semibold">Đại học ABC</div><div className="text-gray-400">2018–2022</div></div>
          </div>
          <div className="col-span-2 bg-gray-50 p-2 space-y-1 border-l border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gray-200 mx-auto mb-1"></div>
            <div className="border-b border-gray-200 pb-0.5 font-bold text-gray-600">KỸ NĂNG</div>
            <div className="bg-blue-50 rounded px-0.5 text-blue-700">Kỹ năng 1</div>
            <div className="bg-blue-50 rounded px-0.5 text-blue-700">Kỹ năng 2</div>
            <div className="border-b border-gray-200 pb-0.5 font-bold text-gray-600">NGOẠI NGỮ</div>
            <div className="text-gray-500">Tiếng Anh</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "professional",
    name: "Mẫu Chuyên Nghiệp",
    preview: (
      <div className="h-32 bg-white border border-gray-200 rounded overflow-hidden text-[4px]">
        <div className="grid grid-cols-5 h-full">
          <div className="col-span-2 bg-slate-800 p-2 text-white space-y-1">
            <div className="w-7 h-7 rounded-full bg-slate-600 mx-auto mb-1 border border-slate-500"></div>
            <div className="font-bold text-[5px] text-center">Họ và Tên</div>
            <div className="text-slate-400 text-center">Vị trí việc làm</div>
            <div className="border-b border-slate-600 pb-0.5 font-bold text-slate-400 mt-1">KỸ NĂNG</div>
            <div className="text-slate-300">Kỹ năng 1</div>
            <div className="text-slate-300">Kỹ năng 2</div>
            <div className="border-b border-slate-600 pb-0.5 font-bold text-slate-400">NGOẠI NGỮ</div>
            <div className="text-slate-300">Tiếng Anh</div>
          </div>
          <div className="col-span-3 p-2 space-y-1">
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-600">KINH NGHIỆM</div>
            <div><div className="font-semibold">Vị trí 1</div><div className="text-gray-400">Công ty A · 2022</div></div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-600">HỌC VẤN</div>
            <div><div className="font-semibold">Đại học ABC</div><div className="text-gray-400">2018–2022</div></div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-600">DỰ ÁN</div>
            <div><div className="font-semibold">Dự án 1</div></div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function ResumeTemplate({ selectedTemplate, setSelectedTemplate }) {
  return (
    <div className="w-full border-l bg-white p-4 overflow-y-auto h-full hidden md:block">
      <h3 className="text-base font-bold mb-5 text-gray-800 tracking-tight">Chọn mẫu CV</h3>
      <div className="space-y-4">
        {templates.map((i) => (
          <div
            key={i.id}
            onClick={() => setSelectedTemplate(i.id)}
            className={`border-2 rounded-xl p-2 cursor-pointer ${
              selectedTemplate === i.id
                ? "border-[#9346F5] ring-2 ring-[#9346F5]/20 shadow-md"
                : "border-gray-200 hover:border-[#9346F5]/50 hover:shadow-sm"
            }`}
          >
            {i.preview}
            <p className={`text-xs font-semibold text-center mt-2 ${
              selectedTemplate === i.id ? "text-[#9346F5]" : "text-gray-600"
            }`}>
              {selectedTemplate === i.id ? "✓ " : ""}{i.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
