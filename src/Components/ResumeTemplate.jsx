import React from "react";

export default function ResumeTemplate({
  selectedTemplate,
  setSelectedTemplate,
}) {
  return (
    <div className="w-full border-l bg-white p-4 overflow-y-auto h-full hidden md:block">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Chọn mẫu CV</h3>
      <div className="space-y-4">
        <div
          className={`border rounded-lg p-2 cursor-pointer transition-all ${
            selectedTemplate === "basic"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "hover:border-blue-500"
          }`}
          onClick={() => setSelectedTemplate("basic")}
        >
          <div className="h-32 bg-gray-100 mb-2 flex items-center justify-center text-gray-400">
            Preview 1
          </div>
          <p className="text-sm font-medium text-center">Mẫu Cơ Bản</p>
        </div>
        <div
          className={`border rounded-lg p-2 cursor-pointer transition-all ${
            selectedTemplate === "modern"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "hover:border-blue-500"
          }`}
          onClick={() => setSelectedTemplate("modern")}
        >
          <div className="h-32 bg-gray-100 mb-2 flex items-center justify-center text-gray-400">
            Preview 2
          </div>
          <p className="text-sm font-medium text-center">Mẫu Hiện Đại</p>
        </div>
        <div
          className={`border rounded-lg p-2 cursor-pointer transition-all ${
            selectedTemplate === "professional"
              ? "border-blue-500 ring-2 ring-blue-200"
              : "hover:border-blue-500"
          }`}
          onClick={() => setSelectedTemplate("professional")}
        >
          <div className="h-32 bg-gray-100 mb-2 flex items-center justify-center text-gray-400">
            Preview 3
          </div>
          <p className="text-sm font-medium text-center">Mẫu Chuyên Nghiệp</p>
        </div>
      </div>
    </div>
  );
}
