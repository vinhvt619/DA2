import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RESUME_TEMPLATES } from "../../shared/resumeTemplates.js";
import { IMPORTED_SKILL_GROUPS_ID } from "../../shared/resumeCustomSections.js";
import {
  CvOcrImportError,
  plainTextToSafeParagraphHtml,
  safeParagraphHtmlToPlainText,
  sanitizeConfirmableResumePayload,
  sanitizePlainText,
  validatePdfHeaderBytes,
  validatePdfUploadInput,
} from "../../shared/resumeOcrPolicy.js";
import { createCvOcrJobManager } from "../utils/cvPdfOcrImporter.js";
import { showToast } from "../utils/toast.js";

const FIELD_LABELS = {
  fullName: "Họ và tên",
  jobTitle: "Vị trí ứng tuyển",
  email: "Email",
  phone: "Số điện thoại",
  location: "Địa chỉ",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skill: "Kỹ năng",
};

export default function ResumePdfOcrImportDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}) {
  const jobManagerRef = useRef(null);
  if (!jobManagerRef.current) {
    jobManagerRef.current = createCvOcrJobManager();
  }

  const fileInputRef = useRef(null);
  const selectedFileBytesRef = useRef(null);
  const selectedFileMetaRef = useRef(null);
  const submittingRef = useRef(false);
  const previousUserIdRef = useRef(userId);
  const currentUserIdRef = useRef(userId);
  const isOpenRef = useRef(open);
  const wasOpenRef = useRef(open);
  const fileReadGenerationRef = useRef(0);
  const saveGenerationRef = useRef(0);
  const saveAbortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const [step, setStep] = useState("idle"); // idle | processing | error | preview
  const [progress, setProgress] = useState({
    stage: "",
    pageNumber: 0,
    totalPages: 0,
    percent: 0,
    message: "",
  });
  const [importError, setImportError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({
    uncertainFields: [],
    unmappedLines: [],
    usedOcr: false,
  });
  const [pageSummaries, setPageSummaries] = useState([]);
  const [fullText, setFullText] = useState("");
  const [skillInputText, setSkillInputText] = useState("");

  const clearMemoryState = useCallback(() => {
    fileReadGenerationRef.current += 1;
    saveGenerationRef.current += 1;
    if (saveAbortControllerRef.current) {
      try {
        saveAbortControllerRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      saveAbortControllerRef.current = null;
    }
    jobManagerRef.current?.cancelActive();
    selectedFileBytesRef.current = null;
    selectedFileMetaRef.current = null;
    submittingRef.current = false;
    setStep("idle");
    setProgress({ stage: "", pageNumber: 0, totalPages: 0, percent: 0, message: "" });
    setImportError("");
    setSaveError("");
    setIsSubmitting(false);
    setDraft(null);
    setReviewNotes({ uncertainFields: [], unmappedLines: [], usedOcr: false });
    setPageSummaries([]);
    setFullText("");
    setSkillInputText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Synchronize dynamic open/userId refs and reset on close/account switch
  useEffect(() => {
    isOpenRef.current = open;
    if (wasOpenRef.current && !open) {
      clearMemoryState();
    }
    wasOpenRef.current = open;
  }, [clearMemoryState, open]);

  useEffect(() => {
    currentUserIdRef.current = userId;
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId;
      clearMemoryState();
    }
  }, [clearMemoryState, userId]);

  // Cleanup active worker/PDF task on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fileReadGenerationRef.current += 1;
      saveGenerationRef.current += 1;
      if (saveAbortControllerRef.current) {
        try {
          saveAbortControllerRef.current.abort();
        } catch {
          // Ignore
        }
        saveAbortControllerRef.current = null;
      }
      jobManagerRef.current?.cancelActive();
      selectedFileBytesRef.current = null;
      selectedFileMetaRef.current = null;
    };
  }, []);

  const runExtraction = useCallback(
    async (fileMeta, bytes, fileGeneration, accountAtStart) => {
      const isStillValid = () =>
        isMountedRef.current &&
        isOpenRef.current &&
        fileGeneration === fileReadGenerationRef.current &&
        accountAtStart === currentUserIdRef.current;

      setStep("processing");
      setImportError("");
      setSaveError("");
      setProgress({
        stage: "starting",
        pageNumber: 0,
        totalPages: 0,
        percent: 4,
        message: "Đang khởi tạo bộ đọc tệp PDF...",
      });

      try {
        const result = await jobManagerRef.current.runJob(
          { fileMeta, bytes },
          {
            onProgress: (nextProgress) => {
              if (!isStillValid()) return;
              setProgress(nextProgress);
            },
          },
        );

        if (!isStillValid()) return;

        setDraft(result.draft);
        setReviewNotes(result.reviewNotes);
        setPageSummaries(result.pageSummaries);
        setFullText(result.fullText);
        setSkillInputText(
          (result.draft.skill || []).map((item) => item.title).filter(Boolean).join(", "),
        );
        setStep("preview");
      } catch (error) {
        if (!isStillValid() || error?.code === "OCR_ABORTED") {
          return;
        }
        setImportError(
          error?.message || "Không thể trích xuất nội dung từ tệp PDF này. Vui lòng thử lại.",
        );
        setStep("error");
      }
    },
    [],
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      // User merely closed or cancelled the file picker dialog; keep current preview/state intact
      return;
    }

    // A new file was chosen:
    // Invalidate previous generation and cancel active extraction for EVERY new selection
    const currentGeneration = ++fileReadGenerationRef.current;
    const accountAtStart = currentUserIdRef.current;
    jobManagerRef.current?.cancelActive();
    selectedFileBytesRef.current = null;
    selectedFileMetaRef.current = null;
    setImportError("");
    setSaveError("");

    const fileMeta = {
      name: file.name,
      type: file.type,
      size: file.size,
    };

    // 1. Validate file metadata BEFORE reading file bytes into memory
    try {
      validatePdfUploadInput(fileMeta);
    } catch (metaErr) {
      if (
        !isMountedRef.current ||
        !isOpenRef.current ||
        currentGeneration !== fileReadGenerationRef.current ||
        accountAtStart !== currentUserIdRef.current
      ) {
        return;
      }
      setImportError(metaErr.message || "Tệp PDF không hợp lệ.");
      setStep("error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Guard generation, account, mount, and dialog open status after async read
      if (
        !isMountedRef.current ||
        !isOpenRef.current ||
        currentGeneration !== fileReadGenerationRef.current ||
        accountAtStart !== currentUserIdRef.current
      ) {
        return; // drop obsolete file read
      }

      const bytes = new Uint8Array(arrayBuffer);
      validatePdfHeaderBytes(bytes);

      selectedFileMetaRef.current = fileMeta;
      selectedFileBytesRef.current = bytes;
      await runExtraction(fileMeta, bytes, currentGeneration, accountAtStart);
    } catch (readErr) {
      if (
        !isMountedRef.current ||
        !isOpenRef.current ||
        currentGeneration !== fileReadGenerationRef.current ||
        accountAtStart !== currentUserIdRef.current
      ) {
        return;
      }
      if (readErr instanceof CvOcrImportError) {
        setImportError(readErr.message);
      } else {
        setImportError("Không thể đọc dữ liệu tệp từ thiết bị. Vui lòng chọn lại tệp PDF.");
      }
      setStep("error");
    }
  };

  const handleCancelProcessing = () => {
    fileReadGenerationRef.current += 1;
    jobManagerRef.current?.cancelActive();
    setStep("idle");
    setProgress({ stage: "", pageNumber: 0, totalPages: 0, percent: 0, message: "" });
    setImportError("");
  };

  const handleRetrySameFile = () => {
    if (!selectedFileMetaRef.current || !selectedFileBytesRef.current) {
      setStep("idle");
      return;
    }
    const currentGeneration = ++fileReadGenerationRef.current;
    void runExtraction(
      selectedFileMetaRef.current,
      selectedFileBytesRef.current,
      currentGeneration,
      userId,
    );
  };

  const handleChooseDifferentFile = () => {
    fileReadGenerationRef.current += 1;
    jobManagerRef.current?.cancelActive();
    setImportError("");
    setSaveError("");
    setStep("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleDialogOpenChange = (nextOpen) => {
    if (!nextOpen) {
      if (isSubmitting) return;
      clearMemoryState();
    }
    onOpenChange(nextOpen);
  };

  const updatePersonalInfo = (field, value) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            personalInfo: {
              ...(current.personalInfo || {}),
              [field]: value,
            },
          }
        : current,
    );
  };

  const updateExperienceItem = (index, field, value) => {
    setDraft((current) => {
      if (!current) return current;
      const next = [...(current.experience || [])];
      next[index] = {
        ...next[index],
        [field]:
          field === "description" ? plainTextToSafeParagraphHtml(value) : value,
      };
      return { ...current, experience: next };
    });
  };

  const addExperienceItem = () => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        experience: [
          ...(current.experience || []),
          {
            id: `ocr-exp-manual-${Date.now()}`,
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            description: "",
          },
        ],
      };
    });
  };

  const removeExperienceItem = (index) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        experience: (current.experience || []).filter((_, idx) => idx !== index),
      };
    });
  };

  const updateEducationItem = (index, field, value) => {
    setDraft((current) => {
      if (!current) return current;
      const next = [...(current.education || [])];
      next[index] = {
        ...next[index],
        [field]:
          field === "description" ? plainTextToSafeParagraphHtml(value) : value,
      };
      return { ...current, education: next };
    });
  };

  const addEducationItem = () => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        education: [
          ...(current.education || []),
          {
            id: `ocr-edu-manual-${Date.now()}`,
            title: "",
            major: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            score: "",
            description: "",
          },
        ],
      };
    });
  };

  const removeEducationItem = (index) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        education: (current.education || []).filter((_, idx) => idx !== index),
      };
    });
  };

  const handleSkillInputChange = (value) => {
    setSkillInputText(value);
    const parsedSkills = value
      .split(/[,;\n]+/)
      .map((item) => sanitizePlainText(item))
      .filter(Boolean)
      .map((title, idx) => ({ id: `ocr-skill-${idx + 1}`, title }));
    setDraft((current) => (current ? { ...current, skill: parsedSkills } : current));
  };

  const handleAppendUnmappedToCustomSection = () => {
    if (!reviewNotes.unmappedLines?.length) return;
    const textBlock = reviewNotes.unmappedLines.join("\n");
    setDraft((current) => {
      if (!current) return current;
      const nextCustom = [
        ...(current.customSections || []),
        {
          id: `ocr-custom-extra-${Date.now()}`,
          title: "Thông tin bổ sung",
          content: "",
          fields: {
            organization: false,
            location: false,
            dates: false,
            link: false,
            description: true,
          },
          items: [
            {
              id: `ocr-custom-extra-item-${Date.now()}`,
              title: "Nội dung từ CV gốc",
              organization: "",
              location: "",
              startDate: "",
              endDate: "",
              link: "",
              description: plainTextToSafeParagraphHtml(textBlock),
              details: [],
            },
          ],
        },
      ];
      return { ...current, customSections: nextCustom };
    });
    setReviewNotes((current) => ({ ...current, unmappedLines: [] }));
    showToast("Đã thêm phần văn bản chưa phân mục vào mục Thông tin bổ sung.", "info");
  };

  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard?.writeText(fullText || "");
      showToast("Đã sao chép văn bản gốc vào bộ nhớ tạm.", "success");
    } catch {
      showToast("Không thể sao chép tự động. Bạn có thể chọn và sao chép trực tiếp.", "info");
    }
  };

  const handleConfirmCreateResume = async (event) => {
    event?.preventDefault?.();
    if (!draft || submittingRef.current || isSubmitting) return;

    const cleanTitle = sanitizePlainText(draft.title);
    if (!cleanTitle) {
      setSaveError("Vui lòng nhập tên CV trước khi xác nhận tạo mới.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSaveError("");

    const payload = sanitizeConfirmableResumePayload({
      ...draft,
      title: cleanTitle,
    });

    const currentSaveGeneration = ++saveGenerationRef.current;
    const saveAccount = userId;
    const controller = new AbortController();
    saveAbortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // Guard generation, account, mount, and dialog open status after async POST
      if (
        !isMountedRef.current ||
        !isOpenRef.current ||
        currentSaveGeneration !== saveGenerationRef.current ||
        saveAccount !== currentUserIdRef.current
      ) {
        return; // drop late completion
      }

      if (!response.ok || !data?.resume?._id) {
        const message =
          data?.message ||
          (response.status === 400
            ? "Dữ liệu CV chưa hợp lệ hoặc tên CV đã tồn tại."
            : "Không thể lưu CV mới lúc này. Dữ liệu bạn đã chỉnh sửa vẫn được giữ nguyên để thử lại.");
        setSaveError(message);
        showToast(message, "error");
        return;
      }

      const createdResume = data.resume;
      clearMemoryState();
      onOpenChange(false);
      showToast("Tạo CV từ PDF thành công!", "success");
      onCreated?.(createdResume);
    } catch (error) {
      if (
        !isMountedRef.current ||
        !isOpenRef.current ||
        currentSaveGeneration !== saveGenerationRef.current ||
        saveAccount !== currentUserIdRef.current
      ) {
        return;
      }
      const isTimeout = error?.name === "AbortError";
      const message = isTimeout
        ? "Yêu cầu lưu CV phản hồi quá lâu. Vui lòng kiểm tra danh sách CV của bạn trước khi bấm lưu lại để tránh tạo trùng bản ghi."
        : "Lỗi kết nối khi lưu CV. Nội dung đã chỉnh sửa vẫn được giữ nguyên, bạn có thể bấm xác nhận lại.";
      setSaveError(message);
      showToast(message, "error");
    } finally {
      clearTimeout(timeoutId);
      if (saveAbortControllerRef.current === controller) {
        saveAbortControllerRef.current = null;
      }
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const uncertainFieldSet = useMemo(
    () => new Set(reviewNotes.uncertainFields || []),
    [reviewNotes.uncertainFields],
  );
  const groupedSkills = draft?.customSections?.find((section) => section.id === IMPORTED_SKILL_GROUPS_ID);

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px]" />
        <Dialog.Content
          aria-describedby="ocr-import-dialog-description"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-900 sm:text-lg">
                Nhập CV từ tệp PDF (Trích xuất văn bản & OCR)
              </Dialog.Title>
              <Dialog.Description
                id="ocr-import-dialog-description"
                className="mt-1 text-xs text-slate-500"
              >
                Đọc trực tiếp lớp văn bản PDF và tự động nhận diện chữ (OCR tiếng Việt & tiếng Anh) cho trang quét ảnh. Bạn luôn xem trước và chỉnh sửa trước khi tạo CV mới.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              disabled={isSubmitting}
              aria-label="Đóng hộp thoại nhập CV"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-100 bg-violet-50/70 px-3.5 py-2.5 text-xs text-violet-900">
              <span>
                <strong>Giới hạn tệp hỗ trợ:</strong> Chỉ nhận tệp PDF (.pdf) • Dung lượng tối đa <strong>5 MB</strong> • Tối đa <strong>3 trang A4</strong>.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                aria-label="Chọn tệp PDF CV"
                onChange={handleFileChange}
                className="sr-only"
              />
              {step !== "processing" && (
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={isSubmitting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-violet-300 bg-white px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  {step === "preview" ? "Chọn tệp PDF khác" : "Chọn tệp PDF"}
                </button>
              )}
            </div>

            {step === "idle" && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <DocumentArrowUpIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                  Tải lên tệp PDF CV của bạn để tạo bản nháp
                </h3>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Hệ thống xử lý an toàn ngay trên trình duyệt, không tự động ghi đè CV cũ và chỉ tạo CV mới sau khi bạn kiểm tra, xác nhận.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  Chọn tệp PDF từ máy tính
                </button>
              </div>
            )}

            {step === "processing" && (
              <div
                aria-live="polite"
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 px-6 py-10 text-center"
              >
                <div className="mb-3 h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-800">
                  {progress.message || "Đang phân tích tệp PDF..."}
                </p>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.percent || 5}
                  className="mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-200"
                    style={{ width: `${Math.max(5, Math.min(100, progress.percent || 5))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {progress.totalPages > 0
                    ? `Tiến độ: Trang ${progress.pageNumber}/${progress.totalPages} (${progress.percent || 0}%)`
                    : `Tiến độ: ${progress.percent || 5}%`}
                </p>
                <button
                  type="button"
                  onClick={handleCancelProcessing}
                  className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy xử lý
                </button>
              </div>
            )}

            {step === "error" && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50/70 p-5 text-slate-800"
              >
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-red-800">
                      Không thể nhập tệp PDF
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-red-700">{importError}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedFileBytesRef.current && (
                        <button
                          type="button"
                          onClick={handleRetrySameFile}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Thử lại tệp này
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleChooseDifferentFile}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Chọn tệp PDF khác
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "preview" && draft && (
              <form id="ocr-confirm-form" onSubmit={handleConfirmCreateResume} className="space-y-4">
                {saveError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
                  >
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Chưa thể lưu CV mới</p>
                      <p className="mt-0.5">{saveError}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                  <span className="font-semibold text-slate-700">Nguồn trích xuất theo trang:</span>
                  {pageSummaries.map((page) => (
                    <span
                      key={page.pageNumber}
                      data-ocr-page-source={page.source}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        page.source === "ocr"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Trang {page.pageNumber}:{" "}
                      {page.source === "ocr"
                        ? `Nhận diện ảnh quét (OCR${page.confidence ? ` ~${page.confidence}%` : ""})`
                        : "Văn bản gốc (PDF)"}
                    </span>
                  ))}
                </div>

                {(reviewNotes.uncertainFields?.length > 0 || reviewNotes.unmappedLines?.length > 0) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/75 px-4 py-3 text-xs text-amber-900">
                    <p className="font-semibold">
                      Lưu ý đối chiếu trước khi xác nhận:
                    </p>
                    {reviewNotes.uncertainFields?.length > 0 && (
                      <p className="mt-1">
                        Một số trường chưa có dữ liệu rõ ràng hoặc cần kiểm tra lại:{" "}
                        <strong>
                          {reviewNotes.uncertainFields
                            .map((key) => FIELD_LABELS[key] || key)
                            .join(", ")}
                        </strong>
                        .
                      </p>
                    )}
                    {reviewNotes.unmappedLines?.length > 0 && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-white p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700">
                            Dòng văn bản chưa phân mục tự động ({reviewNotes.unmappedLines.length}):
                          </span>
                          <button
                            type="button"
                            onClick={handleAppendUnmappedToCustomSection}
                            className="inline-flex h-7 items-center gap-1 rounded border border-violet-300 bg-violet-50 px-2.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Đưa vào mục Thông tin bổ sung
                          </button>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600">
                          {reviewNotes.unmappedLines.join("\n")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-12">
                  {/* Cột trái: Văn bản gốc để đối chiếu */}
                  <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 lg:col-span-5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Văn bản gốc trích xuất ({pageSummaries.length} trang)
                      </h3>
                      <button
                        type="button"
                        onClick={handleCopyRawText}
                        className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        Sao chép văn bản gốc
                      </button>
                    </div>
                    <textarea
                      readOnly
                      aria-label="Văn bản gốc trích xuất từ PDF"
                      data-ocr-raw-text="true"
                      value={fullText}
                      className="mt-2.5 min-h-[340px] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] leading-5 text-slate-700 outline-none"
                    />
                  </div>

                  {/* Cột phải: Biểu mẫu chỉnh sửa dữ liệu phân mục */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Thiết lập bản CV mới
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <label className="block sm:col-span-1">
                          <span className="text-xs font-medium text-slate-700">Tên CV *</span>
                          <input
                            type="text"
                            aria-label="Tên CV"
                            value={draft.title || ""}
                            onChange={(e) => {
                              setSaveError("");
                              setDraft((curr) => (curr ? { ...curr, title: e.target.value } : curr));
                            }}
                            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-violet-500"
                          />
                        </label>
                        <label className="block sm:col-span-1">
                          <span className="text-xs font-medium text-slate-700">Mẫu thiết kế</span>
                          <select
                            aria-label="Mẫu thiết kế"
                            value={draft.selectedTemplate || "modern"}
                            onChange={(e) =>
                              setDraft((curr) =>
                                curr ? { ...curr, selectedTemplate: e.target.value } : curr,
                              )
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                          >
                            {RESUME_TEMPLATES.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block sm:col-span-1">
                          <span className="text-xs font-medium text-slate-700">Số trang A4</span>
                          <select
                            aria-label="Số trang A4"
                            value={String(draft.pageCount || 1)}
                            onChange={(e) =>
                              setDraft((curr) =>
                                curr ? { ...curr, pageCount: Number(e.target.value) === 2 ? 2 : 1 } : curr,
                              )
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                          >
                            <option value="1">1 trang A4</option>
                            <option value="2">2 trang A4</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Thông tin cá nhân & Liên hệ
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {[
                          { key: "fullName", label: "Họ và tên" },
                          { key: "jobTitle", label: "Vị trí ứng tuyển" },
                          { key: "email", label: "Email" },
                          { key: "phone", label: "Số điện thoại" },
                          { key: "location", label: "Địa chỉ" },
                          { key: "website", label: "Website" },
                        ].map((field) => (
                          <label key={field.key} className="block">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              {field.label}
                              {uncertainFieldSet.has(field.key) && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                                  Cần kiểm tra
                                </span>
                              )}
                            </span>
                            <input
                              type="text"
                              aria-label={field.label}
                              value={draft.personalInfo?.[field.key] || ""}
                              onChange={(e) => updatePersonalInfo(field.key, e.target.value)}
                              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-violet-500"
                            />
                          </label>
                        ))}
                      </div>

                      <label className="mt-3 block">
                        <span className="text-xs font-medium text-slate-700">
                          Giới thiệu bản thân
                        </span>
                        <textarea
                          rows={2}
                          aria-label="Giới thiệu bản thân"
                          value={safeParagraphHtmlToPlainText(draft.bio || "")}
                          onChange={(e) =>
                            setDraft((curr) =>
                              curr
                                ? { ...curr, bio: plainTextToSafeParagraphHtml(e.target.value) }
                                : curr,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500"
                        />
                      </label>
                    </div>

                    {groupedSkills ? (
                      <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Kỹ năng theo nhóm</h3>
                        <dl className="mt-2 space-y-2 text-xs text-slate-700">
                          {groupedSkills.items.map((group) => (
                            <div key={group.id}>
                              <dt className="font-semibold">{group.title || "Kỹ năng chung"}</dt>
                              <dd>{safeParagraphHtmlToPlainText(group.description)}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-2 text-xs text-slate-500">Các nhóm sẽ nằm trong mục tùy chỉnh Kỹ năng. Bạn có thể chỉnh sửa chúng trong trình biên soạn CV.</p>
                      </section>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Kỹ năng ({draft.skill?.length || 0})
                            {uncertainFieldSet.has("skill") && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                                Cần kiểm tra
                              </span>
                            )}
                          </span>
                          <input
                            type="text"
                            aria-label="Danh sách kỹ năng"
                            placeholder="Nhập các kỹ năng cách nhau bởi dấu phẩy (ví dụ: React, TypeScript, Node.js)"
                            value={skillInputText}
                            onChange={(e) => handleSkillInputChange(e.target.value)}
                            className="mt-2 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-violet-500"
                          />
                        </label>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Kinh nghiệm làm việc ({draft.experience?.length || 0})
                          {uncertainFieldSet.has("experience") && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                              Cần kiểm tra
                            </span>
                          )}
                        </h3>
                        <button
                          type="button"
                          onClick={addExperienceItem}
                          className="inline-flex h-7 items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Thêm kinh nghiệm
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {(draft.experience || []).map((exp, idx) => (
                          <div
                            key={exp.id || idx}
                            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Kinh nghiệm #{idx + 1}
                              </span>
                              <button
                                type="button"
                                aria-label={`Xóa kinh nghiệm ${idx + 1}`}
                                onClick={() => removeExperienceItem(idx)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <input
                                type="text"
                                aria-label={`Vị trí kinh nghiệm ${idx + 1}`}
                                placeholder="Vị trí / Chức danh"
                                value={exp.title || ""}
                                onChange={(e) => updateExperienceItem(idx, "title", e.target.value)}
                                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
                              />
                              <input
                                type="text"
                                aria-label={`Công ty kinh nghiệm ${idx + 1}`}
                                placeholder="Công ty / Tổ chức"
                                value={exp.company || ""}
                                onChange={(e) =>
                                  updateExperienceItem(idx, "company", e.target.value)
                                }
                                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
                              />
                            </div>
                            <textarea
                              rows={2}
                              aria-label={`Mô tả kinh nghiệm ${idx + 1}`}
                              placeholder="Mô tả công việc..."
                              value={safeParagraphHtmlToPlainText(exp.description || "")}
                              onChange={(e) =>
                                updateExperienceItem(idx, "description", e.target.value)
                              }
                              className="mt-2 w-full rounded border border-slate-300 bg-white p-2 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Học vấn ({draft.education?.length || 0})
                          {uncertainFieldSet.has("education") && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                              Cần kiểm tra
                            </span>
                          )}
                        </h3>
                        <button
                          type="button"
                          onClick={addEducationItem}
                          className="inline-flex h-7 items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Thêm học vấn
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {(draft.education || []).map((edu, idx) => (
                          <div
                            key={edu.id || idx}
                            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Học vấn #{idx + 1}
                              </span>
                              <button
                                type="button"
                                aria-label={`Xóa học vấn ${idx + 1}`}
                                onClick={() => removeEducationItem(idx)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <input
                                type="text"
                                aria-label={`Bằng cấp học vấn ${idx + 1}`}
                                placeholder="Bằng cấp / Chương trình"
                                value={edu.title || ""}
                                onChange={(e) => updateEducationItem(idx, "title", e.target.value)}
                                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
                              />
                              <input
                                type="text"
                                aria-label={`Trường học vấn ${idx + 1}`}
                                placeholder="Trường / Cơ sở đào tạo"
                                value={edu.company || ""}
                                onChange={(e) =>
                                  updateEducationItem(idx, "company", e.target.value)
                                }
                                className="h-8 rounded border border-slate-300 bg-white px-2.5 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      <span>
                        Các mục khác đã nhận diện: Dự án ({draft.project?.length || 0}) • Chứng chỉ ({draft.certificate?.length || 0}) • Ngoại ngữ ({draft.language?.length || 0}) • Giải thưởng ({draft.award?.length || 0}) • Sở thích ({draft.hobby?.length || 0}) • Mục tùy chỉnh ({draft.customSections?.length || 0}). Bạn có thể tiếp tục chỉnh sửa chi tiết toàn bộ các mục này trong Trình biên soạn CV sau khi bấm xác nhận.
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
            <div className="text-xs text-slate-500">
              {step === "preview"
                ? "Kiểm tra lại thông tin đã phân mục trước khi lưu thành CV mới."
                : "Dữ liệu PDF được xử lý cục bộ và không tự động lưu khi chưa xác nhận."}
            </div>
            <div className="flex items-center gap-2.5">
              <Dialog.Close
                type="button"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Đóng
              </Dialog.Close>
              {step === "preview" && (
                <button
                  type="submit"
                  form="ocr-confirm-form"
                  disabled={isSubmitting}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {isSubmitting ? "Đang tạo CV..." : "Xác nhận và Tạo CV"}
                </button>
              )}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
