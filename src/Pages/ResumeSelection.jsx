import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
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
          className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse shadow-sm"
        >
          <div className="flex justify-between mb-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100" />
            <div className="w-16 h-5 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-3/4 rounded bg-gray-100 mb-2" />
          <div className="h-4 w-1/2 rounded bg-gray-50" />
          <div className="mt-6 flex gap-2">
            <div className="flex-1 h-9 rounded-lg bg-gray-100" />
            <div className="w-9 h-9 rounded-lg bg-gray-50" />
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

  const { currentUser, isAuthChecked } = useAuth();

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!currentUser) {
      navigate("/login");
      return;
    }

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
  }, [currentUser, isAuthChecked, navigate]);

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

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col font-sans antialiased text-slate-900 text-sm page-transition">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col items-center text-center py-6 sm:py-8 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-600 px-3 py-1 text-[11px] font-semibold mb-4">
            <DocumentTextIcon className="h-3.5 w-3.5" />
            RabbitCV · Tạo CV
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 max-w-2xl">
            Thư viện CV của bạn
          </h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
            Quản lý các phiên bản hồ sơ, chỉnh sửa nhanh và tạo CV mới với mẫu chuyên nghiệp
            để ứng tuyển hiệu quả hơn.
          </p>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 lg:p-7 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                CV đã lưu
                {!loading && savedResumes.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5">
                    {savedResumes.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhấn vào tên CV để đổi tên nhanh
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/resume", { state: { template: "modern" } })}
              className="shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Tạo CV mới
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : savedResumes.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600 border border-violet-100/50 shadow-xs">
                <DocumentTextIcon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">Bạn chưa tạo bản CV nào</h3>
              <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto">
                Hãy thiết lập bản hồ sơ đầu tiên của bạn để ứng tuyển ngay vào những vị trí mơ ước.
              </p>
              <button
                type="button"
                onClick={() => navigate("/resume")}
                className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-750 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                Tạo CV ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedResumes.map((cv) => (
                <div
                  key={cv._id}
                  className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                        <DocumentTextIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {new Date(cv.updatedAt || cv.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {cv.selectedTemplate && (
                          <span className="text-[10px] font-semibold text-violet-755 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                            {TEMPLATE_LABELS[cv.selectedTemplate] || cv.selectedTemplate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-9 flex items-center mb-1">
                      {editingId === cv._id ? (
                        <input
                          autoFocus
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => handleRename(cv)}
                          onKeyDown={(e) => e.key === "Enter" && handleRename(cv)}
                          className="w-full text-sm font-bold text-gray-800 border-b border-violet-500 focus:outline-none bg-gray-50 px-2 py-1 h-full rounded"
                        />
                      ) : (
                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(cv._id);
                            setTempTitle(cv.title);
                          }}
                          className="text-sm font-bold text-gray-850 line-clamp-1 cursor-text hover:bg-gray-50 px-2 py-1 w-full rounded transition-colors"
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

                  <div className="mt-4 pt-3 border-t border-gray-50 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditResume(cv)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-violet-50 text-violet-700 font-semibold py-2 rounded-lg hover:bg-violet-600 hover:text-white text-xs border border-violet-100 hover:border-violet-600 transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Sửa CV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(cv._id)}
                      className="w-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-150 hover:border-red-100 transition-colors"
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

        <section
          id="templates-section"
          className="rounded-xl border border-gray-200 bg-white p-6 lg:p-7 shadow-sm"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 text-slate-600 px-3 py-1 text-[11px] font-semibold mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              Mẫu CV chuyên nghiệp
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">
              Tạo phiên bản CV mới
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Bạn có thể tạo nhiều phiên bản CV khác nhau để ứng tuyển cho từng vị trí và công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className="group text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="h-40 w-full rounded-lg mb-3 overflow-hidden border border-gray-100 bg-gray-50 p-3">
                  {tpl.preview}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-violet-600">
                      {tpl.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450">
                      {tpl.tag}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-violet-600 group-hover:underline">
                    Dùng mẫu →
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
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
