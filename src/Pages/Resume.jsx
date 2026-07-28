import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import Toast from "../Components/Toast";
import useCvZoom from "../hooks/useCvZoom";
import { SAMPLE_CVS } from "../data/sampleCV";
import {
  ArrowLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  EyeIcon,
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
  const initialResumeId = routeResumeId || location.state?.cvId || null;
  const previewRef = useCvZoom();
  const toastTimerRef = useRef(null);
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
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const [titleError, setTitleError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(Boolean(initialResumeId));
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);

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

  const showToast = useCallback((message, type = "success") => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true });
    toastTimerRef.current = window.setTimeout(
      () => setToast((current) => ({ ...current, visible: false })),
      3000,
    );
  }, []);

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

  useEffect(
    () => () => window.clearTimeout(toastTimerRef.current),
    [],
  );

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
    showToast,
  ]);

  const handleFillSample = () => {
    const randomCV = SAMPLE_CVS[Math.floor(Math.random() * SAMPLE_CVS.length)];
    applyResume({ ...randomCV, selectedTemplate });
    showToast(`Đã điền ${randomCV.title}!`, "success");
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

  const handleBack = () => {
    if (
      isDirty &&
      !window.confirm("CV có thay đổi chưa lưu. Bạn vẫn muốn rời trang?")
    ) {
      return;
    }
    navigate("/ResumeSelection");
  };

  const handleDownloadPdf = () => {
    const previousTitle = document.title;
    const safeTitle = (title.trim() || "CV-cua-toi")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ");

    document.title = safeTitle;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true },
    );
    window.print();
  };

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

        <div className="flex w-full items-center gap-1.5 overflow-x-auto sm:ml-auto sm:w-auto no-scrollbar">
          <button
            type="button"
            onClick={toggleForm}
            aria-pressed={showForm}
            title="Ẩn hoặc hiện phần nội dung"
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition ${
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
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition ${
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
            onClick={handleFillSample}
            className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Điền mẫu
          </button>

          <div className="h-5 w-px shrink-0 bg-slate-200" />

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoadingResume || Boolean(loadError)}
            title="Mở hộp thoại lưu CV dưới dạng PDF"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            Tải PDF
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-bold text-white shadow-sm transition ${
              saveDisabled
                ? "cursor-not-allowed bg-violet-300"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            <CloudArrowUpIcon className="h-3.5 w-3.5" />
            {isSaving ? "Đang lưu..." : "Lưu CV"}
          </button>
        </div>
      </div>

      <Toast toast={toast} />

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

              <div className="cv-wrapper mb-10 rounded-sm bg-white shadow-lg print:w-full print:shadow-none">
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
