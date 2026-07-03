import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../Components/Header.jsx";
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  PlusCircleIcon,
  InboxStackIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useToastContext } from "../Components/Toast.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthChecked } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");

  useEffect(() => {
    if (isAuthChecked) {
      if (!currentUser) {
        navigate("/login");
      } else if (currentUser.role !== "company") {
        navigate("/MainMenu");
      }
    }
  }, [currentUser, isAuthChecked, navigate]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToastContext();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    benefits: "",
    tags: [],
    expiryDate: "",
    status: "Active",
  });

  const [tagInput, setTagInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);

  // Filters state
  const [jobStatusFilter, setJobStatusFilter] = useState("All");
  const [selectedJobFilter, setSelectedJobFilter] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const jobsRes = await fetch("/api/jobs/my", { credentials: "include" });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      const appsRes = await fetch("/api/jobs/applications", {
        credentials: "include",
      });
      const appsData = await appsRes.json();
      if (appsRes.ok) setApplications(appsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu doanh nghiệp:", error);
      showToast("Không thể tải dữ liệu. Vui lòng tải lại trang.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Tag chip handlers
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/,$/, "");
      if (cleanTag && !formData.tags.includes(cleanTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, cleanTag],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handlePostJob = async (e, submitStatus) => {
    if (e) e.preventDefault();
    if (
      !formData.title ||
      !formData.salary ||
      !formData.location ||
      !formData.description
    ) {
      showToast("Vui lòng điền các thông tin bắt buộc (*)", "error");
      return;
    }

    const targetStatus = submitStatus || formData.status || "Active";
    const bodyData = {
      ...formData,
      status: targetStatus,
    };

    try {
      setFormLoading(true);
      const url = isEditing ? `/api/jobs/${editingJobId}` : "/api/jobs";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          isEditing
            ? "Cập nhật tin tuyển dụng thành công!"
            : targetStatus === "Draft"
              ? "Đã lưu tin nháp thành công!"
              : "Đăng tin tuyển dụng thành công!",
          "success",
        );
        resetForm();
        setActiveTab("jobs");
        fetchDashboardData();
      } else {
        showToast(data.message || "Lỗi khi đăng tin", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      salary: "",
      location: "",
      type: "Full-time",
      description: "",
      requirements: "",
      benefits: "",
      tags: [],
      expiryDate: "",
      status: "Active",
    });
    setTagInput("");
    setIsEditing(false);
    setEditingJobId(null);
  };

  const handleStartEdit = (job) => {
    setFormData({
      title: job.title || "",
      salary: job.salary || "",
      location: job.location || "",
      type: job.type || "Full-time",
      description: job.description || "",
      requirements: Array.isArray(job.requirements)
        ? job.requirements.join("\n")
        : job.requirements || "",
      benefits: Array.isArray(job.benefits)
        ? job.benefits.join("\n")
        : job.benefits || "",
      tags: job.tags || [],
      expiryDate: job.expiryDate
        ? new Date(job.expiryDate).toISOString().split("T")[0]
        : "",
      status: job.status || "Active",
    });
    setIsEditing(true);
    setEditingJobId(job._id);
    setActiveTab("post");
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa tin tuyển dụng này? Toàn bộ hồ sơ ứng tuyển liên quan cũng sẽ bị xóa.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showToast("Xóa tin tuyển dụng thành công!", "info");
        fetchDashboardData();
      } else {
        const data = await res.json();
        showToast(data.message || "Lỗi khi xóa", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      const res = await fetch(`/api/jobs/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast(`Đã cập nhật trạng thái hồ sơ thành công!`, "success");
        fetchDashboardData();
      } else {
        const data = await res.json();
        showToast(data.message || "Lỗi cập nhật", "error");
      }
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    }
  };

  const getJobStatus = (job) => {
    if (job.status === "Draft") return "Draft";
    if (job.expiryDate && new Date(job.expiryDate) < new Date()) {
      return "Expired";
    }
    return job.status || "Active";
  };

  const getAppCountForJob = (jobId) => {
    return applications.filter(
      (app) => app.jobId && (app.jobId._id === jobId || app.jobId === jobId),
    ).length;
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobStatusFilter === "All") return true;
      return getJobStatus(job) === jobStatusFilter;
    });
  }, [jobs, jobStatusFilter]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const totalApps = applications.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newApps7Days = applications.filter((app) => {
      const appDate = new Date(app.createdAt);
      return appDate >= sevenDaysAgo;
    }).length;

    return { totalJobs, totalApps, newApps7Days };
  }, [jobs, applications]);

  const recentPendingApps = useMemo(() => {
    return applications.filter((app) => app.status === "Pending").slice(0, 5);
  }, [applications]);

  const groupedApplications = useMemo(() => {
    const filtered = selectedJobFilter
      ? applications.filter(
          (app) =>
            app.jobId &&
            (app.jobId._id === selectedJobFilter ||
              app.jobId === selectedJobFilter),
        )
      : applications;

    const groups = {};
    filtered.forEach((app) => {
      const jobId = app.jobId?._id || "unknown";
      const jobTitle = app.jobId?.title || "Tin tuyển dụng đã ẩn hoặc xóa";
      if (!groups[jobId]) {
        groups[jobId] = {
          jobId,
          jobTitle,
          apps: [],
        };
      }
      groups[jobId].apps.push(app);
    });

    return Object.values(groups);
  }, [applications, selectedJobFilter]);

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Đang xác thực thông tin...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#F8F4FC] to-[#EDE5F7] min-h-screen font-sans text-slate-800 flex flex-col antialiased page-transition">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10 flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 sticky top-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-3.5 mb-8 px-1">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">
                R
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Kênh Tuyển Dụng
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Doanh nghiệp
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {[
                { id: "overview", label: "Tổng quan", icon: InboxStackIcon },
                {
                  id: "post",
                  label: isEditing ? "Sửa tin tuyển dụng" : "Đăng tuyển dụng",
                  icon: PlusCircleIcon,
                },
                { id: "jobs", label: "Tin đã đăng", icon: BriefcaseIcon },
                {
                  id: "applications",
                  label: "Hồ sơ ứng tuyển",
                  icon: UserGroupIcon,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id !== "post" && isEditing) {
                        if (
                          window.confirm(
                            "Thông tin đang chỉnh sửa sẽ không được lưu. Bạn có muốn thoát?",
                          )
                        ) {
                          resetForm();
                          setActiveTab(tab.id);
                        }
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`flex items-center gap-3 py-2.5 transition-all duration-150 cursor-pointer text-[13px] font-semibold border-l-2 ${
                      isActive
                        ? "border-[#9346F5] text-slate-900 font-bold pl-4 bg-purple-50/20"
                        : "border-transparent text-slate-500 hover:text-slate-950 pl-4 hover:bg-slate-50/40"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-[#9346F5]" : "text-slate-400"}`}
                    />
                    {tab.label}
                    {tab.id === "applications" &&
                      applications.filter((a) => a.status === "Pending")
                        .length > 0 && (
                        <span
                          className={`ml-auto w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? "bg-slate-900 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {
                            applications.filter((a) => a.status === "Pending")
                              .length
                          }
                        </span>
                      )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-100 flex flex-col items-center justify-center min-h-[350px] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
              <p className="text-slate-400 font-medium text-xs">
                Đang tải dữ liệu doanh nghiệp...
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-10 animate-fadeIn">
                  {/* Custom Clean Header */}
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                      Tổng quan tuyển dụng
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                      Chào mừng bạn trở lại. Theo dõi chiến dịch tuyển dụng và
                      xử lý hồ sơ từ các ứng viên nhanh chóng.
                    </p>
                  </div>

                  {/* Asymmetrical Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Primary Dominant Card: Total CVs */}
                    <div className="md:col-span-2 bg-white border border-slate-150/80 rounded-2xl p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <UserGroupIcon className="w-4 h-4 text-[#9346F5]" />
                          <span>Hồ sơ đã nhận</span>
                        </div>
                        <h3 className="text-5xl font-black text-slate-900 mt-4 tracking-tight">
                          {stats.totalApps}{" "}
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">
                            CV ứng tuyển
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 font-medium max-w-md">
                          Quản lý các hồ sơ gửi đến và cập nhật trạng thái xử lý
                          để liên hệ lịch hẹn phỏng vấn.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>
                            {
                              applications.filter((a) => a.status === "Pending")
                                .length
                            }{" "}
                            hồ sơ mới
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          <span>
                            {
                              applications.filter(
                                (a) => a.status === "Interview",
                              ).length
                            }{" "}
                            phỏng vấn
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>
                            {
                              applications.filter((a) => a.status === "Offered")
                                .length
                            }{" "}
                            mời nhận việc
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Stacked Cards */}
                    <div className="flex flex-col gap-6 md:col-span-1 justify-between">
                      {/* Small Card 1 */}
                      <div className="flex-1 bg-white border border-slate-150/80 rounded-2xl p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Tin tuyển dụng
                          </span>
                          <BriefcaseIcon className="w-4 h-4" />
                        </div>
                        <div className="mt-4">
                          <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.totalJobs}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            Đang hoạt động & nháp
                          </p>
                        </div>
                      </div>

                      {/* Small Card 2 */}
                      <div className="flex-1 bg-[#FDF8EE] border border-[#F5EAD2]/60 rounded-2xl p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center justify-between text-amber-800/80">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Mới (7 ngày qua)
                          </span>
                          <DocumentArrowUpIcon className="w-4 h-4" />
                        </div>
                        <div className="mt-4">
                          <h4 className="text-3xl font-black text-amber-900 tracking-tight">
                            +{stats.newApps7Days}
                          </h4>
                          <p className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wider mt-1">
                            CV gửi về gần đây
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recents list */}
                  <div className="bg-white rounded-2xl border border-slate-150/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Hồ sơ ứng tuyển mới nhất
                      </h2>
                      <button
                        onClick={() => setActiveTab("applications")}
                        className="text-xs font-bold text-slate-400 hover:text-[#9346F5] transition-colors"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    {recentPendingApps.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-sm font-medium flex flex-col items-center justify-center bg-slate-50/20">
                        <p>Hộp thư của bạn không có hồ sơ mới cần duyệt.</p>
                        <button
                          onClick={() => setActiveTab("jobs")}
                          className="mt-3 text-xs text-[#9346F5] font-bold hover:underline cursor-pointer"
                        >
                          Xem tin tuyển dụng đang hoạt động &rarr;
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {recentPendingApps.map((app, i) => (
                          <div
                            key={i}
                            className="px-8 py-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-slate-55 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                {app.fullName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {app.fullName}
                                </h4>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                  Ứng tuyển:{" "}
                                  <span className="text-slate-600 font-bold">
                                    {app.jobId?.title || "Công việc đã xóa"}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-400 font-medium">
                                {new Date(app.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                              <button
                                onClick={() =>
                                  navigate(`/resume/view/${app.resumeId}`)
                                }
                                className="text-xs font-extrabold text-slate-500 hover:text-[#9346F5] transition-colors cursor-pointer"
                              >
                                Xem CV
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Post & Edit Job Form */}
              {activeTab === "post" && (
                <div className="bg-white rounded-2xl border border-slate-150/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-6 sm:p-8 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-5 mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {isEditing
                          ? "Chỉnh sửa tin tuyển dụng"
                          : "Đăng tin tuyển dụng mới"}
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        {isEditing
                          ? "Thay đổi nội dung mô tả hoặc thời hạn công việc."
                          : "Mô tả cụ thể yêu cầu giúp tìm kiếm ứng viên thích hợp hơn."}
                      </p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveTab("jobs");
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-950 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => handlePostJob(e, formData.status)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                          Tiêu đề công việc{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          required
                          placeholder="Ví dụ: Senior Frontend React Developer"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                          Mức lương <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="salary"
                          required
                          placeholder="Ví dụ: 15-20 triệu hoặc Thỏa thuận"
                          value={formData.salary}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                          Địa điểm làm việc{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="location"
                          required
                          placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                          Loại hình làm việc
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm bg-white cursor-pointer"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                          Hạn nộp hồ sơ
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                        Mô tả công việc <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        rows="4"
                        required
                        placeholder="Mô tả tóm tắt các trách nhiệm, công việc chính..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">
                          Yêu cầu công việc
                        </label>
                        <span className="text-[10px] text-slate-400 block mb-2 ml-0.5">
                          (Mỗi dòng viết một yêu cầu)
                        </span>
                        <textarea
                          name="requirements"
                          rows="4"
                          placeholder="Ví dụ:&#10;Tối thiểu 2 năm kinh nghiệm ReactJS&#10;Sử dụng tốt CSS/TailwindCSS"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">
                          Quyền lợi ứng viên
                        </label>
                        <span className="text-[10px] text-slate-400 block mb-2 ml-0.5">
                          (Mỗi dòng viết một quyền lợi)
                        </span>
                        <textarea
                          name="benefits"
                          rows="4"
                          placeholder="Ví dụ:&#10;Lương tháng 13 đầy đủ&#10;Bảo hiểm sức khỏe cao cấp"
                          value={formData.benefits}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 focus:border-[#9346F5] focus:ring-1 focus:ring-[#9346F5] px-4 py-2.5 rounded-xl outline-hidden text-sm"
                        />
                      </div>
                    </div>

                    {/* Chip Tag input for skills */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-0.5">
                        Kỹ năng yêu cầu
                      </label>
                      <span className="text-[10px] text-slate-400 block mb-2 ml-0.5">
                        Nhập từ khóa và nhấn **Enter** hoặc dấu phẩy để tạo chip
                        tag.
                      </span>
                      <div className="flex flex-wrap gap-2 p-2.5 border border-slate-200 rounded-xl focus-within:border-[#9346F5] focus-within:ring-1 focus-within:ring-[#9346F5] bg-white items-center min-h-[46px]">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 animate-fadeIn"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(idx)}
                              className="text-slate-400 hover:text-red-500 font-extrabold focus:outline-hidden cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder={
                            formData.tags.length === 0
                              ? "Ví dụ: React, Figma, SQL"
                              : ""
                          }
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          className="flex-1 outline-hidden text-sm bg-transparent min-w-[120px]"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              resetForm();
                              setActiveTab("jobs");
                            }}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                          >
                            Hủy chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePostJob(e, formData.status)}
                            disabled={formLoading}
                            className={`text-white px-6 py-2.5 rounded-xl shadow-xs font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                              formLoading
                                ? "bg-purple-300 cursor-not-allowed"
                                : "bg-[#9346F5] hover:bg-[#7e39d1]"
                            }`}
                          >
                            {formLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handlePostJob(e, "Draft")}
                            disabled={formLoading}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer bg-white"
                          >
                            Lưu nháp
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePostJob(e, "Active")}
                            disabled={formLoading}
                            className={`text-white px-6 py-2.5 rounded-xl shadow-xs font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                              formLoading
                                ? "bg-purple-300 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-850"
                            }`}
                          >
                            {formLoading
                              ? "Đang đăng..."
                              : "Đăng tin tuyển dụng"}
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Posted Jobs */}
              {activeTab === "jobs" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Quản lý tin tuyển dụng
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Cập nhật thông tin, lọc trạng thái hoặc xóa tin hết hạn.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resetForm();
                        setActiveTab("post");
                      }}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#9346F5] transition-all cursor-pointer shadow-sm"
                    >
                      <PlusCircleIcon className="w-4 h-4" /> Đăng tin mới
                    </button>
                  </div>

                  {/* Clean Status Filters */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "All", label: "Tất cả" },
                      { id: "Active", label: "Đang hoạt động" },
                      { id: "Draft", label: "Bản nháp" },
                      { id: "Expired", label: "Đã hết hạn" },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        onClick={() => setJobStatusFilter(filt.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          jobStatusFilter === filt.id
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-950"
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  {filteredJobs.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white/50 flex flex-col items-center justify-center">
                      <p className="text-sm font-medium">
                        Không tìm thấy tin tuyển dụng nào thuộc trạng thái này.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hãy đăng tin tuyển dụng mới để bắt đầu tìm kiếm ứng
                        viên.
                      </p>
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveTab("post");
                        }}
                        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-[#9346F5] transition-all cursor-pointer shadow-sm"
                      >
                        Tạo tin tuyển dụng đầu tiên
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredJobs.map((job) => {
                        const status = getJobStatus(job);
                        const appCount = getAppCountForJob(job._id);
                        return (
                          <div
                            key={job._id}
                            className="p-6 border border-slate-150/80 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-slate-300 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-slate-900 text-base">
                                  {job.title}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider
                                  ${status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100/60" : ""}
                                  ${status === "Draft" ? "bg-slate-50 text-slate-550 border-slate-200" : ""}
                                  ${status === "Expired" ? "bg-red-50 text-red-700 border-red-100/60" : ""}
                                `}
                                >
                                  {status === "Active" && "Hoạt động"}
                                  {status === "Draft" && "Nháp"}
                                  {status === "Expired" && "Hết hạn"}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold">
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />{" "}
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                  <CurrencyDollarIcon className="w-3.5 h-3.5 text-emerald-600/80" />{" "}
                                  {job.salary}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3.5 h-3.5 text-slate-300" />{" "}
                                  {new Date(job.createdAt).toLocaleDateString(
                                    "vi-VN",
                                  )}
                                </span>
                                {job.expiryDate && (
                                  <span className="flex items-center gap-1 text-slate-500 font-semibold border-l pl-3 border-slate-200">
                                    Hạn nộp:{" "}
                                    {new Date(
                                      job.expiryDate,
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                )}
                              </div>

                              {job.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {job.tags.map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold border border-slate-100"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <button
                                onClick={() => {
                                  setSelectedJobFilter(job._id);
                                  setActiveTab("applications");
                                }}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:border-[#9346F5] hover:text-[#9346F5] cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                              >
                                {appCount} ứng viên
                              </button>
                              <button
                                onClick={() => handleStartEdit(job)}
                                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-all"
                                title="Sửa tin tuyển dụng"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job._id)}
                                className="p-2 rounded-lg border border-red-50 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                                title="Xóa tin tuyển dụng"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Applications */}
              {activeTab === "applications" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Hồ sơ ứng tuyển đã nhận
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Cập nhật trạng thái xử lý hồ sơ chi tiết cho từng vị
                        trí.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <FunnelIcon className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedJobFilter}
                        onChange={(e) => setSelectedJobFilter(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 outline-hidden text-xs font-bold bg-white text-slate-600 focus:border-[#9346F5] cursor-pointer min-w-[200px]"
                      >
                        <option value="">Tất cả tin tuyển dụng</option>
                        {jobs.map((job) => (
                          <option key={job._id} value={job._id}>
                            {job.title}
                          </option>
                        ))}
                      </select>
                      {selectedJobFilter && (
                        <button
                          onClick={() => setSelectedJobFilter("")}
                          className="text-[10px] text-red-500 hover:underline font-bold"
                        >
                          Xóa lọc
                        </button>
                      )}
                    </div>
                  </div>

                  {groupedApplications.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white/50 flex flex-col items-center justify-center">
                      <p className="text-sm font-medium">
                        Hộp thư ứng tuyển hiện tại đang trống.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Các hồ sơ ứng tuyển nhận được sẽ hiển thị và gom nhóm ở
                        đây.
                      </p>
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveTab("post");
                        }}
                        className="mt-4 px-4 py-2 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:border-[#9346F5] hover:text-[#9346F5] transition-all cursor-pointer bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      >
                        Đăng tin tuyển dụng mới
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {groupedApplications.map((group) => (
                        <div
                          key={group.jobId}
                          className="bg-white rounded-xl border border-slate-150/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden"
                        >
                          <div className="bg-slate-50/40 px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                              <h3 className="font-bold text-slate-850 text-sm tracking-tight">
                                {group.jobTitle}
                              </h3>
                              <span className="bg-slate-100 text-slate-600 border border-slate-200/50 text-[10px] font-bold px-2 py-0.5 rounded-md ml-1">
                                {group.apps.length} ứng viên
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                                  <th className="py-3 px-6">Ứng viên</th>
                                  <th className="py-3 px-6">Liên hệ</th>
                                  <th className="py-3 px-6">Thời gian nộp</th>
                                  <th className="py-3 px-6 text-center">
                                    Trạng thái
                                  </th>
                                  <th className="py-3 px-6 text-right">
                                    Thao tác
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {group.apps.map((app) => (
                                  <tr
                                    key={app._id}
                                    className="hover:bg-slate-50/10 transition-colors"
                                  >
                                    <td className="py-4 px-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs border border-slate-150">
                                          {app.fullName.charAt(0)}
                                        </div>
                                        <div className="font-bold text-slate-850 text-xs">
                                          {app.fullName}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6 text-xs text-slate-500 space-y-0.5">
                                      <div className="font-semibold text-slate-700">
                                        {app.email}
                                      </div>
                                      {app.phone && (
                                        <div className="text-[10px] text-slate-450 font-medium">
                                          {app.phone}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-4 px-6 text-xs text-slate-400 font-semibold">
                                      {new Date(
                                        app.createdAt,
                                      ).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold leading-normal border uppercase tracking-wider
                                        ${app.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-100/60" : ""}
                                        ${app.status === "Reviewing" ? "bg-purple-50 text-purple-700 border border-purple-100/60" : ""}
                                        ${app.status === "Interview" ? "bg-sky-50 text-sky-700 border border-sky-100/60" : ""}
                                        ${app.status === "Offered" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/60" : ""}
                                        ${app.status === "Rejected" ? "bg-red-50 text-red-700 border border-red-100/60" : ""}
                                        ${app.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/60" : ""}
                                      `}
                                      >
                                        {app.status === "Pending" && "Mới"}
                                        {app.status === "Reviewing" &&
                                          "Đang xem xét"}
                                        {app.status === "Interview" &&
                                          "Phỏng vấn"}
                                        {app.status === "Offered" &&
                                          "Mời nhận việc"}
                                        {app.status === "Rejected" && "Từ chối"}
                                        {app.status === "Accepted" &&
                                          "Chấp nhận"}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <div className="flex items-center justify-end gap-3.5">
                                        <button
                                          onClick={() =>
                                            navigate(
                                              `/resume/view/${app.resumeId}`,
                                            )
                                          }
                                          className="text-xs font-bold text-[#9346F5] hover:underline cursor-pointer"
                                        >
                                          Xem CV
                                        </button>
                                        <select
                                          value={app.status}
                                          onChange={(e) =>
                                            handleUpdateStatus(
                                              app._id,
                                              e.target.value,
                                            )
                                          }
                                          className="border border-slate-200 rounded-lg px-2 py-1 outline-hidden text-[11px] font-semibold bg-white text-slate-700 focus:border-[#9346F5] cursor-pointer"
                                        >
                                          <option value="Pending">Mới</option>
                                          <option value="Reviewing">
                                            Đang xem xét
                                          </option>
                                          <option value="Interview">
                                            Phỏng vấn
                                          </option>
                                          <option value="Offered">
                                            Mời nhận việc
                                          </option>
                                          <option value="Rejected">
                                            Từ chối
                                          </option>
                                        </select>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
