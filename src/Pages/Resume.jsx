import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirmDialog } from "../context/ConfirmDialogContext.jsx";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import useCvZoom from "../hooks/useCvZoom";
import useResumePrint from "../hooks/useResumePrint.js";
import { requestAi } from "../utils/aiApi.js";
import { normalizeResumeDateValue } from "../utils/dateInput.js";
import { showToast } from "../utils/toast.js";
import {
  mergeAiSection,
  mergeAiSkills,
} from "../utils/resumeAiFill.js";
import {
  ArrowLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const DEFAULT_TITLE = "CV mới của tôi";
const DEFAULT_PERSONAL_INFO = {
  fullName: "",
  jobTitle: "",
  email: "",
  website: "",
  phone: "",
  location: "",
};
const TEMPLATE_NAMES = {
  classic: "Mẫu cơ bản tối giản",
  modern: "Mẫu hiện đại",
  professional: "Mẫu chuyên nghiệp",
  elegant: "Mẫu thanh lịch đơn sắc",
  creative: "Mẫu sáng tạo hai cột",
  compact: "Mẫu tối ưu ATS",
};

const normalizeTemplate = (template) =>
  Object.hasOwn(TEMPLATE_NAMES, template) ? template : "modern";

const mapIds = (items) =>
  Array.isArray(items)
    ? items.map((item) => ({ ...item, id: item._id || item.id }))
    : [];

const mapAccountExperience = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item._id || `account-experience-${index}`,
    title: item.position || "",
    company: item.company || "",
    location: item.location || "",
    startDate: normalizeResumeDateValue(item.startDate),
    endDate: normalizeResumeDateValue(item.endDate),
    description: item.description || "",
  }));

const mapAccountEducation = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item._id || `account-education-${index}`,
    title: item.degree || "",
    company: item.school || "",
    location: item.location || "",
    major: item.major || "",
    score: item.score || "",
    startDate: normalizeResumeDateValue(item.startDate),
    endDate: normalizeResumeDateValue(item.endDate),
    description: item.description || "",
  }));

const normalizeResume = (data = {}) => ({
  title: data.title || DEFAULT_TITLE,
  image: data.image || null,
  personalInfo: { ...DEFAULT_PERSONAL_INFO, ...(data.personalInfo || {}) },
  bio: data.bio || "",
  profile: mapIds(data.profile),
  experience: mapIds(data.experience),
  education: mapIds(data.education),
  skill: mapIds(data.skill),
  language: mapIds(data.language),
  certificate: mapIds(data.certificate),
  project: mapIds(data.project),
  award: mapIds(data.award),
  hobby: mapIds(data.hobby),
  selectedTemplate: normalizeTemplate(data.selectedTemplate),
});

