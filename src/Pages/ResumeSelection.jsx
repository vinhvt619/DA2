import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function ResumeSelection() {
  const navigate = useNavigate();
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes", {
          credentials: "include",
        });
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
    navigate("/resume", { state: { cvId: cv._id, template: cv.selectedTemplate || "modern" } });
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
      }
    } catch (error) {
      console.error("Lỗi xóa CV: ", error);
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
      } else {
        alert(data.message || "Không thể đổi tên CV");
      }
    } catch (error) {
      console.error("Lỗi đổi tên:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased">
      <Header />
      <div className="flex-1 flex flex-col items-center p-6 pb-20">
        <div className="max-w-5xl w-full mt-8 mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Thư viện CV của bạn
              </h2>
              <p className="text-slate-500 font-medium mt-1">
                Nơi quản lý tất cả các phiên bản hồ sơ để ứng tuyển
              </p>
            </div>
            <button
              onClick={() => navigate("/resume", { state: { template: "classic" } })}
              className="px-4 py-2 bg-black text-white hover:bg-[#9346F5] rounded-xl cursor-pointer font-bold flex items-center gap-2 shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              Tạo mới
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-400 font-medium">
              Đang tải dữ liệu...
            </div>
          ) : savedResumes.length === 0 ? (
            <div className="text-center bg-white/50 border-2 border-dashed border-black/20 rounded-3xl py-12">
              <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                Bạn chưa có bản CV nào. Hãy tạo mới ở bên dưới nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {savedResumes.map((cv) => (
                <div
                  key={cv._id}
                  className="bg-white rounded-2xl border border-black p-5 flex flex-col group hover:border-[#9346F5]/50 shadow-sm shadow-indigo-100/20"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#9346F5]/5 text-[#9346F5] flex items-center justify-center border border-[#9346F5]/20">
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">
                        {new Date(
                          cv.updatedAt || cv.createdAt,
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="h-11 flex items-center mb-1">
                      {editingId === cv._id ? (
                        <input
                          autoFocus
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => handleRename(cv)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRename(cv)
                          }
                          className="w-full text-base font-bold text-slate-800 border-b-2 border-[#9346F5] focus:outline-none bg-[#9346F5]/5 pl-3 py-1 h-full rounded-t-lg"
                        />
                      ) : (
                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(cv._id);
                            setTempTitle(cv.title);
                          }}
                          className="text-base font-bold text-slate-800 line-clamp-1 cursor-text hover:bg-[#9346F5]/5 pl-3 py-1 w-full border-b-2 border-transparent rounded-t-lg"
                          title="Click để đổi tên"
                        >
                          {cv.title || "CV Mới Của Tôi"}
                        </h3>
                      )}
                    </div>

                    <p className="text-sm text-slate-500 font-medium mt-1 pl-3 line-clamp-1">
                      {cv.personalInfo?.jobTitle || "Chưa cập nhật vị trí"}
                    </p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => handleEditResume(cv)}
                      className="flex-1 bg-slate-100 text-[#9346F5] font-bold py-2 rounded-xl hover:bg-[#9346F5] cursor-pointer hover:text-white text-sm border-2 border-[#9346F5]/20 hover:border-[#9346F5]"
                    >
                      Sửa CV
                    </button>
                    <button
                      onClick={() => handleDeleteResume(cv._id)}
                      className="w-10 flex items-center justify-center cursor-pointer text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-grey-100 hover:border-red-100"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          id="templates-section"
          className="max-w-4xl w-full border-t border-black/10 pt-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Tạo phiên bản CV mới
            </h2>
            <p className="text-slate-600 font-medium">
              Bạn có thể tạo nhiều phiên bản CV khác nhau để ứng tuyển cho các
              công ty tương ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div
              onClick={() => handleSelectTemplate("modern")}
              className="bg-white rounded-3xl border-2 border-black p-6 cursor-pointer hover:bg-slate-100 flex flex-col"
            >
              <div className="h-40 w-full bg-indigo-50 rounded-2xl mb-6 flex items-center justify-center border-2 border-black">
                <span className="font-extrabold text-indigo-900 tracking-widest uppercase">
                  Hiện Đại
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Mẫu Sáng Tạo (Modern)
              </h3>
              <p className="text-sm text-slate-700 font-medium leading-relaxed mb-6 flex-1">
                Phá cách, nổi bật. Hoàn hảo cho thiết kế, nghệ thuật, marketing.
              </p>
            </div>

            <div
              onClick={() => handleSelectTemplate("classic")}
              className="bg-white rounded-3xl border-2 border-black p-6 cursor-pointer hover:bg-slate-100 flex flex-col"
            >
              <div className="h-40 w-full bg-slate-100 rounded-2xl mb-6 flex items-center justify-center border-2 border-black">
                <span className="font-extrabold text-slate-700 tracking-widest uppercase">
                  Cổ Điển
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Mẫu Tối Giản (Minimal)
              </h3>
              <p className="text-sm text-slate-700 font-medium leading-relaxed mb-6 flex-1">
                Gọn gàng, thanh lịch. Lựa chọn chuyên nghiệp cho kỹ sư, văn
                phòng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
