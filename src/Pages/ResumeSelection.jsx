import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Header from "../Components/Header.jsx";
import ResumePreview from "../Components/ResumePreview.jsx";
import { showToast } from "../utils/toast.js";
import { formatDate } from "../utils/dateTime.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import { SAMPLE_CVS } from "../data/sampleCV.js";
import useResumePrint from "../hooks/useResumePrint.js";

const TEMPLATES = [
  {
    id: "modern",
    name: "Hiện đại",
    category: "Hiện đại",
    description: "Bố cục rõ ràng, điểm nhấn violet phù hợp nhiều ngành nghề.",
    accent: "bg-violet-600",
    soft: "bg-violet-50",
  },
  {
    id: "classic",
    name: "Cơ bản tối giản",
    category: "Tối giản",
    description: "Thiết kế tinh gọn, tập trung vào kinh nghiệm và nội dung.",
    accent: "bg-slate-800",
    soft: "bg-slate-50",
  },
  {
    id: "professional",
    name: "Chuyên nghiệp",
    category: "Chuyên nghiệp",
    description: "Bố cục chắc chắn, tạo cảm giác tin cậy và chỉn chu.",
    accent: "bg-blue-700",
    soft: "bg-blue-50",
  },
  {
    id: "elegant",
    name: "Thanh lịch đơn sắc",
    category: "Thanh lịch",
    description: "Bố cục tối giản, nhiều khoảng thở, phù hợp tài chính, tư vấn và quản lý.",
    accent: "bg-slate-900",
    soft: "bg-stone-50",
  },
  {
    id: "creative",
    name: "Sáng tạo hai cột",
    category: "Sáng tạo",
    description: "Header nổi bật kết hợp sidebar sáng, phù hợp thiết kế, marketing và sản phẩm.",
    accent: "bg-teal-700",
    soft: "bg-teal-50",
  },
  {
    id: "compact",
    name: "Tối ưu ATS",
    category: "Tối giản",
    description: "Bố cục một cột, tiêu đề chuẩn và thứ tự nội dung rõ ràng để ATS dễ phân tích.",
    accent: "bg-indigo-700",
    soft: "bg-indigo-50",
  },
];

const FILTERS = ["Tất cả", "Hiện đại", "Tối giản", "Chuyên nghiệp", "Thanh lịch", "Sáng tạo"];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới cập nhật" },
  { value: "oldest", label: "Cũ nhất" },
];

const PREVIEW_PLACEHOLDER = {
  fullName: "Nguyễn Minh Anh",
  jobTitle: "Frontend Developer",
  email: "minhanh@email.com",
  phone: "0901 234 567",
  location: "TP. Hồ Chí Minh",
  website: "minhanh.dev",
};

const preparePreviewItems = (items, limit) =>
  Array.isArray(items)
    ? items.slice(0, limit).map((item, index) => ({
        ...item,
        id: item?.id || item?._id || `preview-${index}`,
      }))
    : [];

function getPreviewData(cv) {
  const source = cv || SAMPLE_CVS[0];

  return {
    image: source.image || null,
    layout: source.layout,
    customSections: source.customSections || [],
    personalInfo: { ...PREVIEW_PLACEHOLDER, ...(source.personalInfo || {}) },
    bio: source.bio || "",
    profile: preparePreviewItems(source.profile, 2),
    experience: preparePreviewItems(source.experience, 2),
    education: preparePreviewItems(source.education, 1),
    skill: preparePreviewItems(source.skill, 4),
    project: preparePreviewItems(source.project, 1),
    award: preparePreviewItems(source.award, 1),
    hobby: preparePreviewItems(source.hobby, 3),
    language: preparePreviewItems(source.language, 2),
    certificate: preparePreviewItems(source.certificate, 1),
  };
}

