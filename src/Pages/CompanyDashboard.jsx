import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import { showToast } from "../utils/toast.js";
import { formatDate } from "../utils/dateTime.js";
import NotificationBell from "../Components/NotificationBell.jsx";

function PortalCard({ children, className = "" }) {
  return <section className={`rounded-[10px] border-[0.5px] border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01)] ${className}`}>{children}</section>;
}

function StatusBadge({ status }) {
  const normalized = status === "Draft" ? "Draft" : status === "Expired" ? "Expired" : "Active";
  const className =
    normalized === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "Draft"
        ? "bg-slate-100 text-slate-600"
        : "bg-red-50 text-red-700";
  const labels = { Active: "Đang tuyển", Draft: "Bản nháp", Expired: "Đã đóng" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{labels[normalized]}</span>;
}

function getJobTypeLabel(type) {
  return {
    "Full-time": "Toàn thời gian",
    "Part-time": "Bán thời gian",
    Remote: "Làm từ xa",
    Hybrid: "Kết hợp",
  }[type] || type;
}

function JobStatusToggle({ isActive, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? "Đóng bài đăng" : "Mở nhận ứng viên"}
      onClick={onToggle}
      className="inline-flex h-7 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
    >
      <span className={`relative h-5 w-9 rounded-full transition ${isActive ? "bg-violet-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${isActive ? "left-4.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function AppStatusBadge({ status }) {
  const map = {
    Pending: "bg-amber-50 text-amber-700",
    Reviewing: "bg-violet-50 text-violet-700",
    Interview: "bg-sky-50 text-sky-700",
    Offered: "bg-emerald-50 text-emerald-700",
    Accepted: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-red-50 text-red-700",
  };
  const labels = {
    Pending: "Chờ duyệt",
    Reviewing: "Đang xem xét",
    Interview: "Phỏng vấn",
    Offered: "Đã đề nghị",
    Accepted: "Đã nhận",
    Rejected: "Từ chối",
  };
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>{labels[status] || "Chờ duyệt"}</span>;
}

const applicationStatusOptions = [
  { value: "Pending", label: "Chờ duyệt", dot: "bg-amber-500" },
  { value: "Reviewing", label: "Đang xem xét", dot: "bg-violet-500" },
  { value: "Interview", label: "Phỏng vấn", dot: "bg-sky-500" },
  { value: "Offered", label: "Đã đề nghị", dot: "bg-emerald-500" },
  { value: "Rejected", label: "Từ chối", dot: "bg-rose-500" },
];

function ApplicationStatusSelect({ value = "Pending", onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = applicationStatusOptions.find((option) => option.value === value) || applicationStatusOptions[0];

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={open} className="flex h-8 w-full items-center justify-between rounded-[8px] border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100">
        <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${selected.dot}`} />{selected.label}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute right-0 top-[36px] z-40 w-full min-w-[150px] overflow-hidden rounded-[8px] border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/60">
          {applicationStatusOptions.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[11px] font-semibold transition ${value === option.value ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyOverview({ currentUser, stats, jobs, applications, getJobStatus, getAppCountForJob, setActiveTab, navigate, onViewCoverLetter }) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const pipelineSummary = useMemo(() => {
    const groups = [
      { label: "Chờ duyệt", count: applications.filter((app) => !app.status || app.status === "Pending").length, color: "#7c3aed" },
      { label: "Đang xem xét", count: applications.filter((app) => app.status === "Reviewing").length, color: "#22a06b" },
      { label: "Phỏng vấn", count: applications.filter((app) => app.status === "Interview").length, color: "#f59e0b" },
      { label: "Hoàn tất", count: applications.filter((app) => ["Offered", "Accepted", "Rejected"].includes(app.status)).length, color: "#ef5b55" },
    ];

    if (!applications.length) return { groups, gradient: "conic-gradient(#e8e4ec 0 100%)" };

    let cursor = 0;
    const slices = groups.map((group) => {
      const start = cursor;
      cursor += (group.count / applications.length) * 100;
      return `${group.color} ${start}% ${cursor}%`;
    });
    if (cursor < 100) slices.push(`#cbd5e1 ${cursor}% 100%`);
    return { groups, gradient: `conic-gradient(${slices.join(", ")})` };
  }, [applications]);

  const activeJobs = jobs.filter((job) => getJobStatus(job) === "Active").slice(0, 3);
  const statItems = [
    { icon: BriefcaseIcon, label: "Tin đang tuyển", value: stats.activeJobs, delta: "+12%", deltaClass: "bg-emerald-50 text-emerald-700" },
    { icon: DocumentTextIcon, label: "Tổng ứng viên", value: stats.totalApps, delta: "+8%", deltaClass: "bg-emerald-50 text-emerald-700" },
    { icon: CalendarDaysIcon, label: "Phỏng vấn tuần này", value: stats.interviews, delta: "0%", deltaClass: "bg-slate-100 text-slate-500" },
    { icon: FunnelIcon, label: "Chờ duyệt", value: stats.pending, delta: stats.pending ? `+${stats.pending}` : "0", deltaClass: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-black tracking-[-0.035em] text-[#24192d] sm:text-[26px]">Chào mừng trở lại, {currentUser?.fullName || currentUser?.username || "Nhà tuyển dụng"}</h1>
          <p className="mt-0.5 text-[12px] font-medium text-[#746b7b]">Tổng quan hoạt động tuyển dụng hôm nay.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative hidden sm:block">
            <span className="sr-only">Tìm kiếm</span>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-9 w-48 rounded-[8px] border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100" placeholder="Tìm kiếm..." />
          </label>
          <NotificationBell
            isOpen={notificationOpen}
            onToggle={() => setNotificationOpen((current) => !current)}
            onClose={() => setNotificationOpen(false)}
          />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <PortalCard key={item.label} className="flex min-h-[108px] flex-col justify-between p-3">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-[7px] bg-violet-50 text-violet-700"><Icon className="h-[18px] w-[18px]" /></span>
                <span className={`rounded-[6px] px-2 py-1 text-[11px] font-bold ${item.deltaClass}`}>{item.delta}</span>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-[#746b7b]">{item.label}</p>
                <p className="mt-1 text-[25px] font-black leading-none tracking-[-0.035em] text-[#24192d]">{item.value}</p>
              </div>
            </PortalCard>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <PortalCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-[14px] font-bold text-slate-800">Ứng viên gần đây</h2>
            <button type="button" onClick={() => setActiveTab("applications")} className="text-[11px] font-semibold text-violet-600 hover:text-violet-800">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                <tr><th className="px-5 py-2.5">Ứng viên</th><th className="px-3 py-2.5">Vị trí ứng tuyển</th><th className="px-3 py-2.5">Trạng thái</th><th className="px-5 py-2.5 text-right">Hành động</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => (
                  <tr key={app._id} className="transition hover:bg-violet-50/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">{app.fullName?.charAt(0)?.toUpperCase() || "U"}</div>
                        <div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{app.fullName || "Ứng viên"}</p><p className="max-w-[170px] truncate text-[10px] text-slate-400">{app.email}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-medium text-slate-600">{app.jobId?.title || "Tin đã xóa"}</td>
                    <td className="px-3 py-2.5"><AppStatusBadge status={app.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => app.resumeId && navigate(`/resume/view/${app.resumeId}`)} disabled={!app.resumeId} className="rounded-[7px] bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40">Xem CV</button>
                        {app.coverLetter && <button type="button" onClick={() => onViewCoverLetter(app)} className="rounded-[7px] border border-sky-200 px-2 py-1 text-[10px] font-bold text-sky-700 transition hover:bg-sky-50">Thư ứng tuyển</button>}
                        <button type="button" onClick={() => (app.candidateId?._id || app.candidateId) && navigate(`/profile/${app.candidateId?._id || app.candidateId}`)} disabled={!(app.candidateId?._id || app.candidateId)} className="rounded-[7px] border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40">Trang cá nhân</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications.length === 0 && <div className="p-10 text-center text-[13px] font-medium text-slate-400">Chưa có hồ sơ ứng tuyển.</div>}
          </div>
        </PortalCard>

        <PortalCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-bold text-slate-800">Tổng quan tuyển dụng</h2>
            <span className="rounded-[7px] border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">Toàn thời gian</span>
          </div>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-[120px] w-[120px] shrink-0 rounded-full" style={{ background: pipelineSummary.gradient }}>
              <div className="absolute inset-[21px] grid place-items-center rounded-full bg-white text-center"><div><strong className="text-[18px] leading-none text-slate-800">{applications.length}</strong><p className="mt-0.5 text-[9px] font-semibold text-slate-500">Ứng viên</p></div></div>
            </div>
            <div className="w-full space-y-2.5">
              {pipelineSummary.groups.map((group) => {
                const percent = applications.length ? Math.round((group.count / applications.length) * 100) : 0;
                return <div key={group.label} className="flex items-center justify-between gap-4 text-[11px]"><span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />{group.label}</span><strong className="text-slate-700">{group.count} ({percent}%)</strong></div>;
              })}
            </div>
          </div>
        </PortalCard>
      </section>

      <PortalCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-[14px] font-bold text-slate-800">Vị trí đang tuyển</h2>
          <button type="button" onClick={() => setActiveTab("jobs")} className="text-[11px] font-semibold text-violet-600 hover:text-violet-800">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><tr><th className="px-5 py-2.5">Vị trí</th><th className="px-3 py-2.5">Ứng viên</th><th className="px-3 py-2.5">Ngày đăng</th><th className="px-3 py-2.5">Trạng thái</th><th className="px-5 py-2.5 text-right">Hành động</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {activeJobs.map((job) => (
                <tr key={job._id} className="transition hover:bg-violet-50/30">
                  <td className="px-4 py-2.5"><p className="text-[11px] font-bold text-slate-800">{job.title}</p><p className="mt-0.5 text-[9px] text-slate-400">{job.type} · {job.location}</p></td>
                  <td className="px-3 py-2.5 text-[11px] font-semibold text-slate-600">{getAppCountForJob(job._id)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500">{formatDate(job.createdAt, "dd/MM/yyyy", "—")}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={getJobStatus(job)} /></td>
                  <td className="px-4 py-2.5 text-right"><button type="button" onClick={() => setActiveTab("jobs")} className="rounded-[7px] border border-violet-200 px-2.5 py-1 text-[10px] font-bold text-violet-700 transition hover:bg-violet-50">Xem chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeJobs.length === 0 && <div className="p-8 text-center text-[13px] font-medium text-slate-400">Chưa có vị trí đang tuyển.</div>}
        </div>
      </PortalCard>
    </div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const confirmDialog = useConfirmDialog();
  const location = useLocation();
  const { currentUser, isAuthChecked, logout } = useAuth();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobStatusFilter, setJobStatusFilter] = useState("All");
  const [selectedJobFilter, setSelectedJobFilter] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    location: "",
    type: "Full-time",
    experience: "Không yêu cầu",
    education: "Không yêu cầu",
    workModel: "Tại văn phòng",
    description: "",
    requirements: "",
    benefits: "",
    tags: [],
    expiryDate: "",
    status: "Active",
  });

  const [companyProfile, setCompanyProfile] = useState({
    fullName: "",
    companyWebsite: "",
    companyDescription: "",
    companySize: "",
    companyIndustry: "",
    address: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (isAuthChecked) {
      if (!currentUser) navigate("/login");
      else if (currentUser.role !== "company") navigate("/MainMenu");
    }
  }, [currentUser, isAuthChecked, navigate]);

  useEffect(() => {
    if (location.state?.activeTab) setActiveTab(location.state.activeTab);
  }, [location.state]);

  useEffect(() => {
    if (!currentUser) return;
    setCompanyProfile({
      fullName: currentUser.fullName || currentUser.username || "",
      companyWebsite: currentUser.companyWebsite || "",
      companyDescription: currentUser.companyDescription || "",
      companySize: currentUser.companySize || "",
      companyIndustry: currentUser.companyIndustry || "",
      address: currentUser.address || "",
      phoneNumber: currentUser.phoneNumber || "",
    });
  }, [currentUser]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const jobsRes = await fetch("/api/jobs/my", { credentials: "include" });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      const appsRes = await fetch("/api/jobs/applications", { credentials: "include" });
      const appsData = await appsRes.json();
      if (appsRes.ok) setApplications(appsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu doanh nghiệp:", error);
      showToast("Không thể tải dữ liệu doanh nghiệp.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getJobStatus = (job) => {
    if (job.status === "Draft") return "Draft";
    if (job.expiryDate && new Date(job.expiryDate) < new Date()) return "Expired";
    return job.status || "Active";
  };

  const getAppCountForJob = (jobId) => applications.filter((app) => app.jobId && (app.jobId._id === jobId || app.jobId === jobId)).length;

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => getJobStatus(job) === "Active").length;
    const totalApps = applications.length;
    const interviews = applications.filter((app) => app.status === "Interview").length;
    const pending = applications.filter((app) => app.status === "Pending").length;
    return { activeJobs, totalApps, interviews, pending };
  }, [jobs, applications]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const statusOk = jobStatusFilter === "All" || getJobStatus(job) === jobStatusFilter;
      const searchOk = !jobSearch || `${job.title} ${job.location} ${job.type}`.toLowerCase().includes(jobSearch.toLowerCase());
      return statusOk && searchOk;
    });
  }, [jobs, jobStatusFilter, jobSearch]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const jobOk = !selectedJobFilter || app.jobId?._id === selectedJobFilter || app.jobId === selectedJobFilter;
      const searchOk = !candidateSearch || `${app.fullName} ${app.email} ${app.jobId?.title || ""}`.toLowerCase().includes(candidateSearch.toLowerCase());
      return jobOk && searchOk;
    });
  }, [applications, selectedJobFilter, candidateSearch]);

  const resetForm = () => {
    setFormData({
      title: "",
      salary: "",
      location: "",
      type: "Full-time",
      experience: "Không yêu cầu",
      education: "Không yêu cầu",
      workModel: "Tại văn phòng",
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setCompanyProfile((prev) => ({ ...prev, [name]: value }));
  };

  const resetCompanyProfile = () => {
    setCompanyProfile({
      fullName: currentUser?.fullName || currentUser?.username || "",
      companyWebsite: currentUser?.companyWebsite || "",
      companyDescription: currentUser?.companyDescription || "",
      companySize: currentUser?.companySize || "",
      companyIndustry: currentUser?.companyIndustry || "",
      address: currentUser?.address || "",
      phoneNumber: currentUser?.phoneNumber || "",
    });
  };

  const handleTagKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const cleanTag = tagInput.trim().replace(/,$/, "");
      if (cleanTag && !formData.tags.includes(cleanTag)) setFormData((prev) => ({ ...prev, tags: [...prev.tags, cleanTag] }));
      setTagInput("");
    }
  };

  const handlePostJob = async (event, submitStatus) => {
    if (event) event.preventDefault();
    if (!formData.title || !formData.salary || !formData.location || !formData.description) {
      showToast("Vui lòng điền các thông tin bắt buộc (*)", "error");
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch(isEditing ? `/api/jobs/${editingJobId}` : "/api/jobs", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, status: submitStatus || formData.status || "Active" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Lỗi khi lưu tin", "error");
        return;
      }
      showToast(isEditing ? "Cập nhật tin tuyển dụng thành công!" : "Đăng tin tuyển dụng thành công!", "success");
      resetForm();
      setActiveTab("jobs");
      fetchDashboardData();
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartEdit = (job) => {
    setFormData({
      title: job.title || "",
      salary: job.salary || "",
      location: job.location || "",
      type: ["Remote", "Hybrid"].includes(job.type) ? "Full-time" : job.type || "Full-time",
      experience: job.experience || "Không yêu cầu",
      education: job.education || "Không yêu cầu",
      workModel: job.workModel || (job.type === "Remote" ? "Làm từ xa" : job.type === "Hybrid" ? "Kết hợp" : "Tại văn phòng"),
      description: job.description || "",
      requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : job.requirements || "",
      benefits: Array.isArray(job.benefits) ? job.benefits.join("\n") : job.benefits || "",
      tags: job.tags || [],
      expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().split("T")[0] : "",
      status: job.status || "Active",
    });
    setIsEditing(true);
    setEditingJobId(job._id);
    setActiveTab("post");
  };

  const handleJobStatusToggle = async (job) => {
    const nextStatus = job.status === "Active" ? "Expired" : "Active";
    try {
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Không thể thay đổi trạng thái tin tuyển dụng.", "error");
        return false;
      }

      setFormData((previous) => String(job._id) === String(editingJobId) ? { ...previous, status: nextStatus } : previous);
      showToast(nextStatus === "Active" ? "Tin tuyển dụng đang nhận ứng viên." : "Tin tuyển dụng đã được đóng.", "success");
      fetchDashboardData();
      return true;
    } catch {
      showToast("Lỗi kết nối đến máy chủ.", "error");
      return false;
    }
  };

  const handleRecruitForJob = (jobId) => {
    setSelectedJobFilter(jobId);
    setActiveTab("applications");
  };

  const handleDeleteJob = async (jobId) => {
    if (!(await confirmDialog("Bạn có chắc chắn muốn xóa tin tuyển dụng này?"))) return false;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        showToast("Xóa tin tuyển dụng thành công!", "info");
        fetchDashboardData();
        return true;
      }
      return false;
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
      return false;
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
        showToast("Đã cập nhật trạng thái hồ sơ!", "success");
        fetchDashboardData();
      }
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    }
  };

  const handleSaveCompanyProfile = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(companyProfile),
      });
      if (res.ok) showToast("Đã lưu hồ sơ doanh nghiệp!", "success");
      else showToast("Không thể lưu hồ sơ doanh nghiệp.", "error");
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      logout();
      navigate("/login");
    }
  };

  if (!isAuthChecked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--page-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-700 border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Tổng quan", icon: Squares2X2Icon },
    { id: "jobs", label: "Quản lý tuyển dụng", icon: BriefcaseIcon },
    { id: "applications", label: "Duyệt ứng viên", icon: UserGroupIcon },
    { id: "messages", label: "Tin nhắn", icon: ChatBubbleLeftRightIcon },
    { id: "profile", label: "Hồ sơ doanh nghiệp", icon: BuildingOffice2Icon },
  ];

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-[#24192d]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[212px] flex-col border-r border-violet-100 bg-[#f6eafa] px-3 py-5 lg:flex">
        <div className="flex items-center gap-3 px-1">
          <img src="/RabbitCV.png" alt="RabbitCV" className="h-9 w-9 rounded-[9px] bg-white object-contain p-1 shadow-sm" />
          <div>
            <h1 className="text-[18px] font-black leading-5 tracking-[-0.04em] text-violet-700">RabbitCV<br />Business</h1>
            <p className="mt-0.5 text-[10px] font-semibold text-[#665d70]">Cổng nhà tuyển dụng</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setActiveTab("post");
          }}
          className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-violet-700 text-[12px] font-bold text-white shadow-sm transition hover:bg-violet-800"
        >
          <PlusIcon className="h-4 w-4" />
          Đăng tin tuyển dụng
        </button>

        <nav className="mt-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => item.id === "messages" ? navigate("/Message") : setActiveTab(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold transition ${
                  active ? "bg-violet-600 text-white shadow-sm" : "text-[#665d70] hover:bg-violet-100 hover:text-violet-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-violet-100 pt-3">
          <button className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold text-[#665d70] hover:bg-violet-100">
            <QuestionMarkCircleIcon className="h-[18px] w-[18px]" />
            Trung tâm trợ giúp
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[12px] font-bold text-[#665d70] hover:bg-violet-100 hover:text-red-600">
            <ArrowRightStartOnRectangleIcon className="h-[18px] w-[18px]" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 lg:ml-[212px] lg:px-6">
        <div className="mx-auto w-full max-w-[1120px]">
          {loading ? (
            <PortalCard className="grid min-h-[340px] place-items-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-700 border-t-transparent" />
                <p className="mt-2 text-[11px] font-semibold text-[#665d70]">Đang tải dữ liệu doanh nghiệp...</p>
              </div>
            </PortalCard>
          ) : (
            <>
              {activeTab === "overview" && (
                <CompanyOverview
                  currentUser={currentUser}
                  stats={stats}
                  jobs={jobs}
                  applications={applications}
                  getJobStatus={getJobStatus}
                  getAppCountForJob={getAppCountForJob}
                  setActiveTab={setActiveTab}
                  navigate={navigate}
                  onViewCoverLetter={setSelectedCoverLetter}
                />
              )}

              {activeTab === "overview-legacy" && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-[30px] font-black tracking-[-0.05em] text-[#24192d]">Welcome back, {currentUser?.fullName || currentUser?.username || "Recruiter"}.</h1>
                      <p className="mt-1 text-base font-medium text-[#665d70]">Here is an overview of your recruitment pipeline today.</p>
                    </div>
                    <div className="hidden gap-3 sm:flex">
                      <button className="grid h-11 w-11 place-items-center rounded-full border border-violet-100 bg-white text-[#665d70]"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                      <button className="relative grid h-11 w-11 place-items-center rounded-full border border-violet-100 bg-white text-[#665d70]"><BellIcon className="h-5 w-5" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-violet-700" /></button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      [BriefcaseIcon, "Active Jobs", stats.activeJobs, "↑ 12%"],
                      [DocumentTextIcon, "Total Applications", stats.totalApps, "↑ 8%"],
                      [CalendarDaysIcon, "Interviews This Week", stats.interviews, "− 0%"],
                      [FunnelIcon, "Pending Review", stats.pending, "new"],
                    ].map(([Icon, label, value, delta]) => (
                      <PortalCard key={label} className="flex min-h-[126px] flex-col justify-between p-4">
                        <div className="flex items-start justify-between">
                          <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-slate-100 text-violet-700"><Icon className="h-5 w-5" /></span>
                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{delta}</span>
                        </div>
                        <p className="mt-3 text-[12px] font-black uppercase tracking-wide text-[#665d70]">{label}</p>
                        <h2 className="mt-1 text-[30px] font-black tracking-[-0.06em] text-[#24192d]">{value}</h2>
                      </PortalCard>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <PortalCard className="overflow-hidden">
                      <div className="flex items-center justify-between border-b-[0.5px] border-slate-200/80 bg-slate-50/20 px-6 py-4">
                        <h2 className="text-[16px] font-bold text-slate-800">Latest Applications</h2>
                        <button onClick={() => setActiveTab("applications")} className="text-[12px] font-semibold text-violet-600 hover:text-violet-800">View all</button>
                      </div>
                      <div className="divide-y divide-violet-100">
                        {applications.slice(0, 4).map((app) => (
                          <div key={app._id} className="flex items-center justify-between gap-4 px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{app.fullName?.charAt(0) || "U"}</div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-800">{app.fullName}</p>
                        <p className="text-[11px] font-medium text-slate-400">{app.jobId?.title || "Tin tuyển dụng đã xóa"}</p>
                              </div>
                            </div>
                            <AppStatusBadge status={app.status} />
                          </div>
                        ))}
                        {applications.length === 0 && <div className="p-10 text-center text-sm font-medium text-slate-400">Chưa có hồ sơ ứng tuyển.</div>}
                      </div>
                    </PortalCard>
                    <PortalCard className="p-4">
                      <h2 className="text-[16px] font-bold text-slate-800">Tóm tắt tuyển dụng</h2>
                      <div className="mt-4 space-y-4 text-sm">
                        <div className="flex justify-between"><span className="text-[#665d70]">Tất cả việc làm</span><strong>{jobs.length}</strong></div>
                        <div className="flex justify-between"><span className="text-[#665d70]">Bản nháp</span><strong>{jobs.filter((j) => getJobStatus(j) === "Draft").length}</strong></div>
                        <div className="flex justify-between"><span className="text-[#665d70]">Đã đóng</span><strong>{jobs.filter((j) => getJobStatus(j) === "Expired").length}</strong></div>
                        <button onClick={() => setActiveTab("jobs")} className="mt-2 w-full rounded-[10px] bg-violet-700 py-2.5 text-sm font-bold text-white">Quản lý việc làm</button>
                      </div>
                    </PortalCard>
                  </div>
                </div>
              )}

              {activeTab === "jobs" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h1 className="text-[26px] font-black tracking-[-0.04em]">Quản lý tuyển dụng</h1>
                      <p className="mt-0.5 text-[13px] text-[#665d70]">Theo dõi tin đang tuyển, bản nháp và tin đã đóng.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#665d70]" />
                        <input value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} placeholder="Tìm việc làm..." className="h-9 w-56 rounded-[9px] border-0 bg-slate-100 pl-10 pr-3 text-[12px] font-semibold outline-none focus:ring-2 focus:ring-violet-200" />
                      </div>
                      <button className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[#665d70]"><FunnelIcon className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <PortalCard className="overflow-hidden">
                    <div className="flex gap-4 border-b-[0.5px] border-slate-200/80 px-3.5 pt-2.5">
                      {[
                        ["All", `Tất cả (${jobs.length})`],
                        ["Active", `Đang tuyển (${jobs.filter((j) => getJobStatus(j) === "Active").length})`],
                        ["Draft", `Bản nháp (${jobs.filter((j) => getJobStatus(j) === "Draft").length})`],
                        ["Expired", `Đã đóng (${jobs.filter((j) => getJobStatus(j) === "Expired").length})`],
                      ].map(([id, label]) => (
                        <button key={id} onClick={() => setJobStatusFilter(id)} className={`border-b-2 pb-2 text-[11px] font-bold ${jobStatusFilter === id ? "border-violet-700 text-violet-700" : "border-transparent text-[#665d70]"}`}>{label}</button>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px] text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-[#665d70]">
                          <tr><th className="px-3.5 py-2">Tên công việc</th><th>Trạng thái</th><th>Địa điểm</th><th>Ngày đăng</th><th>Ứng viên</th><th className="pr-3.5 text-right">Thao tác</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredJobs.map((job) => (
                            <tr key={job._id} className="hover:bg-violet-50/30">
                              <td className="px-3.5 py-2.5"><p className="text-[12px] font-black">{job.title}</p><p className="text-[9px] font-semibold text-[#665d70]">{getJobTypeLabel(job.type)} • {job.salary}</p></td>
                              <td><StatusBadge status={getJobStatus(job)} /></td>
                              <td className="text-[11px] font-semibold text-[#665d70]">{job.location}</td>
                              <td className="text-[11px] font-semibold text-[#665d70]">{formatDate(job.createdAt)}</td>
                              <td><button onClick={() => handleRecruitForJob(job._id)} className="text-[11px] font-black text-violet-700">{getAppCountForJob(job._id)}</button></td>
                              <td className="pr-3.5 text-right">
                                {["Active", "Draft", "Expired"].includes(getJobStatus(job)) ? (
                                  <div className="flex justify-end gap-1.5">
                                    <JobStatusToggle isActive={getJobStatus(job) === "Active"} onToggle={() => handleJobStatusToggle(job)} />
                                    <button type="button" onClick={() => handleStartEdit(job)} aria-label={`Chỉnh sửa ${job.title}`} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"><PencilIcon className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => handleDeleteJob(job._id)} aria-label={`Xóa tin ${job.title}`} className="rounded-lg border border-red-100 p-1.5 text-red-500 transition hover:bg-red-50"><TrashIcon className="h-3.5 w-3.5" /></button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1.5">
                                    <button type="button" onClick={() => handleStartEdit(job)} aria-label={`Chỉnh sửa ${job.title}`} className="rounded-lg border border-violet-100 p-1.5 text-[#665d70] transition hover:bg-violet-50 hover:text-violet-700"><PencilIcon className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => handleDeleteJob(job._id)} aria-label={`Xóa tin ${job.title}`} className="rounded-lg border border-red-100 p-1.5 text-red-500 transition hover:bg-red-50"><TrashIcon className="h-3.5 w-3.5" /></button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredJobs.length === 0 && <div className="p-10 text-center text-sm font-semibold text-[#665d70]">Không có tin tuyển dụng phù hợp.</div>}
                    </div>
                    <div className="flex items-center justify-between border-t border-violet-100 px-3.5 py-2 text-[10px] text-[#665d70]">
                      <span>Hiển thị {filteredJobs.length} trên tổng số {jobs.length} việc làm</span>
                      <div className="flex gap-1"><button className="rounded-[7px] p-1.5"><ChevronLeftIcon className="h-4 w-4" /></button><button className="rounded-[7px] bg-violet-100 px-2 py-1 font-black text-violet-700">1</button><button className="rounded-[7px] px-2 py-1 font-black">2</button><button className="rounded-[7px] p-1.5"><ChevronRightIcon className="h-4 w-4" /></button></div>
                    </div>
                  </PortalCard>
                </div>
              )}

              {activeTab === "applications" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 border-b border-violet-100 pb-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#665d70]">Công việc: {jobs.find((j) => j._id === selectedJobFilter)?.title || "Tất cả việc làm"}</p>
                      <h1 className="mt-0.5 text-[22px] font-black tracking-[-0.035em]">Duyệt ứng viên ({filteredApplications.length} hồ sơ)</h1>
                    </div>
                    <div className="flex items-center gap-3">
                      <FunnelIcon className="h-5 w-5 text-[#665d70]" />
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-[11px] font-black text-violet-700">{(currentUser?.fullName || "R").charAt(0)}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)]">
                    <aside className="space-y-3">
                      <PortalCard className="p-3">
                        <label className="text-[11px] font-black">Tìm ứng viên</label>
                        <div className="relative mt-1.5">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#665d70]" />
                          <input value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} placeholder="Tên hoặc từ khóa..." className="h-8 w-full rounded-[8px] border-0 bg-slate-100 pl-9 pr-3 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-violet-200" />
                        </div>
                      </PortalCard>
                      <PortalCard className="p-3">
                        <h3 className="text-[11px] font-black">Lọc theo công việc</h3>
                        <select value={selectedJobFilter} onChange={(e) => setSelectedJobFilter(e.target.value)} className="mt-1.5 h-8 w-full rounded-[8px] border border-violet-100 bg-white px-2.5 text-[11px] font-semibold outline-none">
                          <option value="">Tất cả việc làm</option>
                          {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                        </select>
                      </PortalCard>
                    </aside>

                    <section className="space-y-3">
                      {filteredApplications.map((app, index) => (
                        <PortalCard key={app._id} className="p-3">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                            <div className="flex gap-3">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-violet-100 text-[12px] font-black text-violet-700">{app.fullName?.charAt(0) || "U"}</div>
                              <div className="min-w-0">
                                <h2 className="text-[15px] font-black leading-tight">{app.fullName}</h2>
                                <p className="mt-0.5 text-[11px] font-semibold text-[#665d70]">{app.email}</p>
                                <p className="mt-0.5 text-[11px] text-[#665d70]">Ứng tuyển: {app.jobId?.title || "Tin tuyển dụng đã xóa"}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5"><AppStatusBadge status={app.status} /><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#665d70]">Phù hợp {96 - index * 8}%</span></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => app.resumeId && navigate(`/resume/view/${app.resumeId}`)} disabled={!app.resumeId} className="rounded-[8px] bg-violet-100 px-2 py-1.5 text-[11px] font-black text-violet-700 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40">Xem CV</button>
                              <button type="button" onClick={() => (app.candidateId?._id || app.candidateId) && navigate(`/profile/${app.candidateId?._id || app.candidateId}`)} disabled={!(app.candidateId?._id || app.candidateId)} className="rounded-[8px] border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40">Trang cá nhân</button>
                              {app.coverLetter && <button type="button" onClick={() => setSelectedCoverLetter(app)} className="col-span-2 rounded-[8px] border border-sky-200 bg-sky-50 px-2 py-1.5 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100">Xem thư ứng tuyển</button>}
                              <div className="col-span-2"><ApplicationStatusSelect value={app.status} onChange={(nextStatus) => handleUpdateStatus(app._id, nextStatus)} /></div>
                            </div>
                          </div>
                        </PortalCard>
                      ))}
                      {filteredApplications.length === 0 && <PortalCard className="p-10 text-center text-sm font-semibold text-[#665d70]">Chưa có hồ sơ phù hợp.</PortalCard>}
                    </section>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700"><BuildingOffice2Icon className="h-5 w-5" /></span>
                      <div>
                        <h1 className="text-[24px] font-black tracking-[-0.04em]">Hồ sơ doanh nghiệp</h1>
                        <p className="mt-0.5 text-[12px] text-[#665d70]">Cập nhật thông tin mà ứng viên nhìn thấy trên RabbitCV.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <button type="button" onClick={resetCompanyProfile} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700">Hủy thay đổi</button>
                      <button type="button" onClick={handleSaveCompanyProfile} className="h-10 rounded-xl bg-violet-700 px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-violet-800">Lưu thay đổi</button>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                      <PortalCard className="overflow-hidden">
                        <div className="border-b border-violet-100 px-5 py-4">
                          <h2 className="text-[16px] font-bold">Nhận diện doanh nghiệp</h2>
                          <p className="mt-1 text-[11px] text-slate-500">Tên, trang web và hình ảnh đại diện của công ty.</p>
                        </div>
                        <div className="p-5">
                          <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-violet-200 via-fuchsia-100 to-white">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(124,58,237,0.22),transparent_35%)]" />
                            <span className="absolute bottom-3 left-4 rounded-lg bg-white/85 px-3 py-1.5 text-[10px] font-semibold text-violet-700 backdrop-blur">Ảnh bìa doanh nghiệp · 1200 × 400 px</span>
                          </div>
                          <div className="mt-5 grid gap-4 sm:grid-cols-[88px_minmax(0,1fr)]">
                            <div>
                              <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">Biểu trưng</span>
                              <div className="grid h-[72px] w-[72px] place-items-center rounded-xl border border-violet-100 bg-violet-50 text-lg font-black text-violet-700">{(companyProfile.fullName || "RC").slice(0, 2).toUpperCase()}</div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block text-[11px] font-semibold text-slate-600">Tên doanh nghiệp<input name="fullName" value={companyProfile.fullName} onChange={handleProfileChange} placeholder="Nhập tên doanh nghiệp" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                              <label className="block text-[11px] font-semibold text-slate-600">Trang web<input name="companyWebsite" value={companyProfile.companyWebsite} onChange={handleProfileChange} placeholder="https://tencongty.vn" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                            </div>
                          </div>
                        </div>
                      </PortalCard>

                      <PortalCard className="overflow-hidden">
                        <div className="border-b border-violet-100 px-5 py-4">
                          <h2 className="text-[16px] font-bold">Thông tin giới thiệu</h2>
                          <p className="mt-1 text-[11px] text-slate-500">Giúp ứng viên hiểu rõ lĩnh vực và môi trường làm việc.</p>
                        </div>
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                          <label className="block text-[11px] font-semibold text-slate-600 sm:col-span-2">Giới thiệu doanh nghiệp<textarea name="companyDescription" value={companyProfile.companyDescription} onChange={handleProfileChange} rows={5} placeholder="Mô tả ngắn gọn về doanh nghiệp, sản phẩm và văn hóa làm việc..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-normal leading-5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Quy mô doanh nghiệp<input name="companySize" value={companyProfile.companySize} onChange={handleProfileChange} placeholder="Ví dụ: 51 - 200 nhân viên" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Lĩnh vực hoạt động<input name="companyIndustry" value={companyProfile.companyIndustry} onChange={handleProfileChange} placeholder="Ví dụ: Công nghệ thông tin" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Địa chỉ<input name="address" value={companyProfile.address} onChange={handleProfileChange} placeholder="Nhập địa chỉ trụ sở" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Số điện thoại<input name="phoneNumber" value={companyProfile.phoneNumber} onChange={handleProfileChange} placeholder="Nhập số điện thoại liên hệ" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                        </div>
                      </PortalCard>
                    </div>

                    <aside className="self-start xl:sticky xl:top-5">
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Xem trước với ứng viên</p>
                      <PortalCard className="overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-violet-200 via-fuchsia-100 to-white" />
                        <div className="p-5">
                          <div className="-mt-12 grid h-14 w-14 place-items-center rounded-xl border-4 border-white bg-white text-lg font-black text-violet-700 shadow-sm">{(companyProfile.fullName || "RC").slice(0, 2).toUpperCase()}</div>
                          <h3 className="mt-3 text-[17px] font-bold">{companyProfile.fullName || "Tên doanh nghiệp"}</h3>
                          <p className="mt-1 text-[11px] font-semibold text-violet-700">{companyProfile.companyWebsite || "Trang web đang cập nhật"}</p>
                          <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">{companyProfile.companyIndustry || "Lĩnh vực đang cập nhật"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{companyProfile.companySize || "Quy mô đang cập nhật"}</span></div>
                          <p className="mt-3 line-clamp-4 text-[12px] leading-5 text-[#665d70]">{companyProfile.companyDescription || "Thông tin giới thiệu doanh nghiệp sẽ hiển thị tại đây."}</p>
                          {companyProfile.address && <p className="mt-3 flex items-start gap-1.5 border-t border-violet-100 pt-3 text-[10px] text-slate-500"><MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />{companyProfile.address}</p>}
                        </div>
                      </PortalCard>
                    </aside>
                  </div>
                </div>
              )}

              {activeTab === "post" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/70 p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700"><BriefcaseIcon className="h-5 w-5" /></span>
                      <div>
                        <p className="text-[10px] font-semibold text-violet-700">Tin tuyển dụng</p>
                        <h1 className="mt-0.5 text-[24px] font-black tracking-[-0.04em]">{isEditing ? "Chỉnh sửa việc làm" : "Đăng việc làm mới"}</h1>
                        <p className="mt-0.5 text-[12px] text-[#665d70]">Cung cấp thông tin rõ ràng để tiếp cận ứng viên phù hợp.</p>
                      </div>
                    </div>
                    {isEditing && <button type="button" aria-label="Đóng biểu mẫu chỉnh sửa" onClick={() => { resetForm(); setActiveTab("jobs"); }} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:text-violet-700"><XMarkIcon className="h-4 w-4" /></button>}
                  </div>

                  <form onSubmit={(e) => handlePostJob(e, formData.status)} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
                    <div className="space-y-5">
                      <PortalCard className="overflow-hidden">
                        <div className="border-b border-violet-100 px-5 py-4"><h2 className="text-[16px] font-bold">Thông tin cơ bản</h2><p className="mt-1 text-[11px] text-slate-500">Các trường có dấu * là thông tin bắt buộc.</p></div>
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                          <label className="block text-[11px] font-semibold text-slate-600">Tên công việc *<input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ví dụ: Lập trình viên React" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Mức lương *<input name="salary" value={formData.salary} onChange={handleInputChange} placeholder="Ví dụ: 15 - 20 triệu" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Địa điểm làm việc *<input name="location" value={formData.location} onChange={handleInputChange} placeholder="Ví dụ: TP. Hồ Chí Minh" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Hình thức công việc<select name="type" value={formData.type} onChange={handleInputChange} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option value="Full-time">Toàn thời gian</option><option value="Part-time">Bán thời gian</option><option value="Intern">Thực tập</option><option value="Freelance">Tự do</option></select></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Kinh nghiệm<select name="experience" value={formData.experience} onChange={handleInputChange} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option>Không yêu cầu</option><option>Dưới 1 năm</option><option>1-2 năm</option><option>2-3 năm</option><option>3-5 năm</option><option>Trên 5 năm</option></select></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Học vấn<select name="education" value={formData.education} onChange={handleInputChange} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option>Không yêu cầu</option><option>Trung cấp</option><option>Cao đẳng</option><option>Đại học</option><option>Sau đại học</option></select></label>
                          <label className="block text-[11px] font-semibold text-slate-600">Mô hình làm việc<select name="workModel" value={formData.workModel} onChange={handleInputChange} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option>Tại văn phòng</option><option>Làm từ xa</option><option>Kết hợp</option></select></label>
                          <label className="block text-[11px] font-semibold text-slate-600 sm:col-span-2"><span className="block">Hạn nhận hồ sơ</span><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="mt-1.5 block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                        </div>
                      </PortalCard>

                      <PortalCard className="overflow-hidden">
                        <div className="border-b border-violet-100 px-5 py-4">
                          <div>
                            <h2 className="text-[16px] font-bold">Nội dung tuyển dụng</h2>
                            <p className="mt-1 text-[11px] text-slate-500">Mô tả công việc, yêu cầu và quyền lợi dành cho ứng viên.</p>
                          </div>
                        </div>
                        <div className="grid gap-4 p-5">
                          <label className="block text-[11px] font-semibold text-slate-600">Mô tả công việc *<textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} placeholder="Trình bày nhiệm vụ chính và phạm vi công việc..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-normal leading-5 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-[11px] font-semibold text-slate-600">Yêu cầu ứng viên<textarea name="requirements" value={formData.requirements} onChange={handleInputChange} rows={5} placeholder="Nhập mỗi yêu cầu trên một dòng" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-normal leading-5 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                            <label className="block text-[11px] font-semibold text-slate-600">Quyền lợi<textarea name="benefits" value={formData.benefits} onChange={handleInputChange} rows={5} placeholder="Nhập mỗi quyền lợi trên một dòng" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-normal leading-5 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
                          </div>
                        </div>
                      </PortalCard>

                      <PortalCard className="p-5">
                        <label className="block text-[11px] font-semibold text-slate-600">Kỹ năng và từ khóa</label>
                        <p className="mt-1 text-[10px] text-slate-400">Nhấn Enter hoặc dấu phẩy để thêm từ khóa.</p>
                        <div className="mt-3 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">{formData.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700">{tag}<button type="button" aria-label={`Xóa ${tag}`} onClick={() => setFormData((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))} className="ml-1.5 text-violet-400 hover:text-red-500">×</button></span>)}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Ví dụ: React, SQL..." className="min-w-[170px] flex-1 bg-transparent px-2 py-1 text-[12px] font-normal outline-none placeholder:text-slate-400" /></div>
                      </PortalCard>
                    </div>

                    <aside className="self-start xl:sticky xl:top-5">
                      <PortalCard className="p-4">
                        <h2 className="text-[14px] font-bold">Hoàn tất tin tuyển dụng</h2>
                        <div className="mt-4 space-y-3 text-[11px] text-slate-500">
                          <p className="flex gap-2"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700">1</span>Kiểm tra tên công việc và mức lương.</p>
                          <p className="flex gap-2"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700">2</span>Mô tả rõ trách nhiệm và yêu cầu.</p>
                          <p className="flex gap-2"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700">3</span>Đặt hạn nhận hồ sơ phù hợp.</p>
                        </div>
                        {isEditing ? (
                          <div className="mt-5 space-y-2 border-t border-violet-100 pt-4">
                            <p className="text-[11px] font-semibold text-slate-600">Trạng thái bài đăng</p>
                            <JobStatusToggle isActive={formData.status === "Active"} onToggle={() => handleJobStatusToggle({ _id: editingJobId, title: formData.title, status: formData.status })} />
                            <button disabled={formLoading} type="button" onClick={(event) => handlePostJob(event, formData.status)} className="h-10 w-full rounded-xl bg-violet-700 text-[12px] font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{formLoading ? "Đang lưu..." : "Lưu thay đổi"}</button>
                            <button type="button" onClick={async () => { const deleted = await handleDeleteJob(editingJobId); if (deleted) { resetForm(); setActiveTab("jobs"); } }} className="h-10 w-full rounded-xl border border-red-100 bg-white text-[12px] font-semibold text-red-600 transition hover:bg-red-50">Xóa tin</button>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-2 border-t border-violet-100 pt-4">
                            <button type="button" onClick={(e) => handlePostJob(e, "Draft")} className="h-10 w-full rounded-xl border border-violet-200 bg-white text-[12px] font-semibold text-violet-700 transition hover:bg-violet-50">Lưu bản nháp</button>
                            <button disabled={formLoading} type="button" onClick={(e) => handlePostJob(e, "Active")} className="h-10 w-full rounded-xl bg-violet-700 text-[12px] font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{formLoading ? "Đang lưu..." : "Đăng tuyển"}</button>
                          </div>
                        )}
                      </PortalCard>
                    </aside>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {selectedCoverLetter && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation" onMouseDown={() => setSelectedCoverLetter(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cover-letter-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-sky-100 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="cover-letter-title" className="text-base font-bold text-slate-900">Thư ứng tuyển</h2>
                <p className="mt-1 text-xs text-slate-500">{selectedCoverLetter.fullName} · {selectedCoverLetter.jobId?.title || "Tin tuyển dụng"}</p>
              </div>
              <button type="button" onClick={() => setSelectedCoverLetter(null)} aria-label="Đóng thư ứng tuyển" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <div className="max-h-[calc(80vh-76px)] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-slate-700">
              {selectedCoverLetter.coverLetter}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
