import React, { useState, useEffect } from "react";
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
  CheckIcon,
  XMarkIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useToastContext } from "../Components/Toast.jsx";
import { useNavigate } from "react-router-dom";

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToastContext();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    benefits: "",
    tags: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch my jobs
      const jobsRes = await fetch("/api/jobs/my", { credentials: "include" });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      // Fetch applications
      const appsRes = await fetch("/api/jobs/applications", { credentials: "include" });
      const appsData = await appsRes.json();
      if (appsRes.ok) setApplications(appsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu doanh nghiệp:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.salary || !formData.location || !formData.description) {
      showToast("Vui lòng điền các thông tin bắt buộc", "error");
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Đăng tin tuyển dụng thành công!", "success");
        setFormData({
          title: "",
          salary: "",
          location: "",
          type: "Full-time",
          description: "",
          requirements: "",
          benefits: "",
          tags: "",
        });
        setActiveTab("jobs");
        fetchDashboardData();
      } else {
        showToast(data.message || "Lỗi khi đăng tuyển", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối đến máy chủ", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Toàn bộ hồ sơ ứng tuyển liên quan cũng sẽ bị xóa.")) return;
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
    } catch (err) {
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
    } catch (err) {
      showToast("Lỗi kết nối đến máy chủ", "error");
    }
  };

  const pendingApps = applications.filter((a) => a.status === "Pending");
  const interviewApps = applications.filter((a) => a.status === "Interview");
  const acceptedApps = applications.filter((a) => a.status === "Accepted");

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100/60 sticky top-6">
            <div className="flex items-center gap-3.5 mb-8 px-2">
              <div className="w-10 h-10 bg-[#9346F5] rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-[#9346F5]/20">
                E
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">Kênh Tuyển Dụng</h2>
                <p className="text-xs text-gray-400 font-medium">Nhà tuyển dụng</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              {[
                { id: "overview", label: "Tổng quan", icon: InboxStackIcon },
                { id: "post", label: "Đăng tuyển dụng", icon: PlusCircleIcon },
                { id: "jobs", label: "Tin đã đăng", icon: BriefcaseIcon },
                { id: "applications", label: "Hồ sơ ứng tuyển", icon: UserGroupIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#9346F5] text-white shadow-lg shadow-[#9346F5]/25"
                        : "text-gray-500 hover:bg-purple-50 hover:text-black"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {tab.label}
                    {tab.id === "applications" && pendingApps.length > 0 && (
                      <span className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? "bg-white text-[#9346F5]" : "bg-red-500 text-white"
                      }`}>
                        {pendingApps.length}
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
            <div className="bg-white rounded-3xl p-16 shadow-xs border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9346F5] border-t-transparent mb-4"></div>
              <p className="text-gray-500 font-bold text-sm">Đang tải dữ liệu doanh nghiệp...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-6 sm:p-8 rounded-3xl shadow-sm">
                    <h1 className="text-2xl font-black text-[#9346F5]">Chào mừng Nhà tuyển dụng!</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">
                      Quản lý các tin tuyển dụng và tìm kiếm những ứng viên tài năng nhất cho doanh nghiệp của bạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Tin đã đăng",
                        value: jobs.length,
                        desc: "Tổng số tin đang hoạt động",
                        icon: BriefcaseIcon,
                        color: "from-violet-500 to-indigo-500 shadow-violet-200",
                      },
                      {
                        title: "CV ứng tuyển",
                        value: applications.length,
                        desc: "Tổng lượt ứng tuyển nhận được",
                        icon: UserGroupIcon,
                        color: "from-fuchsia-500 to-pink-500 shadow-fuchsia-200",
                      },
                      {
                        title: "Hồ sơ mới",
                        value: pendingApps.length,
                        desc: "CV đang chờ xem xét",
                        icon: DocumentArrowUpIcon,
                        color: "from-amber-500 to-orange-500 shadow-amber-200",
                      },
                    ].map((stat, i) => {
                      const Icon = stat.icon;
                      return (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.015)] flex justify-between items-start">
                          <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                            <h3 className="text-4.5xl font-black text-gray-900 mt-2 tracking-tight">{stat.value}</h3>
                            <p className="text-[11px] text-gray-400 mt-1 font-medium">{stat.desc}</p>
                          </div>
                          <div className={`p-3 rounded-2xl bg-linear-to-br ${stat.color} text-white shadow-lg`}>
                            <Icon className="size-6" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recents */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-gray-900">Hồ sơ ứng tuyển mới nhận gần đây</h2>
                      <button onClick={() => setActiveTab("applications")} className="text-xs font-bold text-[#9346F5] hover:text-[#7d39d1]">
                        Xem tất cả
                      </button>
                    </div>
                    {pendingApps.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 text-sm font-semibold">
                        Không có hồ sơ mới cần duyệt
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {pendingApps.slice(0, 5).map((app, i) => (
                          <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#9346F5] font-black text-[13px] border border-purple-100">
                                {app.fullName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{app.fullName}</h4>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">Ứng tuyển: <span className="text-[#9346F5] font-semibold">{app.jobId?.title}</span></p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => navigate(`/resume/view/${app.resumeId}`)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:border-[#9346F5] hover:text-[#9346F5] flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <EyeIcon className="w-3.5 h-3.5" /> Xem CV
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Post Job Form */}
              {activeTab === "post" && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 sm:p-8 animate-fadeIn">
                  <div className="border-b border-gray-50 pb-5 mb-6">
                    <h2 className="text-lg font-extrabold text-[#9346F5]">Đăng tin tuyển dụng mới</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Thông tin chi tiết giúp thu hút ứng viên chất lượng hơn.</p>
                  </div>

                  <form onSubmit={handlePostJob} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">Tiêu đề công việc <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="title"
                          required
                          placeholder="Ví dụ: Senior Frontend React Developer"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">Mức lương <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="salary"
                          required
                          placeholder="Ví dụ: 15-20 triệu hoặc Thỏa thuận"
                          value={formData.salary}
                          onChange={handleInputChange}
                          className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">Địa điểm làm việc <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="location"
                          required
                          placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">Loại hình làm việc</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm bg-white"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Intern">Intern</option>
                          <option value="Contract">Hợp đồng / Freelance</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">Mô tả công việc <span className="text-red-500">*</span></label>
                      <textarea
                        name="description"
                        rows="4"
                        required
                        placeholder="Mô tả tóm tắt các trách nhiệm, công việc chính..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Yêu cầu công việc</label>
                      <span className="text-[10px] text-gray-400 block mb-2 ml-1">(Mỗi yêu cầu viết ở một dòng mới)</span>
                      <textarea
                        name="requirements"
                        rows="3"
                        placeholder="Ví dụ:&#10;Tối thiểu 2 năm kinh nghiệm ReactJS&#10;Sử dụng tốt CSS/TailwindCSS"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Quyền lợi ứng viên</label>
                      <span className="text-[10px] text-gray-400 block mb-2 ml-1">(Mỗi quyền lợi viết ở một dòng mới)</span>
                      <textarea
                        name="benefits"
                        rows="3"
                        placeholder="Ví dụ:&#10;Lương tháng 13 đầy đủ&#10;Bảo hiểm sức khỏe cao cấp"
                        value={formData.benefits}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Thẻ từ khóa (Tags)</label>
                      <span className="text-[10px] text-gray-400 block mb-2 ml-1">(Các từ khóa ngăn cách nhau bởi dấu phẩy)</span>
                      <input
                        type="text"
                        name="tags"
                        placeholder="Ví dụ: React, Figma, Tiếng Anh"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-2xl focus:border-[#9346F5] outline-hidden text-sm"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-end">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className={`text-white px-8 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
                          formLoading ? "bg-purple-300 cursor-not-allowed" : "bg-[#9346F5] hover:bg-[#7e39d1] shadow-purple-200"
                        }`}
                      >
                        {formLoading ? "Đang đăng..." : "Đăng tuyển dụng"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Posted Jobs */}
              {activeTab === "jobs" && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 sm:p-8 animate-fadeIn">
                  <div className="border-b border-gray-50 pb-5 mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#9346F5]">Danh sách tin đã tuyển</h2>
                      <p className="text-xs text-gray-400 font-medium mt-1">Xem chi tiết hoặc gỡ bỏ tin tuyển dụng.</p>
                    </div>
                    <button onClick={() => setActiveTab("post")} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-950 text-white text-xs font-bold hover:bg-[#9346F5] transition-all cursor-pointer shadow-md shadow-slate-950/10">
                      <PlusCircleIcon className="w-4 h-4" /> Đăng tin mới
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="p-16 text-center text-gray-400 text-sm font-semibold flex flex-col items-center justify-center">
                      <BriefcaseIcon className="w-12 h-12 text-gray-200 mb-3" />
                      Doanh nghiệp của bạn chưa đăng tin tuyển dụng nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {jobs.map((job) => (
                        <div key={job._id} className="p-5 border border-gray-100 hover:border-[#9346F5]/45 hover:shadow-xs rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                          <div className="space-y-2">
                            <h3 className="font-extrabold text-gray-900 text-base">{job.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-3.5 h-3.5 text-gray-300" /> {job.location}
                              </span>
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <CurrencyDollarIcon className="w-3.5 h-3.5 text-emerald-400" /> {job.salary}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 text-gray-300" /> {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            {job.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {job.tags.map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => navigate(`/jobs/${job._id}`)}
                              className="px-3 py-1.5 rounded-lg border border-gray-100 hover:border-violet-300 text-xs font-bold text-[#9346F5] bg-violet-50/50 hover:bg-violet-50 cursor-pointer transition-all"
                            >
                              Xem trang tin
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-2 rounded-lg border border-red-50 text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                              title="Xóa tin tuyển dụng"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Applications */}
              {activeTab === "applications" && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 sm:p-8 animate-fadeIn">
                  <div className="border-b border-gray-50 pb-5 mb-6">
                    <h2 className="text-lg font-extrabold text-[#9346F5]">Hồ sơ ứng tuyển đã nhận</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Đánh giá CV và xếp lịch phỏng vấn ứng viên.</p>
                  </div>

                  {applications.length === 0 ? (
                    <div className="p-16 text-center text-gray-400 text-sm font-semibold flex flex-col items-center justify-center">
                      <InboxStackIcon className="w-12 h-12 text-gray-200 mb-3" />
                      Chưa nhận được hồ sơ ứng tuyển nào.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-slate-50/50">
                            <th className="py-3 px-4 rounded-l-xl">Ứng viên</th>
                            <th className="py-3 px-4">Vị trí</th>
                            <th className="py-3 px-4">Liên hệ</th>
                            <th className="py-3 px-4">Thời gian</th>
                            <th className="py-3 px-4 text-center">Trạng thái</th>
                            <th className="py-3 px-4 text-right rounded-r-xl">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {applications.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-4 font-bold text-gray-900 text-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-purple-50 text-[#9346F5] rounded-xl flex items-center justify-center font-bold text-xs border border-purple-100/50">
                                    {app.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">{app.fullName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-xs font-semibold text-gray-600 max-w-[150px] truncate" title={app.jobId?.title}>
                                {app.jobId?.title || "Công việc đã xóa"}
                              </td>
                              <td className="py-4 px-4 text-xs text-gray-500 space-y-0.5">
                                <div>{app.email}</div>
                                {app.phone && <div className="text-[10px] text-gray-400 font-medium">{app.phone}</div>}
                              </td>
                              <td className="py-4 px-4 text-xs text-gray-400 font-medium">
                                {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold leading-normal
                                  ${app.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : ""}
                                  ${app.status === "Interview" ? "bg-sky-50 text-sky-600 border border-sky-100" : ""}
                                  ${app.status === "Accepted" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : ""}
                                  ${app.status === "Rejected" ? "bg-red-50 text-red-600 border border-red-100" : ""}
                                `}>
                                  {app.status === "Pending" && "Đang chờ"}
                                  {app.status === "Interview" && "Phỏng vấn"}
                                  {app.status === "Accepted" && "Chấp nhận"}
                                  {app.status === "Rejected" && "Từ chối"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => navigate(`/resume/view/${app.resumeId}`)}
                                    className="p-1.5 rounded-lg border border-gray-100 hover:border-[#9346F5] text-gray-500 hover:text-[#9346F5] bg-white transition-all cursor-pointer"
                                    title="Xem chi tiết CV"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  {app.status === "Pending" && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateStatus(app._id, "Interview")}
                                        className="p-1.5 rounded-lg border border-gray-100 hover:border-sky-300 text-sky-600 hover:bg-sky-50 bg-white transition-all cursor-pointer"
                                        title="Hẹn phỏng vấn"
                                      >
                                        <ClockIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(app._id, "Accepted")}
                                        className="p-1.5 rounded-lg border border-gray-100 hover:border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-white transition-all cursor-pointer"
                                        title="Chấp nhận"
                                      >
                                        <CheckIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(app._id, "Rejected")}
                                        className="p-1.5 rounded-lg border border-gray-100 hover:border-red-300 text-red-600 hover:bg-red-50 bg-white transition-all cursor-pointer"
                                        title="Từ chối"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  {app.status === "Interview" && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateStatus(app._id, "Accepted")}
                                        className="p-1.5 rounded-lg border border-gray-100 hover:border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-white transition-all cursor-pointer"
                                        title="Chấp nhận"
                                      >
                                        <CheckIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(app._id, "Rejected")}
                                        className="p-1.5 rounded-lg border border-gray-100 hover:border-red-300 text-red-600 hover:bg-red-50 bg-white transition-all cursor-pointer"
                                        title="Từ chối"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