function ResumeMiniature({ template = "modern", compact = false, cv = null }) {
  const selectedTemplate = TEMPLATES.some((item) => item.id === template) ? template : "modern";
  const previewData = getPreviewData(cv);

  return (
    <div
      aria-hidden="true"
      className={`${compact ? "h-28 w-20" : "h-[181px] w-32"} relative shrink-0 overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-[0_2px_7px_rgba(15,23,42,0.10)] transition duration-200 group-hover:border-violet-200 group-hover:shadow-[0_4px_12px_rgba(76,29,149,0.12)]`}
    >
      <div className={`${compact ? "scale-[0.101]" : "scale-[0.161]"} pointer-events-none absolute left-0 top-0 h-[1123px] w-[794px] origin-top-left select-none`}>
        <ResumePreview selectedTemplate={selectedTemplate} {...previewData} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {[1, 2].map((item) => (
        <div key={item} className="flex animate-pulse gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
          <div className="h-28 w-20 shrink-0 rounded bg-slate-100" />
          <div className="flex-1 py-2">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
            <div className="mt-5 h-3 w-2/5 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SortDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = SORT_OPTIONS.find((option) => option.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative sm:w-[140px]">
      <button
        type="button"
        aria-label="Sắp xếp CV"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-xs font-medium outline-none transition ${isOpen ? "border-violet-500 text-slate-800 ring-2 ring-violet-100" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}
      >
        <span>{selectedOption.label}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 transition duration-150 ${isOpen ? "rotate-180 text-violet-600" : "text-slate-400"}`} />
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Tùy chọn sắp xếp CV" className="absolute right-0 top-[calc(100%+6px)] z-40 w-full min-w-[150px] rounded-lg border border-slate-200 bg-white p-1 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition ${isSelected ? "bg-violet-50 font-semibold text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span>{option.label}</span>
                {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SavedResumeCard({ cv, editingId, tempTitle, setEditingId, setTempTitle, onRename, onEdit, onDownload, onDelete }) {
  const template = cv.selectedTemplate || "modern";
  const label = TEMPLATES.find((item) => item.id === template)?.category || "Hiện đại";

  return (
    <article className="group flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <ResumeMiniature template={template} compact cv={cv} />
      <div className="flex min-w-0 flex-1 flex-col py-1 sm:min-h-28 sm:justify-center">
        {editingId === cv._id ? (
          <input autoFocus value={tempTitle} onChange={(event) => setTempTitle(event.target.value)} onBlur={() => onRename(cv)} onKeyDown={(event) => event.key === "Enter" && onRename(cv)} className="max-w-sm rounded-md border border-violet-300 bg-white px-2.5 py-1.5 text-sm font-semibold outline-none" />
        ) : (
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{cv.title || "CV mới của tôi"}</h3>
        )}
        <p className="mt-1 truncate text-xs text-slate-500">{cv.personalInfo?.jobTitle || "Chưa cập nhật vị trí"}</p>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><ClockIcon className="h-3 w-3" />Cập nhật lần cuối: {formatDate(cv.updatedAt || cv.createdAt)}</p>
        <span className="mt-2 w-fit text-[10px] font-medium text-violet-600">{label}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
        <button type="button" onClick={() => onEdit(cv)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"><PencilSquareIcon className="h-4 w-4" />Chỉnh sửa</button>
        <button type="button" onClick={() => onDownload(cv)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"><DocumentArrowDownIcon className="h-4 w-4" />Tải PDF</button>
        <span className="hidden h-7 border-l border-slate-200 sm:block" />
        <button type="button" onClick={() => { setEditingId(cv._id); setTempTitle(cv.title || "CV mới của tôi"); }} aria-label="Đổi tên CV" title="Đổi tên CV" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-violet-600"><PencilSquareIcon className="h-4 w-4" /></button>
        <button type="button" onClick={() => onDelete(cv._id)} aria-label="Xóa CV" title="Xóa CV" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>
      </div>
    </article>
  );
}

function TemplateCard({ template, onSelect }) {
  return (
    <article className="group grid min-w-0 grid-cols-[128px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm">
      <div className={`flex items-center justify-center rounded-md ${template.soft} py-3`}><ResumeMiniature template={template.id} /></div>
      <div className="flex min-w-0 flex-col py-1">
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-violet-700">{template.name}</h3>
        <span className="mt-1 text-[10px] font-medium text-violet-600">{template.category}</span>
        <p className="mt-2 line-clamp-4 flex-1 text-[10px] leading-4 text-slate-500">{template.description}</p>
        <button type="button" onClick={() => onSelect(template.id)} className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-md border border-violet-300 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50">Dùng mẫu <ArrowRightIcon className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}

export default function ResumeSelection() {
  const navigate = useNavigate();
  const confirmDialog = useConfirmDialog();
  const { currentUser, isAuthChecked } = useAuth();
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [templateFilter, setTemplateFilter] = useState("Tất cả");
  const [resumeToPrint, setResumeToPrint] = useState(null);
  const printContentRef = useRef(null);
  const activePrintIdRef = useRef(null);
  const printResume = useResumePrint({
    contentRef: printContentRef,
    title: resumeToPrint?.title,
    onAfterPrint: () => {
      activePrintIdRef.current = null;
      setResumeToPrint(null);
    },
  });

  useEffect(() => {
    if (!resumeToPrint) return undefined;
    const printId = resumeToPrint._id || resumeToPrint.title;
    if (activePrintIdRef.current === printId) return undefined;
    activePrintIdRef.current = printId;
    void printResume();
    return undefined;
  }, [printResume, resumeToPrint]);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!currentUser) { navigate("/login"); return; }

    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes", { credentials: "include" });
        if (response.ok) setSavedResumes(await response.json());
      } catch (error) {
        console.error("Lỗi lấy danh sách CV:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [currentUser, isAuthChecked, navigate]);

  const visibleResumes = useMemo(() => [...savedResumes]
    .filter((cv) => `${cv.title || ""} ${cv.personalInfo?.jobTitle || ""}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt).getTime();
      return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
    }), [savedResumes, searchQuery, sortOrder]);

  const visibleTemplates = useMemo(() => templateFilter === "Tất cả" ? TEMPLATES : TEMPLATES.filter((template) => template.category === templateFilter), [templateFilter]);

  const handleRename = async (cv) => {
    if (!tempTitle.trim() || tempTitle === cv.title) { setEditingId(null); return; }
    try {
      const response = await fetch("/api/resume", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...cv, title: tempTitle.trim(), _id: cv._id }) });
      const data = await response.json();
      if (response.ok) {
        setSavedResumes((current) => current.map((item) => item._id === cv._id ? { ...item, title: tempTitle.trim() } : item));
        setEditingId(null);
        showToast("Đã đổi tên CV thành công.", "success");
      } else showToast(data.message || "Không thể đổi tên CV", "error");
    } catch (error) {
      console.error("Lỗi đổi tên:", error);
      showToast("Lỗi kết nối.", "error");
    }
  };

  const handleDeleteResume = async (id) => {
    if (!(await confirmDialog("Bạn có chắc chắn muốn xóa bản CV này không?"))) return;
    try {
      const response = await fetch(`/api/resume/${id}`, { method: "DELETE", credentials: "include" });
      if (response.ok) {
        setSavedResumes((current) => current.filter((cv) => cv._id !== id));
        showToast("Đã xóa CV thành công.", "info");
      }
    } catch (error) {
      console.error("Lỗi xóa CV:", error);
      showToast("Lỗi khi xóa CV.", "error");
    }
  };

  if (!isAuthChecked) {
    return <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--page-background)] font-sans"><div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /><p className="text-xs font-medium text-slate-500">Đang xác thực thông tin...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--page-background)] font-sans text-slate-900 antialiased page-transition">
      <div className="resume-library-screen">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-7 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[28px]">CV của tôi</h1>
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">Quản lý CV đã lưu hoặc chọn một mẫu để bắt đầu.</p>
          </div>
          <button type="button" onClick={() => navigate("/resume", { state: { template: "modern" } })} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 sm:self-auto"><PlusIcon className="h-4 w-4" />Tạo CV mới</button>
        </header>

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">CV đã lưu</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative sm:w-60"><span className="sr-only">Tìm CV</span><MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm CV" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-500" /></label>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          {loading ? <LoadingSkeleton /> : visibleResumes.length > 0 ? (
            <div>{visibleResumes.map((cv) => <SavedResumeCard key={cv._id} cv={cv} editingId={editingId} tempTitle={tempTitle} setEditingId={setEditingId} setTempTitle={setTempTitle} onRename={handleRename} onEdit={(resume) => navigate(`/resume/${resume._id}`)} onDownload={setResumeToPrint} onDelete={handleDeleteResume} />)}</div>
          ) : (
            <div className="py-12 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600"><DocumentTextIcon className="h-5 w-5" /></span><h3 className="mt-3 text-sm font-semibold text-slate-700">{searchQuery ? "Không tìm thấy CV phù hợp" : "Bạn chưa tạo bản CV nào"}</h3><p className="mt-1 text-xs text-slate-400">{searchQuery ? "Hãy thử một từ khóa khác." : "Chọn một mẫu bên dưới để bắt đầu."}</p></div>
          )}
        </section>

        <section id="templates-section" className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)] sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Chọn mẫu CV</h2>
            <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">{FILTERS.map((filter) => <button key={filter} type="button" onClick={() => setTemplateFilter(filter)} className={`h-9 whitespace-nowrap rounded-md border px-3 text-[11px] font-medium transition ${templateFilter === filter ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{filter}</button>)}</div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleTemplates.map((template) => <TemplateCard key={template.id} template={template} onSelect={(id) => navigate("/resume", { state: { template: id } })} />)}</div>
        </section>
      </main>
      </div>

      {resumeToPrint && (
        <div className="resume-library-print-root" aria-hidden="true">
          <div ref={printContentRef} className="cv-wrapper bg-white">
            <ResumePreview
              selectedTemplate={resumeToPrint.selectedTemplate || "modern"}
              layout={resumeToPrint.layout}
              customSections={resumeToPrint.customSections || []}
              image={resumeToPrint.image || ""}
              personalInfo={resumeToPrint.personalInfo || {}}
              bio={resumeToPrint.bio || ""}
              profile={resumeToPrint.profile || []}
              experience={resumeToPrint.experience || []}
              education={resumeToPrint.education || []}
              skill={resumeToPrint.skill || []}
              language={resumeToPrint.language || []}
              certificate={resumeToPrint.certificate || []}
              project={resumeToPrint.project || []}
              award={resumeToPrint.award || []}
              hobby={resumeToPrint.hobby || []}
            />
          </div>
        </div>
      )}
    </div>
  );
}
