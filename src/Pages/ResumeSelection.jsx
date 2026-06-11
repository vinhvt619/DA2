import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header.jsx";
import { useToastContext } from "../Components/Toast.jsx";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const TEMPLATES = [
  {
    id: "modern",
    name: "Mẫu Sáng Tạo",
    tag: "Modern",
    desc: "Phá cách, nổi bật. Hoàn hảo cho thiết kế, nghệ thuật, marketing.",
    preview: (
      <div className="h-full bg-white border border-gray-100 rounded-lg overflow-hidden text-[4px]">
        <div className="grid grid-cols-5 h-full">
          <div className="col-span-3 p-2.5 space-y-0.5">
            <div className="font-bold text-[6px] text-gray-900">Họ và Tên</div>
            <div className="text-violet-600 font-semibold">Vị trí công việc</div>
            <div className="border-b border-gray-100 pb-0.5 font-bold text-gray-500 mt-1">KINH NGHIỆM</div>
            <div className="font-semibold">Vị trí 1</div>
            <div className="text-gray-400">Công ty A · 2022–nay</div>
          </div>
          <div className="col-span-2 bg-violet-50/80 p-2.5 space-y-0.5 border-l border-violet-100">
            <div className="w-8 h-8 rounded-lg bg-violet-100 mx-auto mb-1" />
            <div className="border-b border-violet-100 pb-0.5 font-bold text-gray-500">KỸ NĂNG</div>
            <div className="bg-violet-100 rounded px-0.5 py-0.5 text-violet-700">Kỹ năng 1</div>
            <div className="bg-violet-100 rounded px-0.5 py-0.5 text-violet-700">Kỹ năng 2</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "classic",
    name: "Mẫu Tối Giản",
    tag: "Minimal",
    desc: "Gọn gàng, thanh lịch. Lựa chọn chuyên nghiệp cho kỹ sư, văn phòng.",
    preview: (
      <div className="h-full bg-white border border-gray-100 rounded-lg overflow-hidden p-2.5 text-[4px]">
        <div className="text-center mb-1.5 border-b border-gray-200 pb-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto mb-0.5" />
          <div className="font-bold text-gray-800 text-[5.5px]">Họ và Tên</div>
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
          </div>
        </div>
      </div>
    ),
  },
];

const TEMPLATE_LABELS = {
  modern: "Modern",
  classic: "Minimal",
  professional: "Professional",
};

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-violet-200 bg-white p-5 animate-pulse shadow-sm"
        >
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100" />
            <div className="w-16 h-5 rounded-md bg-gray-100" />
          </div>
          <div className="h-5 w-3/4 rounded bg-gray-100 mb-2" />
          <div className="h-4 w-1/2 rounded bg-gray-50" />
          <div className="mt-6 flex gap-2">
            <div className="flex-1 h-9 rounded-xl bg-gray-100" />
            <div className="w-10 h-9 rounded-xl bg-gray-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResumeSelection() {
  const navigate = useNavigate();
  const showToast = useToastContext();
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setSavedResumes(data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách CV:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleSelectTemplate = (template) => {
    navigate("/resume", { state: { template } });
  };

  const handleEditResume = (cv) => {
    navigate("/resume", {
      state: { cvId: cv._id, template: cv.selectedTemplate || "modern" },
    });
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản CV này không?")) return;
    try {
      const response = await fetch(`/api/resume/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setSavedResumes((prev) => prev.filter((cv) => cv._id !== id));
        showToast("Đã xóa CV thành công.", "info");
      }
    } catch (error) {
      console.error("Lỗi xóa CV: ", error);
      showToast("Lỗi khi xóa CV.", "error");
    }
  };

  const handleRename = async (cv) => {
    if (!tempTitle.trim() || tempTitle === cv.title) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...cv, title: tempTitle, _id: cv._id }),
      });

      const data = await response.json();
      if (response.ok) {
        setSavedResumes((prev) =>
          prev.map((item) =>
            item._id === cv._id ? { ...item, title: tempTitle } : item,
          ),
        );
        setEditingId(null);
        showToast("Đã đổi tên CV thành công.", "success");
      } else {
        showToast(data.message || "Không thể đổi tên CV", "error");
      }
    } catch (error) {
      console.error("Lỗi đổi tên:", error);
      showToast("Lỗi kết nối.", "error");
    }
  };

  const scrollToTemplates = () => {
    document.getElementById("templates-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center py-6 sm:py-8 mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-4">
            <DocumentTextIcon className="h-3.5 w-3.5" />
            RabbitCV · Tạo CV
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 max-w-2xl">
            Thư viện CV của bạn
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl leading-relaxed">
            Quản lý các phiên bản hồ sơ, chỉnh sửa nhanh và tạo CV mới với mẫu chuyên nghiệp
            để ứng tuyển hiệu quả hơn.
          </p>
        </div>

        {/* Saved CVs */}
        <section className="rounded-3xl border border-violet-200 bg-white p-6 lg:p-8 shadow-md shadow-violet-200/30 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                CV đã lưu
                {!loading && savedResumes.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-violet-200 text-violet-900 text-xs font-semibold px-2 py-0.5">
                    {savedResumes.length}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Click vào tên CV để đổi tên nhanh
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/resume", { state: { template: "modern" } })}
              className="shrink-0 px-4 py-2.5 bg-violet-800 text-white hover:bg-violet-900 rounded-xl cursor-pointer font-semibold flex items-center justify-center gap-2 shadow-md transition-all text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Tạo CV mới
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : savedResumes.length === 0 ? (
            <div className="text-center border border-dashed border-violet-300 rounded-2xl py-12 px-6 bg-violet-100">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-200 text-violet-800">
                <DocumentTextIcon className="h-7 w-7" />
              </div>
              <p className="text-gray-600 font-semibold mb-1">Bạn chưa có bản CV nào</p>
              <p className="text-sm text-gray-400 mb-5">
                Chọn mẫu bên dưới hoặc tạo CV mới để bắt đầu
              </p>
              <button
                type="button"
                onClick={scrollToTemplates}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-800 hover:gap-2 transition-all"
              >
                Xem mẫu CV
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedResumes.map((cv) => (
                <div
                  key={cv._id}
                  className="rounded-2xl border border-violet-200 bg-white p-5 flex flex-col group hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/35 transition-all duration-200 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-200 text-violet-800 flex items-center justify-center border border-violet-300 group-hover:border-violet-400 transition-colors">
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          {new Date(cv.updatedAt || cv.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {cv.selectedTemplate && (
                          <span className="text-[10px] font-semibold text-violet-800 bg-violet-200 px-2 py-0.5 rounded-md border border-violet-300">
                            {TEMPLATE_LABELS[cv.selectedTemplate] || cv.selectedTemplate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-10 flex items-center mb-1">
                      {editingId === cv._id ? (
                        <input
                          autoFocus
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => handleRename(cv)}
                          onKeyDown={(e) => e.key === "Enter" && handleRename(cv)}
                          className="w-full text-sm font-bold text-gray-800 border-b-2 border-violet-700 focus:outline-none bg-violet-100 px-2 py-1 h-full rounded-t-lg"
                        />
                      ) : (
                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(cv._id);
                            setTempTitle(cv.title);
                          }}
                          className="text-sm font-bold text-gray-800 line-clamp-1 cursor-text hover:bg-violet-100 px-2 py-1 w-full border-b-2 border-transparent rounded-t-lg transition-colors"
                          title="Click để đổi tên"
                        >
                          {cv.title || "CV Mới Của Tôi"}
                        </h3>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 font-medium px-2 line-clamp-1">
                      {cv.personalInfo?.jobTitle || "Chưa cập nhật vị trí"}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditResume(cv)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-violet-100 text-violet-900 font-semibold py-2 rounded-xl hover:bg-violet-800 hover:text-white text-xs border border-violet-300 hover:border-violet-800 transition-all"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Sửa CV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(cv._id)}
                      className="w-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-100 transition-all"
                      aria-label="Xóa CV"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Templates */}
        <section
          id="templates-section"
          className="rounded-3xl border border-violet-200 bg-white p-6 lg:p-8 shadow-md shadow-violet-200/30"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 border border-violet-300 text-violet-900 px-3 py-1 text-xs font-semibold mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              Mẫu CV chuyên nghiệp
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Tạo phiên bản CV mới
            </h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
              Bạn có thể tạo nhiều phiên bản CV khác nhau để ứng tuyển cho từng vị trí và công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className="group text-left rounded-2xl border border-violet-200 bg-white p-5 shadow-sm hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="h-44 w-full rounded-xl mb-4 overflow-hidden border border-violet-200 bg-violet-100 p-3 group-hover:border-violet-300 transition-colors">
                  {tpl.preview}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-violet-800 transition-colors">
                      {tpl.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {tpl.tag}
                    </span>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-violet-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    Dùng mẫu
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                  {tpl.desc}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
