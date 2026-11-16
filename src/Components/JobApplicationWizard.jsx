import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ApplicationStatusBadge from "./ApplicationStatusBadge.jsx";
import PdfResumePreview from "./PdfResumePreview.jsx";
import { formatDate } from "../utils/dateTime.js";
import { showToast } from "../utils/toast.js";
import {
  APPLICATION_COVER_LETTER_MAX_LENGTH,
  APPLICATION_STEP_ITEMS,
  APPLICATION_STEPS,
  classifyApplicationSubmitOutcome,
  formatPdfFileSize,
  getResumeTemplateLabel,
  normalizeIdString,
  preparePdfForSubmission,
  sanitizeCoverLetterForSubmit,
  validateCandidatePdfMeta,
  validateCoverLetter,
} from "../utils/applicationSubmission.js";

export default function JobApplicationWizard({
  job,
  jobIdParam,
  jobIsUnavailable,
  jobIsExpired,
  currentUser,
  isAuthChecked,
  isCandidate,
  accountId,
  savedResumes,
  loadingResumes,
  resumesError,
  onRetryResumes,
  matchedApplication,
  loadingApplications,
  applicationsError,
  onRetryApplications,
  onApplicationConfirmed,
}) {
  const headingId = useId();
  const selectId = useId();
  const fileInputId = useId();
  const fileErrorId = useId();
  const coverLetterId = useId();
  const coverLetterErrorId = useId();

  const fileInputRef = useRef(null);
  const submitLockRef = useRef(false);
  const submitGenerationRef = useRef(0);
  const activeSubmitAbortRef = useRef(null);
  const pdfTaskIdRef = useRef(0);
  const activePdfAbortRef = useRef(null);

  const targetJobId = normalizeIdString(job?._id || job?.id || jobIdParam);
  const scopeKey = `${targetJobId}::${accountId || "guest"}::${currentUser?.role || "none"}`;
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;

  const [step, setStep] = useState(APPLICATION_STEPS.SELECT);
  const [cvSource, setCvSource] = useState("library");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");

  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step1Error, setStep1Error] = useState("");
  const [fileError, setFileError] = useState("");
  const [coverLetterError, setCoverLetterError] = useState("");
  const [submitOutcomeError, setSubmitOutcomeError] = useState(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);

  // Reset wizard state and abort any pending file read or POST when job/account/role changes.
  useEffect(() => {
    pdfTaskIdRef.current += 1;
    activePdfAbortRef.current?.abort();
    activePdfAbortRef.current = null;

    submitGenerationRef.current += 1;
    activeSubmitAbortRef.current?.abort();
    activeSubmitAbortRef.current = null;
    submitLockRef.current = false;

    setStep(APPLICATION_STEPS.SELECT);
    setCvSource("library");
    setSelectedResumeId("");
    setUploadedPdf(null);
    setShowPdfPreview(true);
    setCoverLetter("");
    setIsReadingPdf(false);
    setIsSubmitting(false);
    setStep1Error("");
    setFileError("");
    setCoverLetterError("");
    setSubmitOutcomeError(null);
    setConfirmedReceipt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [scopeKey]);

  // Abort in-flight PDF reads and POST requests cleanly on unmount.
  useEffect(() => {
    return () => {
      pdfTaskIdRef.current += 1;
      activePdfAbortRef.current?.abort();
      activePdfAbortRef.current = null;

      submitGenerationRef.current += 1;
      activeSubmitAbortRef.current?.abort();
      activeSubmitAbortRef.current = null;
      submitLockRef.current = false;
    };
  }, []);

  // Auto-select the first available RabbitCV resume when savedResumes load, or clear stale selection.
  useEffect(() => {
    if (!Array.isArray(savedResumes) || savedResumes.length === 0) {
      setSelectedResumeId("");
      return;
    }
    setSelectedResumeId((prev) => {
      if (prev && savedResumes.some((resume) => resume._id === prev)) {
        return prev;
      }
      return savedResumes[0]._id;
    });
  }, [savedResumes]);

  const selectedResume = useMemo(
    () =>
      Array.isArray(savedResumes)
        ? savedResumes.find((resume) => resume._id === selectedResumeId) || null
        : null,
    [savedResumes, selectedResumeId],
  );

  const coverLetterCheck = useMemo(
    () => validateCoverLetter(coverLetter),
    [coverLetter],
  );

  const pdfPreviewSource = useMemo(
    () => (uploadedPdf?.bytes ? { data: uploadedPdf.bytes } : null),
    [uploadedPdf?.bytes],
  );

  const clearUploadedPdf = () => {
    pdfTaskIdRef.current += 1;
    activePdfAbortRef.current?.abort();
    activePdfAbortRef.current = null;
    setIsReadingPdf(false);
    setUploadedPdf(null);
    setFileError("");
    setStep1Error("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectSource = (nextSource) => {
    if (isSubmitting) return;
    setCvSource(nextSource);
    setStep1Error("");
    setSubmitOutcomeError(null);
  };

  const handlePdfFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Always invalidate and abort any prior PDF read BEFORE running metadata checks on the new selection.
    const taskId = ++pdfTaskIdRef.current;
    activePdfAbortRef.current?.abort();
    activePdfAbortRef.current = null;
    setIsReadingPdf(false);
    setUploadedPdf(null);
    setFileError("");
    setStep1Error("");
    setSubmitOutcomeError(null);

    const metaCheck = validateCandidatePdfMeta(file);
    if (!metaCheck.valid) {
      setFileError(metaCheck.message);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const requestScope = scopeKey;
    const controller = new AbortController();
    activePdfAbortRef.current = controller;
    setIsReadingPdf(true);

    try {
      const prepared = await preparePdfForSubmission(file, {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        pdfTaskIdRef.current !== taskId ||
        scopeRef.current !== requestScope
      ) {
        return;
      }

      if (!prepared.ok) {
        setUploadedPdf(null);
        setFileError(prepared.message);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setUploadedPdf({
        file,
        name: prepared.fileName,
        size: prepared.size,
        pageCount: prepared.pageCount,
        bytes: prepared.bytes,
        fileData: prepared.fileData,
      });
      setShowPdfPreview(true);
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        controller.signal.aborted ||
        pdfTaskIdRef.current !== taskId ||
        scopeRef.current !== requestScope
      ) {
        return;
      }
      setUploadedPdf(null);
      setFileError(error?.message || "Không thể đọc tệp PDF. Vui lòng thử lại.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      if (activePdfAbortRef.current === controller) {
        activePdfAbortRef.current = null;
      }
      if (
        !controller.signal.aborted &&
        pdfTaskIdRef.current === taskId &&
        scopeRef.current === requestScope
      ) {
        setIsReadingPdf(false);
      }
    }
  };

  const handleContinueToReview = () => {
    setStep1Error("");
    setSubmitOutcomeError(null);

    if (!coverLetterCheck.valid) {
      setCoverLetterError(coverLetterCheck.message);
      return;
    }
    setCoverLetterError("");

    if (cvSource === "library") {
      if (!selectedResume) {
        setStep1Error("Vui lòng chọn một CV từ RabbitCV hoặc chuyển sang tải tệp PDF.");
        return;
      }
    } else {
      if (isReadingPdf) {
        setStep1Error("Vui lòng chờ tệp PDF kiểm tra xong trước khi tiếp tục.");
        return;
      }
      if (!uploadedPdf || fileError) {
        setFileError(fileError || "Vui lòng tải lên một tệp PDF hợp lệ (tối đa 5 MB).");
        return;
      }
    }

    setStep(APPLICATION_STEPS.REVIEW);
  };

  const handleConfirmSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (submitLockRef.current || isSubmitting || (cvSource === "pdf" && isReadingPdf)) {
      return;
    }

    if (!targetJobId) {
      setSubmitOutcomeError({
        kind: "VALIDATION_ERROR",
        message: "Không xác định được tin tuyển dụng hợp lệ để nộp hồ sơ.",
      });
      return;
    }

    if (!isCandidate) {
      setSubmitOutcomeError({
        kind: "CANDIDATE_ROLE_REQUIRED",
        message: "Chỉ tài khoản ứng viên mới có quyền gửi hồ sơ ứng tuyển.",
      });
      return;
    }

    if (jobIsUnavailable) {
      setSubmitOutcomeError({
        kind: "JOB_UNAVAILABLE",
        message: "Tin tuyển dụng này đã đóng hoặc hết hạn.",
      });
      return;
    }

    if (cvSource === "library" && !selectedResume?._id) {
      setStep(APPLICATION_STEPS.SELECT);
      setStep1Error("Vui lòng chọn một CV hợp lệ trước khi gửi.");
      return;
    }

    if (
      cvSource === "pdf" &&
      (!uploadedPdf?.fileData || !uploadedPdf?.bytes || !uploadedPdf?.name)
    ) {
      setStep(APPLICATION_STEPS.SELECT);
      setFileError("Vui lòng chọn tệp PDF hợp lệ trước khi gửi.");
      return;
    }

    if (!coverLetterCheck.valid) {
      setStep(APPLICATION_STEPS.SELECT);
      setCoverLetterError(coverLetterCheck.message);
      return;
    }

    const mySubmitGeneration = ++submitGenerationRef.current;
    activeSubmitAbortRef.current?.abort();
    const requestScope = scopeKey;
    const controller = new AbortController();
    activeSubmitAbortRef.current = controller;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitOutcomeError(null);

    const cleanCoverLetter = sanitizeCoverLetterForSubmit(coverLetter);
    const endpoint =
      cvSource === "pdf" ? "/api/jobs/apply-file" : "/api/jobs/apply";
    const bodyPayload =
      cvSource === "pdf"
        ? {
            jobId: targetJobId,
            fileData: uploadedPdf.fileData,
            fileName: uploadedPdf.name,
            coverLetter: cleanCoverLetter,
          }
        : {
            jobId: targetJobId,
            resumeId: selectedResume._id,
            coverLetter: cleanCoverLetter,
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);

      if (
        controller.signal.aborted ||
        submitGenerationRef.current !== mySubmitGeneration ||
        scopeRef.current !== requestScope
      ) {
        return;
      }

      const outcome = classifyApplicationSubmitOutcome({
        ok: response.ok,
        status: response.status,
        payload,
        expectedJobId: targetJobId,
      });

      if (outcome.kind === "CONFIRMED") {
        const nextReceipt = {
          scopeKey: requestScope,
          applicationId: outcome.applicationId,
          status: outcome.application?.status || null,
          createdAt: outcome.application?.createdAt || null,
          source: cvSource,
          cvLabel:
            cvSource === "pdf"
              ? uploadedPdf.name
              : selectedResume.title || "CV RabbitCV",
          alreadyApplied: false,
          message: outcome.message,
        };
        setConfirmedReceipt(nextReceipt);
        setUploadedPdf(null);
        showToast("Đã nộp hồ sơ ứng tuyển thành công!", "success");
        await Promise.resolve(onApplicationConfirmed?.()).catch(() => {});
        return;
      }

      if (outcome.kind === "ALREADY_APPLIED") {
        setConfirmedReceipt({
          scopeKey: requestScope,
          applicationId: "",
          status: null,
          createdAt: null,
          source: cvSource,
          cvLabel: "",
          alreadyApplied: true,
          message: outcome.message,
        });
        setUploadedPdf(null);
        showToast(outcome.message, "info");
        await Promise.resolve(onApplicationConfirmed?.()).catch(() => {});
        return;
      }

      setSubmitOutcomeError(outcome);
      if (outcome.kind === "VALIDATION_ERROR") {
        showToast(outcome.message, "error");
      }
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        controller.signal.aborted ||
        submitGenerationRef.current !== mySubmitGeneration ||
        scopeRef.current !== requestScope
      ) {
        return;
      }
      setSubmitOutcomeError({
        kind: "RETRYABLE_ERROR",
        message:
          "Không thể kết nối tới máy chủ khi gửi hồ sơ. Toàn bộ thông tin của bạn vẫn được giữ nguyên để thử lại.",
      });
    } finally {
      if (
        activeSubmitAbortRef.current === controller &&
        submitGenerationRef.current === mySubmitGeneration
      ) {
        activeSubmitAbortRef.current = null;
        submitLockRef.current = false;
        if (!controller.signal.aborted && scopeRef.current === requestScope) {
          setIsSubmitting(false);
        }
      }
    }
  };

  const sessionReceipt =
    confirmedReceipt && confirmedReceipt.scopeKey === scopeKey
      ? confirmedReceipt
      : null;

  const activeApplicationRecord = matchedApplication || sessionReceipt;
  const serverClosedError = submitOutcomeError?.kind === "JOB_UNAVAILABLE";

  const renderSectionHeader = () => (
    <div className="flex items-center justify-between gap-2">
      <h2 id={headingId} className="text-base font-bold text-slate-950">
        Ứng tuyển công việc
      </h2>
      {!jobIsUnavailable &&
        !serverClosedError &&
        isAuthChecked &&
        isCandidate &&
        !activeApplicationRecord && (
          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
            Bước {step}/3
          </span>
        )}
    </div>
  );

  // 1. Wait until auth status is confirmed before branching guest vs role views.
  if (!isAuthChecked) {
    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        <div className="mt-3 space-y-2.5" aria-busy="true">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  // 2. Guest state: require candidate login cleanly without fetching private candidate endpoints.
  if (!currentUser) {
    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        {jobIsUnavailable ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-600">
            {jobIsExpired
              ? "Tin tuyển dụng đã hết hạn và không còn nhận CV mới."
              : "Tin tuyển dụng này không còn nhận hồ sơ mới."}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3.5">
            <p className="text-xs leading-5 text-slate-700">
              Đăng nhập bằng tài khoản ứng viên để chọn CV từ RabbitCV hoặc tải PDF ứng tuyển vị trí này.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Đăng nhập để ứng tuyển
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>
    );
  }

  // 3. Non-candidate role restriction (company / admin).
  if (!isCandidate) {
    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        <div
          role="status"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900"
        >
          <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold">Chỉ dành cho tài khoản ứng viên</p>
            <p className="mt-0.5 text-amber-800">
              Tài khoản hiện tại không phải ứng viên nên không thể gửi hồ sơ ứng tuyển.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 4. Candidate already applied (either returned by shared query cache or just confirmed / 409).
  if (activeApplicationRecord) {
    const appliedStatusKey =
      matchedApplication?.status ||
      (!sessionReceipt?.alreadyApplied ? sessionReceipt?.status : null) ||
      null;
    const hasStatusSummary = Boolean(appliedStatusKey);
    const isFreshSubmission = Boolean(
      sessionReceipt && !sessionReceipt.alreadyApplied && sessionReceipt.applicationId,
    );
    const appliedAt =
      matchedApplication?.createdAt ||
      (!sessionReceipt?.alreadyApplied ? sessionReceipt?.createdAt : null) ||
      null;
    const cvLabel =
      (!sessionReceipt?.alreadyApplied && sessionReceipt?.cvLabel) ||
      matchedApplication?.fileName ||
      "";
    const hasSummaryDetails = Boolean(hasStatusSummary || cvLabel || appliedAt);

    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        <div
          role="status"
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-950">
                {isFreshSubmission ? "Nộp hồ sơ thành công" : "Đã ứng tuyển vị trí này"}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                {isFreshSubmission
                  ? "Hồ sơ của bạn đã được hệ thống ghi nhận và gửi tới nhà tuyển dụng."
                  : matchedApplication
                    ? "Bạn đã nộp hồ sơ cho công việc này trước đó."
                    : sessionReceipt?.message || "Bạn đã ứng tuyển công việc này trước đó."}
              </p>
            </div>
          </div>

          {hasSummaryDetails && (
            <dl className="mt-3 space-y-1.5 rounded-lg bg-white/90 px-3 py-2.5 text-xs text-slate-700">
              {hasStatusSummary && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Trạng thái</dt>
                  <dd>
                    <ApplicationStatusBadge status={appliedStatusKey} size="xs" />
                  </dd>
                </div>
              )}
              {cvLabel && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="shrink-0 text-slate-500">Hồ sơ đã gửi</dt>
                  <dd className="truncate font-semibold text-slate-900">
                    {cvLabel}
                  </dd>
                </div>
              )}
              {appliedAt && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="shrink-0 text-slate-500">Thời điểm gửi</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(appliedAt)}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <Link
            to="/my-applications"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Xem hồ sơ đã nộp
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // 5. Job unavailable (deleted, closed, expired, or backend 410).
  if (jobIsUnavailable || serverClosedError) {
    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        <div
          role={serverClosedError ? "alert" : "status"}
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900"
        >
          <p className="font-semibold">
            {serverClosedError
              ? submitOutcomeError.message
              : jobIsExpired
                ? "Tin tuyển dụng đã hết hạn và không còn nhận CV mới."
                : "Tin tuyển dụng này đã đóng hoặc không còn nhận hồ sơ mới."}
          </p>
          <Link
            to="/AllJobs"
            className="mt-2.5 inline-flex items-center gap-1 font-bold text-violet-700 hover:text-violet-900"
          >
            Tìm công việc khác
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // 6. Wait for candidate applications check to complete once so already-applied jobs don't flash Step 1.
  if (loadingApplications) {
    return (
      <section
        id="apply-section"
        aria-labelledby={headingId}
        className="scroll-mt-24 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
      >
        {renderSectionHeader()}
        <div className="mt-3 space-y-2.5" aria-busy="true">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="apply-section"
      aria-labelledby={headingId}
      className="scroll-mt-24 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm"
    >
      {renderSectionHeader()}

      {applicationsError && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"
        >
          <span>Không kiểm tra được lịch sử ứng tuyển trước đó.</span>
          <button
            type="button"
            onClick={() => onRetryApplications?.()}
            className="shrink-0 font-bold text-amber-800 underline hover:text-amber-950"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stepper indicator */}
      <nav aria-label="Tiến trình ứng tuyển" className="mt-3">
        <ol className="grid grid-cols-3 gap-1.5">
          {APPLICATION_STEP_ITEMS.map((item) => {
            const isActive = step === item.step;
            const isCompleted = step > item.step;
            return (
              <li
                key={item.step}
                aria-current={isActive ? "step" : undefined}
                className={`flex items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-center text-[11px] font-semibold transition ${
                  isActive
                    ? "border-violet-400 bg-violet-50 text-violet-800"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-violet-700 text-white"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? "✓" : item.step}
                </span>
                <span className="truncate">{item.shortLabel}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* STEP 1: Select CV Source & Optional Plain-Text Cover Letter */}
      {step === APPLICATION_STEPS.SELECT && (
        <div className="mt-3.5 space-y-3">
          <div
            role="radiogroup"
            aria-label="Chọn nguồn CV"
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={cvSource === "library"}
              onClick={() => handleSelectSource("library")}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                cvSource === "library"
                  ? "bg-white text-violet-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              CV từ RabbitCV
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={cvSource === "pdf"}
              onClick={() => handleSelectSource("pdf")}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                cvSource === "pdf"
                  ? "bg-white text-violet-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tải PDF từ máy
            </button>
          </div>

          {cvSource === "library" ? (
            <div className="space-y-2.5">
              <div>
                <label
                  htmlFor={selectId}
                  className="block text-xs font-semibold text-slate-700"
                >
                  Chọn CV đã lưu
                </label>

                {loadingResumes ? (
                  <div className="mt-1.5 h-9 animate-pulse rounded-lg bg-slate-100" />
                ) : resumesError ? (
                  <div
                    role="alert"
                    className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800"
                  >
                    <p>{resumesError}</p>
                    <button
                      type="button"
                      onClick={() => onRetryResumes?.()}
                      className="mt-1.5 inline-flex items-center gap-1 font-bold text-rose-900 underline"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                      Tải lại danh sách CV
                    </button>
                  </div>
                ) : savedResumes.length === 0 ? (
                  <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
                    <p>Bạn chưa có CV nào trong thư viện RabbitCV.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        to="/resume"
                        className="font-bold text-violet-700 underline hover:text-violet-900"
                      >
                        Tạo CV mới
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleSelectSource("pdf")}
                        className="font-semibold text-slate-700 underline hover:text-slate-950"
                      >
                        Hoặc tải tệp PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    id={selectId}
                    value={selectedResumeId}
                    onChange={(event) => {
                      setSelectedResumeId(event.target.value);
                      setStep1Error("");
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {savedResumes.map((resume) => (
                      <option key={resume._id} value={resume._id}>
                        {resume.title || resume.name || "CV chưa đặt tên"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedResume && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <DocumentTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">
                        {selectedResume.title || "CV chưa đặt tên"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        {getResumeTemplateLabel(selectedResume.selectedTemplate)}
                      </p>
                      {selectedResume.updatedAt && (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Cập nhật: {formatDate(selectedResume.updatedAt)}
                        </p>
                      )}
                      <Link
                        to={`/resume/view/${selectedResume._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        Xem CV này
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <label
                htmlFor={fileInputId}
                className="block text-xs font-semibold text-slate-700"
              >
                Tệp CV định dạng PDF
              </label>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept="application/pdf,.pdf"
                aria-invalid={Boolean(fileError)}
                aria-describedby={fileError ? fileErrorId : undefined}
                onChange={handlePdfFileChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  fileInputRef.current?.click();
                }}
                disabled={isSubmitting}
                className={`flex w-full flex-col items-center rounded-xl border border-dashed px-3 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  fileError
                    ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
                    : "border-violet-300 bg-violet-50/60 hover:bg-violet-50"
                }`}
              >
                <DocumentArrowUpIcon className="h-6 w-6 text-violet-600" />
                <span className="mt-1 max-w-full truncate text-xs font-semibold text-violet-700">
                  {uploadedPdf ? "Chọn tệp PDF khác" : "Chọn tệp PDF từ thiết bị"}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Chỉ nhận .pdf · tối đa 5 MB
                </span>
              </button>

              {isReadingPdf && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800"
                >
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                  <span>Đang đọc và kiểm tra tính hợp lệ của tệp PDF...</span>
                </div>
              )}

              {fileError && (
                <p
                  id={fileErrorId}
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700"
                >
                  {fileError}
                </p>
              )}

              {uploadedPdf && !isReadingPdf && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <DocumentCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {uploadedPdf.name}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Dung lượng: {formatPdfFileSize(uploadedPdf.size)}
                          {uploadedPdf.pageCount ? ` · ${uploadedPdf.pageCount} trang` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearUploadedPdf}
                      aria-label="Xóa tệp PDF đã chọn"
                      className="rounded p-1 text-slate-500 transition hover:bg-white hover:text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {pdfPreviewSource && (
                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowPdfPreview((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        {showPdfPreview ? "Ẩn bản xem trước PDF" : "Xem trước PDF"}
                      </button>
                    </div>
                  )}

                  {pdfPreviewSource && showPdfPreview && (
                    <div
                      data-testid="uploaded-pdf-preview"
                      className="max-h-56 w-full max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white p-2 [&_.cv-wrapper]:!w-full [&_.cv-wrapper]:!min-w-0 [&_.cv-wrapper]:!max-w-full [&_canvas]:!h-auto [&_canvas]:!w-full"
                    >
                      <PdfResumePreview source={pdfPreviewSource} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={coverLetterId}
                className="block text-xs font-semibold text-slate-700"
              >
                Thư ứng tuyển (tùy chọn)
              </label>
              <span
                className={`text-[11px] ${
                  coverLetterCheck.valid ? "text-slate-400" : "font-semibold text-rose-600"
                }`}
              >
                {coverLetterCheck.length.toLocaleString("vi-VN")} /{" "}
                {APPLICATION_COVER_LETTER_MAX_LENGTH.toLocaleString("vi-VN")}
              </span>
            </div>
            <textarea
              id={coverLetterId}
              rows={3}
              value={coverLetter}
              aria-invalid={Boolean(coverLetterError || !coverLetterCheck.valid)}
              aria-describedby={coverLetterError ? coverLetterErrorId : undefined}
              onChange={(event) => {
                const nextValue = event.target.value;
                setCoverLetter(nextValue);
                const check = validateCoverLetter(nextValue);
                setCoverLetterError(check.valid ? "" : check.message);
                setStep1Error("");
              }}
              placeholder="Giới thiệu ngắn gọn về kinh nghiệm hoặc lý do bạn phù hợp với vị trí này..."
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            {(coverLetterError || !coverLetterCheck.valid) && (
              <p
                id={coverLetterErrorId}
                role="alert"
                className="mt-1 text-xs text-rose-600"
              >
                {coverLetterError || coverLetterCheck.message}
              </p>
            )}
          </div>

          {step1Error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {step1Error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinueToReview}
            disabled={cvSource === "pdf" && isReadingPdf}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Tiếp tục kiểm tra
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* STEP 2: Review Information (Zero Network Submit) */}
      {step === APPLICATION_STEPS.REVIEW && (
        <div className="mt-3.5 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Vị trí ứng tuyển
              </p>
              <p className="mt-0.5 font-bold text-slate-900">{job?.title}</p>
              <p className="text-slate-600">{job?.company}</p>
            </div>

            <div className="border-t border-slate-200/80 pt-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                CV đính kèm
              </p>
              {cvSource === "library" && selectedResume ? (
                <div className="mt-1">
                  <p className="font-bold text-slate-900">
                    {selectedResume.title || "CV chưa đặt tên"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {getResumeTemplateLabel(selectedResume.selectedTemplate)}
                  </p>
                  <Link
                    to={`/resume/view/${selectedResume._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    Mở xem trước CV
                  </Link>
                </div>
              ) : uploadedPdf ? (
                <div className="mt-1 space-y-2">
                  <p className="truncate font-bold text-slate-900">
                    {uploadedPdf.name}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tệp PDF · {formatPdfFileSize(uploadedPdf.size)}
                  </p>
                  {pdfPreviewSource && (
                    <div
                      data-testid="review-pdf-preview"
                      className="max-h-52 w-full max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white p-2 [&_.cv-wrapper]:!w-full [&_.cv-wrapper]:!min-w-0 [&_.cv-wrapper]:!max-w-full [&_canvas]:!h-auto [&_canvas]:!w-full"
                    >
                      <PdfResumePreview source={pdfPreviewSource} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200/80 pt-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Thư ứng tuyển
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">
                {sanitizeCoverLetterForSubmit(coverLetter) ||
                  "Không đính kèm thư ứng tuyển."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSubmitOutcomeError(null);
                setStep(APPLICATION_STEPS.SELECT);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmitOutcomeError(null);
                setStep(APPLICATION_STEPS.CONFIRM);
              }}
              className="inline-flex flex-[1.4] items-center justify-center gap-1 rounded-lg bg-violet-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Tiếp tục xác nhận
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Explicit Single Submission & Outcome Handling */}
      {step === APPLICATION_STEPS.CONFIRM && (
        <form onSubmit={handleConfirmSubmit} className="mt-3.5 space-y-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs leading-5 text-slate-700">
            <p className="font-bold text-slate-900">Xác nhận gửi hồ sơ ứng tuyển</p>
            <p className="mt-1">
              Bạn chuẩn bị gửi{" "}
              <strong className="text-slate-900">
                {cvSource === "pdf"
                  ? uploadedPdf?.name
                  : selectedResume?.title || "CV RabbitCV"}
              </strong>{" "}
              tới <strong className="text-slate-900">{job?.company}</strong> cho vị trí{" "}
              <strong className="text-slate-900">{job?.title}</strong>.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Hệ thống sẽ lưu hồ sơ một lần duy nhất cho vị trí này.
            </p>
          </div>

          {isSubmitting && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-medium text-violet-800"
            >
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              <span>Đang gửi hồ sơ lên máy chủ, vui lòng không đóng trang...</span>
            </div>
          )}

          {submitOutcomeError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-800"
            >
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{submitOutcomeError.message}</p>
                  {submitOutcomeError.kind === "AUTH_REQUIRED" && (
                    <Link
                      to="/login"
                      className="mt-2 inline-flex items-center gap-1 font-bold text-rose-900 underline"
                    >
                      Đăng nhập lại
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {submitOutcomeError.kind === "AMBIGUOUS_RESPONSE" && (
                    <Link
                      to="/my-applications"
                      className="mt-2 inline-flex items-center gap-1 font-bold text-rose-900 underline"
                    >
                      Kiểm tra Hồ sơ đã nộp
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSubmitOutcomeError(null);
                setStep(APPLICATION_STEPS.REVIEW);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (cvSource === "pdf" && isReadingPdf)}
              className="inline-flex flex-[1.5] items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <PaperAirplaneIcon className="h-3.5 w-3.5" />
              {isSubmitting
                ? "Đang gửi hồ sơ..."
                : submitOutcomeError
                  ? "Thử gửi lại"
                  : "Xác nhận gửi hồ sơ"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
