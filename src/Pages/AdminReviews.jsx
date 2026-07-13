import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function AdminReviews() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter tabs state
  const [activeTab, setActiveTab] = useState("all"); // all, pending, approved, rejected

  // TODO: replace with real API CV reviews list if available
  const mockCvs = [
    {
      _id: "cv1",
      user: { name: "Nguyễn Văn An", email: "vanan@gmail.com" },
      title: "CV React Developer - 2 Years Experience",
      skills: ["React", "JavaScript", "TypeScript", "Node.js", "Tailwind CSS", "Git"],
      status: "pending",
      submittedAt: "2026-07-06T12:00:00Z",
    },
    {
      _id: "cv2",
      user: { name: "Lê Quốc Thịnh", email: "quocthinh@gmail.com" },
      title: "CV Senior Frontend Engineer",
      skills: ["Vue.js", "React", "Next.js", "CSS Grid", "Sass", "Webpack"],
      status: "approved",
      submittedAt: "2026-07-04T10:15:00Z",
    },
    {
      _id: "cv3",
      user: { name: "Phạm Minh Anh", email: "minhanh@gmail.com" },
      title: "CV Fullstack Developer Intern",
      skills: ["HTML/CSS", "JavaScript", "Python", "Flask", "SQL"],
      status: "pending",
      submittedAt: "2026-07-07T02:00:00Z",
    },
    {
      _id: "cv4",
      user: { name: "Trần Thu Hương", email: "thuhuong@gmail.com" },
      title: "CV UI/UX Product Designer",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research", "Wireframing"],
      status: "rejected",
      submittedAt: "2026-07-02T09:00:00Z",
    },
    {
      _id: "cv5",
      user: { name: "Hoàng Quốc Bảo", email: "quocbao@gmail.com" },
      title: "CV Node.js Backend Developer",
      skills: ["Express", "MongoDB", "PostgreSQL", "Docker", "Redis", "AWS"],
      status: "pending",
      submittedAt: "2026-07-06T15:40:00Z",
    },
  ];

  const fetchCvs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch CV review data from API
      const res = await fetch("/api/admin/cvs", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCvs(data.cvs || []);
      } else {
        // Fallback to mock data for demo / TODO: replace with real API
        setCvs(mockCvs);
        console.warn("Using mock CV reviews fallback data. Connect to real API later.");
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách hồ sơ CV:", err);
      // Fallback
      setCvs(mockCvs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  // Approve CV action
  const handleApproveCv = async (id) => {
    try {
      const res = await fetch(`/api/admin/cvs/${id}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchCvs();
      } else {
        // Fallback local update
        setCvs((prev) =>
          prev.map((cv) => (cv._id === id ? { ...cv, status: "approved" } : cv))
        );
        console.warn("API approve failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi duyệt hồ sơ:", err);
      setCvs((prev) =>
        prev.map((cv) => (cv._id === id ? { ...cv, status: "approved" } : cv))
      );
    }
  };

  // Reject CV action
  const handleRejectCv = async (id) => {
    try {
      const res = await fetch(`/api/admin/cvs/${id}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        fetchCvs();
      } else {
        // Fallback local update
        setCvs((prev) =>
          prev.map((cv) => (cv._id === id ? { ...cv, status: "rejected" } : cv))
        );
        console.warn("API reject failed, applied local fallback");
      }
    } catch (err) {
      console.error("Lỗi từ chối hồ sơ:", err);
      setCvs((prev) =>
        prev.map((cv) => (cv._id === id ? { ...cv, status: "rejected" } : cv))
      );
    }
  };

  // Filter CVs logic
  const filteredCvs = cvs.filter((cv) => {
    if (activeTab === "all") return true;
    return cv.status === activeTab;
  });

  return (
    <div className="p-8 flex flex-col gap-6">
      
      {/* Filter Tabs */}
      <div className="flex border-b-[0.5px] border-[rgba(196,180,240,0.4)] gap-1 shrink-0">
        {[
          { id: "all", label: "Tất cả" },
          { id: "pending", label: "Chờ duyệt" },
          { id: "approved", label: "Đã duyệt" },
          { id: "rejected", label: "Từ chối" },
        ].map((tab) => {
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-[6px] border-t border-x transition-colors -mb-[0.5px] cursor-pointer ${
                isCurrent
                  ? "bg-white border-[rgba(196,180,240,0.4)] text-violet-700 border-b-white"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid List of CV Cards */}
      {loading ? (
        // Skeleton loader grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-[10px] border-[0.5px] border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-4/5"></div>
              <div className="flex gap-1.5">
                <div className="h-5 bg-slate-100 rounded-[6px] w-12"></div>
                <div className="h-5 bg-slate-100 rounded-[6px] w-16"></div>
                <div className="h-5 bg-slate-100 rounded-[6px] w-14"></div>
              </div>
              <div className="h-7 bg-slate-100 rounded-[6px] w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredCvs.length === 0 ? (
        // Empty State
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-[10px] border-[0.5px] border-[rgba(196,180,240,0.4)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          Không tìm thấy hồ sơ CV nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCvs.map((cv) => {
            // Status badge styling
            let statusBadge = "bg-slate-50 text-slate-500 border-slate-200/50";
            let statusText = "Từ chối";
            if (cv.status === "pending") {
              statusBadge = "bg-amber-50 text-amber-700 border-amber-100/30";
              statusText = "Chờ duyệt";
            } else if (cv.status === "approved") {
              statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100/30";
              statusText = "Đã duyệt";
            }

            const formattedDate = new Date(cv.submittedAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            // Display skills: first 4 and "+N"
            const maxSkills = 4;
            const displayedSkills = cv.skills?.slice(0, maxSkills) || [];
            const remainingCount = (cv.skills?.length || 0) - maxSkills;

            return (
              <div
                key={cv._id}
                className="bg-white p-5 rounded-[10px] border-[0.5px] border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col justify-between"
              >
                <div>
                  {/* User Profile */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                      {(cv.user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-[12px] leading-tight truncate">
                        {cv.user?.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {cv.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* CV Icon & Title */}
                  <div className="mt-4 flex items-start gap-2.5">
                    <div className="p-1.5 bg-slate-50 text-slate-500 rounded-[6px] border border-slate-200/30 shrink-0">
                      <DocumentTextIcon className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-850 text-[13px] leading-snug">
                        {cv.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Nộp ngày: {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Skill tags */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {displayedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-slate-100/60 text-slate-600 border border-slate-200/30 text-[9px] font-bold rounded-[4px]"
                      >
                        {skill}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100/30 text-[9px] font-extrabold rounded-[4px]">
                        +{remainingCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="mt-5 pt-3.5 border-t-[0.5px] border-slate-100 flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${statusBadge}`}>
                    {statusText}
                  </span>

                  {cv.status === "pending" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRejectCv(cv._id)}
                        className="px-2 py-1 bg-red-50 text-red-600 border border-red-100/50 rounded-[6px] text-[10px] font-semibold hover:bg-red-100/30 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XMarkIcon className="size-3" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handleApproveCv(cv._id)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100/50 rounded-[6px] text-[10px] font-semibold hover:bg-emerald-100/30 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckIcon className="size-3" />
                        <span>Duyệt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