export default function CreateResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeId: routeResumeId } = useParams();
  const confirmDialog = useConfirmDialog();
  const initialResumeId = routeResumeId || location.state?.cvId || null;
  const previewRef = useCvZoom();
  const printContentRef = useRef(null);
  const titleInputRef = useRef(null);

  const [showForm, setShowForm] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [showTemplates, setShowTemplates] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1600,
  );
  const [_id, setId] = useState(initialResumeId);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [selectedTemplate, setSelectedTemplate] = useState(
    normalizeTemplate(location.state?.template),
  );
  const [titleError, setTitleError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(Boolean(initialResumeId));
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [isImprovingBio, setIsImprovingBio] = useState(false);
  const [bioSuggestion, setBioSuggestion] = useState(null);
  const [isReviewingResume, setIsReviewingResume] = useState(false);
  const [resumeReview, setResumeReview] = useState(null);
  const [isAiFillingResume, setIsAiFillingResume] = useState(false);
  const [isAiFillPromptOpen, setIsAiFillPromptOpen] = useState(false);
  const [aiTargetRole, setAiTargetRole] = useState("");

  const [image, setImage] = useState(null);
  const [bio, setBio] = useState("");
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_PERSONAL_INFO);
  const [profile, setProfile] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skill, setSkill] = useState([]);
  const [language, setLanguage] = useState([]);
  const [certificate, setCertificate] = useState([]);
  const [project, setProject] = useState([]);
  const [award, setAward] = useState([]);
  const [hobby, setHobby] = useState([]);

  const { currentUser, isAuthChecked } = useAuth();

  const resumeData = useMemo(
    () => ({
      title,
      image,
      personalInfo,
      bio,
      profile,
      experience,
      education,
      skill,
      language,
      certificate,
      project,
      award,
      hobby,
      selectedTemplate,
    }),
    [
      title,
      image,
      personalInfo,
      bio,
      profile,
      experience,
      education,
      skill,
      language,
      certificate,
      project,
      award,
      hobby,
      selectedTemplate,
    ],
  );
  const currentSignature = useMemo(
    () => JSON.stringify(resumeData),
    [resumeData],
  );
  const isDirty =
    savedSignature !== null && currentSignature !== savedSignature;

  const applyResume = useCallback((data) => {
    const normalized = normalizeResume(data);
    setTitle(normalized.title);
    setImage(normalized.image);
    setPersonalInfo(normalized.personalInfo);
    setBio(normalized.bio);
    setProfile(normalized.profile);
    setExperience(normalized.experience);
    setEducation(normalized.education);
    setSkill(normalized.skill);
    setLanguage(normalized.language);
    setCertificate(normalized.certificate);
    setProject(normalized.project);
    setAward(normalized.award);
    setHobby(normalized.hobby);
    setSelectedTemplate(normalized.selectedTemplate);
    return normalized;
  }, []);

  useEffect(() => {
    const nextId = routeResumeId || location.state?.cvId || null;
    setId(nextId);
  }, [routeResumeId, location.state?.cvId]);

  useEffect(() => {
    if (!_id && savedSignature === null) {
      setSavedSignature(currentSignature);
    }
  }, [_id, currentSignature, savedSignature]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isAuthChecked) return undefined;
    if (!currentUser) {
      navigate("/login");
      return undefined;
    }

    if (!_id) {
      setIsLoadingResume(false);
      setLoadError("");
      return undefined;
    }

    const controller = new AbortController();

    const fetchResumeData = async () => {
      setIsLoadingResume(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/resume/${_id}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải CV này.");
        }

        const normalized = applyResume(data);
        setSavedSignature(JSON.stringify(normalized));
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Lỗi khi tải CV:", error);
        setLoadError(error.message || "Không thể tải CV này.");
        showToast(error.message || "Không thể tải CV này.", "error");
      } finally {
        if (!controller.signal.aborted) setIsLoadingResume(false);
      }
    };

    fetchResumeData();
    return () => controller.abort();
  }, [
    _id,
    applyResume,
    currentUser,
    isAuthChecked,
    loadAttempt,
    navigate,
  ]);

  const handleAiFillResume = async (requestedRole = "") => {
    const requestedTargetRole =
      typeof requestedRole === "string" ? requestedRole.trim() : "";
    const accountExperience = mapAccountExperience(currentUser?.experiences);
    const accountEducation = mapAccountEducation(currentUser?.educations);
    const sourceExperience =
      experience.length > 0 ? experience : accountExperience;
    const sourceEducation = education.length > 0 ? education : accountEducation;
    const accountLocation =
      currentUser?.address ||
      [currentUser?.hometown, currentUser?.country].filter(Boolean).join(", ");
    const latestAccountRole =
      sourceExperience.find((item) => item.title?.trim())?.title || "";
    const mergedPersonalInfo = {
      ...personalInfo,
      fullName:
        personalInfo.fullName ||
        currentUser?.fullName ||
        currentUser?.username ||
        "",
      email: personalInfo.email || currentUser?.email || "",
      phone: personalInfo.phone || currentUser?.phoneNumber || "",
      location: personalInfo.location || accountLocation || "",
      jobTitle:
        personalInfo.jobTitle || latestAccountRole || requestedTargetRole,
    };
    const hasCareerContext =
      Boolean(mergedPersonalInfo.jobTitle?.trim()) ||
      Boolean(bio.trim()) ||
      sourceExperience.length > 0 ||
      sourceEducation.length > 0 ||
      skill.length > 0 ||
      project.length > 0 ||
      certificate.length > 0;

    setPersonalInfo(mergedPersonalInfo);
    if (experience.length === 0 && sourceExperience.length > 0) {
      setExperience(sourceExperience);
    }
    if (education.length === 0 && sourceEducation.length > 0) {
      setEducation(sourceEducation);
    }

    if (!hasCareerContext) {
      setAiTargetRole("");
      setIsAiFillPromptOpen(true);
      return;
    }

    setIsAiFillPromptOpen(false);
    setIsAiFillingResume(true);
    try {
      const data = await requestAi("/resume/fill", {
        resumeContext: {
          personalInfo: mergedPersonalInfo,
          bio,
          experience: sourceExperience,
          education: sourceEducation,
          skill,
          language,
          certificate,
          project,
          award,
          hobby,
          profile,
        },
      });
      const generated = data.result || {};
      const targetRole =
        mergedPersonalInfo.jobTitle || generated.targetRole?.trim() || "";

      setPersonalInfo({
        ...mergedPersonalInfo,
        jobTitle: targetRole,
      });
      if (!bio.trim() && generated.bio?.trim()) {
        setBio(generated.bio.trim());
      }
      setSkill(mergeAiSkills(skill, generated.skills));
      setExperience(
        mergeAiSection(
          sourceExperience,
          generated.experiences,
          [
            "title",
            "company",
            "location",
            "startDate",
            "endDate",
            "description",
          ],
          "experience",
        ),
      );
      setEducation(
        mergeAiSection(
          sourceEducation,
          generated.education,
          [
            "title",
            "major",
            "company",
            "location",
            "startDate",
            "endDate",
            "score",
            "description",
          ],
          "education",
        ),
      );
      setLanguage(
        mergeAiSection(
          language,
          generated.languages,
          ["title", "description"],
          "language",
        ),
      );
      setCertificate(
        mergeAiSection(
          certificate,
          generated.certificates,
          ["title", "date", "publisher", "description"],
          "certificate",
        ),
      );
      setProject(
        mergeAiSection(
          project,
          generated.projects,
          [
            "title",
            "company",
            "location",
            "startDate",
            "endDate",
            "date",
            "link",
            "description",
          ],
          "project",
        ),
      );
      setAward(
        mergeAiSection(
          award,
          generated.awards,
          ["title", "awarder", "date", "description"],
          "award",
        ),
      );
      setHobby(
        mergeAiSection(hobby, generated.hobbies, ["title"], "hobby"),
      );
      if (title === DEFAULT_TITLE && targetRole) {
        setTitle(`CV ${targetRole}`);
      }

      showToast(
        "AI đã điền các phần còn thiếu. Hãy kiểm tra nội dung trước khi lưu.",
        "success",
      );
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsAiFillingResume(false);
    }
  };

  const handleImproveBio = async (mode = "improve") => {
    const hasResumeContext =
      Boolean(personalInfo.jobTitle?.trim()) ||
      experience.length > 0 ||
      education.length > 0 ||
      skill.length > 0 ||
      project.length > 0;

    if (mode !== "generate" && !bio.trim()) {
      showToast("Hãy nhập phần tiểu sử trước khi chọn chế độ này.", "error");
      return;
    }
    if (mode === "generate" && !bio.trim() && !hasResumeContext) {
      showToast(
        "Hãy nhập vị trí mong muốn, kỹ năng hoặc kinh nghiệm trước.",
        "error",
      );
      return;
    }

    setIsImprovingBio(true);
    setBioSuggestion(null);
    try {
      const data = await requestAi("/resume/improve", {
        resumeId: _id || undefined,
        mode,
        content: bio,
        targetRole: personalInfo.jobTitle,
        resumeContext: {
          personalInfo: { jobTitle: personalInfo.jobTitle },
          bio,
          experience,
          education,
          skill,
          project,
          certificate,
        },
      });
      setBioSuggestion({ ...data.result, mode });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsImprovingBio(false);
    }
  };

  const handleReviewResume = async () => {
    const hasReviewableContent =
      Boolean(personalInfo.jobTitle?.trim()) ||
      Boolean(bio.trim()) ||
      experience.length > 0 ||
      education.length > 0 ||
      skill.length > 0 ||
      project.length > 0 ||
      certificate.length > 0;

    if (!hasReviewableContent) {
      showToast(
        "Hãy nhập tiểu sử, kỹ năng, kinh nghiệm hoặc học vấn trước khi review CV.",
        "error",
      );
      return false;
    }

    setIsReviewingResume(true);
    try {
      const data = await requestAi("/resume/review", {
        resumeId: _id || undefined,
        resumeContext: {
          title,
          personalInfo,
          bio,
          profile,
          experience,
          education,
          skill,
          language,
          certificate,
          project,
          award,
          hobby,
          selectedTemplate,
        },
      });
      setResumeReview(data.result);
      return true;
    } catch (error) {
      showToast(error.message, "error");
      return false;
    } finally {
      setIsReviewingResume(false);
    }
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      const message = "Vui lòng nhập tên CV.";
      setTitleError(message);
      showToast(message, "error");
      titleInputRef.current?.focus();
      return;
    }

    if (isLoadingResume || loadError) return;

    setTitleError("");
    setIsSaving(true);
    try {
      const payload = { ...resumeData, title: cleanTitle };
      if (_id) payload._id = _id;

      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(responseData.message || "Lỗi khi lưu CV.");
        error.code = responseData.code;
        throw error;
      }

      const savedResume = applyResume(responseData.resume || payload);
      const savedId = responseData.resume?._id || _id;
      setSavedSignature(JSON.stringify(savedResume));
      setLastSaved(new Date());

      if (savedId && savedId !== _id) {
        setId(savedId);
        navigate(`/resume/${savedId}`, { replace: true });
      }

      showToast("Lưu CV thành công!", "success");
    } catch (error) {
      const isDuplicateTitle =
        error.code === "DUPLICATE_RESUME_TITLE" ||
        error.message?.toLowerCase().includes("tên cv này đã tồn tại") ||
        error.message?.toLowerCase().includes("ten cv nay da ton tai");
      const message = isDuplicateTitle
        ? "Tên CV này đã tồn tại. Hãy đổi sang tên khác hoặc mở CV cũ để chỉnh sửa."
        : error.message || "Không thể kết nối đến server!";

      if (isDuplicateTitle) {
        setTitleError(message);
        window.requestAnimationFrame(() => {
          titleInputRef.current?.focus();
          titleInputRef.current?.select();
        });
      }

      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (
      isDirty &&
      !(await confirmDialog("CV có thay đổi chưa lưu. Bạn vẫn muốn rời trang?"))
    ) {
      return;
    }
    navigate("/ResumeSelection");
  };

  const handleDownloadPdf = useResumePrint({
    contentRef: printContentRef,
    title,
  });

  const toggleForm = () => {
    setShowForm((visible) => !visible);
    if (window.innerWidth < 1024) setShowTemplates(false);
  };

  const toggleTemplates = () => {
    setShowTemplates((visible) => !visible);
    if (window.innerWidth < 1024) setShowForm(false);
  };

  const formattedTime = lastSaved
    ? lastSaved.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--page-background)] font-sans">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500">
          Đang xác thực thông tin...
        </p>
      </div>
    );
  }

  const saveDisabled = isSaving || isLoadingResume || Boolean(loadError);

  return (
    <div className="resume-editor-root flex h-screen flex-col overflow-hidden bg-[var(--page-background)] font-sans page-transition">
      <div className="resume-editor-toolbar z-30 flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex min-w-0 w-full items-center gap-2 sm:w-auto sm:flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thư viện</span>
          </button>

          <div className="h-5 w-px shrink-0 bg-slate-200" />

          <div className="min-w-0 max-w-[300px] flex-1">
            <input
              ref={titleInputRef}
              type="text"
              aria-label="Tên CV"
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "resume-title-error" : undefined}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (titleError) setTitleError("");
              }}
              className={`w-full border-b bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 outline-none transition ${
                titleError
                  ? "border-red-500 focus:border-red-600"
                  : "border-transparent hover:border-slate-300 focus:border-violet-500"
              }`}
            />
            {titleError && (
              <p
                id="resume-title-error"
                role="alert"
                className="mt-1 text-[10px] font-semibold leading-4 text-red-600"
              >
                {titleError}
              </p>
            )}
          </div>

          {isDirty ? (
            <span className="hidden shrink-0 text-[10px] font-medium text-amber-600 md:inline">
              Chưa lưu
            </span>
          ) : formattedTime ? (
            <span className="hidden shrink-0 text-[10px] font-medium text-slate-400 md:inline">
              Lưu lúc {formattedTime}
            </span>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-5 items-center gap-1.5 sm:ml-auto sm:flex sm:w-auto">
          <button
            type="button"
            onClick={toggleForm}
            aria-pressed={showForm}
            title="Ẩn hoặc hiện phần nội dung"
            className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border px-1 text-xs font-semibold transition sm:shrink-0 sm:px-2.5 ${
              showForm
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {showForm ? (
              <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronDoubleRightIcon className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">Nội dung</span>
          </button>

          <button
            type="button"
            onClick={toggleTemplates}
            aria-pressed={showTemplates}
            title="Ẩn hoặc hiện danh sách mẫu CV"
            className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border px-1 text-xs font-semibold transition sm:shrink-0 sm:px-2.5 ${
              showTemplates
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mẫu CV</span>
          </button>

          <button
            type="button"
            onClick={() => handleAiFillResume()}
            disabled={isAiFillingResume}
            aria-label={isAiFillingResume ? "AI đang điền CV" : "AI điền CV"}
            title="Dùng AI điền các phần CV còn thiếu"
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0 sm:px-2.5"
          >
            <SparklesIcon
              className={`h-3.5 w-3.5 ${isAiFillingResume ? "animate-pulse" : ""}`}
            />
            <span className="hidden sm:inline">
              {isAiFillingResume ? "Đang điền..." : "AI điền CV"}
            </span>
          </button>

          <div className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" />

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoadingResume || Boolean(loadError)}
            aria-label="Tải CV dưới dạng PDF"
            title="Mở hộp thoại lưu CV dưới dạng PDF"
            className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-1 text-xs font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0 sm:px-3"
          >
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tải PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled}
            aria-label={isSaving ? "Đang lưu CV" : "Lưu CV"}
            title={isSaving ? "Đang lưu CV" : "Lưu CV"}
            className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-1 text-xs font-bold text-white shadow-sm transition sm:shrink-0 sm:px-3 ${
              saveDisabled
                ? "cursor-not-allowed bg-violet-300"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            <CloudArrowUpIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isSaving ? "Đang lưu..." : "Lưu CV"}
            </span>
          </button>
        </div>
      </div>

      {isAiFillPromptOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-fill-dialog-title"
          >
            <form
              className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
              onSubmit={(event) => {
                event.preventDefault();
                if (!aiTargetRole.trim()) {
                  showToast("Hãy nhập vị trí mong muốn.", "error");
                  return;
                }
                handleAiFillResume(aiTargetRole);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="ai-fill-dialog-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    AI điền CV
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Nhập vị trí bạn muốn ứng tuyển để AI viết các phần CV còn
                    thiếu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiFillPromptOpen(false)}
                  aria-label="Đóng"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <label
                htmlFor="ai-target-role"
                className="mt-5 block text-sm font-semibold text-slate-700"
              >
                Vị trí mong muốn
              </label>
              <input
                id="ai-target-role"
                autoFocus
                value={aiTargetRole}
                onChange={(event) => setAiTargetRole(event.target.value)}
                placeholder="Ví dụ: Frontend Developer"
                className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiFillPromptOpen(false)}
                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Bắt đầu điền
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      <div className="relative flex flex-1 overflow-hidden">
        {showForm && (
          <button
            type="button"
            aria-label="Đóng phần nội dung"
            onClick={() => setShowForm(false)}
            className="absolute inset-0 z-10 bg-slate-950/20 lg:hidden"
          />
        )}
        {showTemplates && (
          <button
            type="button"
            aria-label="Đóng danh sách mẫu CV"
            onClick={() => setShowTemplates(false)}
            className="absolute inset-0 z-10 bg-slate-950/20 2xl:hidden"
          />
        )}

        <aside
          data-resume-editor-panel
          className={`absolute inset-y-0 left-0 z-20 flex w-[min(420px,100%)] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-[width,transform] duration-200 lg:relative lg:z-auto ${
            showForm
              ? "translate-x-0 lg:w-[420px] xl:w-[460px]"
              : "-translate-x-full lg:w-0 lg:translate-x-0"
          }`}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <ResumeForm
              image={image}
              setImage={setImage}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              bio={bio}
              setBio={setBio}
              profile={profile}
              setProfile={setProfile}
              experience={experience}
              setExperience={setExperience}
              education={education}
              setEducation={setEducation}
              skill={skill}
              setSkill={setSkill}
              language={language}
              setLanguage={setLanguage}
              certificate={certificate}
              setCertificate={setCertificate}
              project={project}
              setProject={setProject}
              award={award}
              setAward={setAward}
              hobby={hobby}
              setHobby={setHobby}
              onImproveBio={handleImproveBio}
              isImprovingBio={isImprovingBio}
              bioSuggestion={bioSuggestion}
              onApplyBioSuggestion={() => {
                setBio(bioSuggestion?.suggestion || bio);
                setBioSuggestion(null);
                showToast("Đã áp dụng bản tiểu sử. Hãy kiểm tra trước khi lưu.");
              }}
              onDismissBioSuggestion={() => setBioSuggestion(null)}
              onReviewResume={handleReviewResume}
              isReviewingResume={isReviewingResume}
              resumeReview={resumeReview}
            />
          </div>
        </aside>

        <main
          ref={previewRef}
          className="resume-editor-preview flex min-w-0 flex-1 flex-col items-center gap-4 overflow-y-auto bg-slate-100 px-2 py-5 sm:px-4 sm:py-7 no-scrollbar"
        >
          {isLoadingResume ? (
            <div className="mt-20 flex flex-col items-center text-slate-500">
              <div className="mb-3 h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              <p className="text-xs font-medium">Đang tải CV...</p>
            </div>
          ) : loadError ? (
            <div className="mt-16 max-w-sm rounded-xl border border-red-200 bg-white p-5 text-center shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Không thể mở CV
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {loadError}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-9 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Về thư viện
                </button>
                <button
                  type="button"
                  onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                  className="h-9 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="resume-editor-preview-label flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                {TEMPLATE_NAMES[selectedTemplate]}
              </div>

              <div ref={printContentRef} className="cv-wrapper mb-10 rounded-sm bg-white shadow-lg print:w-full print:shadow-none">
                <ResumePreview
                  selectedTemplate={selectedTemplate}
                  image={image}
                  personalInfo={personalInfo}
                  bio={bio}
                  profile={profile}
                  experience={experience}
                  education={education}
                  skill={skill}
                  project={project}
                  award={award}
                  hobby={hobby}
                  language={language}
                  certificate={certificate}
                />
              </div>
            </>
          )}
        </main>

        <aside
          data-resume-editor-panel
          className={`absolute inset-y-0 right-0 z-20 w-[min(280px,100%)] shrink-0 overflow-hidden border-l border-slate-200 bg-white transition-[width,transform] duration-200 2xl:relative 2xl:z-auto ${
            showTemplates
              ? "translate-x-0 2xl:w-[280px]"
              : "translate-x-full 2xl:w-0 2xl:translate-x-0"
          }`}
        >
          <ResumeTemplate
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        </aside>
      </div>
    </div>
  );
}
