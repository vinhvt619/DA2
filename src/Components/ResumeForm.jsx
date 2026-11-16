import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Editor from "./RichText/Editor";
import ResumeCustomSections from "./ResumeCustomSections.jsx";
import ConfirmPopUp from "./ConfirmPopUp";
import RichTextContent from "./RichTextContent.jsx";
import { showToast } from "../utils/toast.js";
import {
  formatMonthDisplayValue,
  isCurrentDateValue,
  normalizeMonthInputValue,
  normalizeResumeDateValue,
  parseMonthDisplayValue,
} from "../utils/dateInput.js";
import {
  REVIEW_CATEGORY_LABELS,
  REVIEW_PRIORITY_STYLES,
  isReviewResultEmpty,
  resolveReviewSectionTarget,
} from "../utils/resumeReview.js";

const renderInPortal = (content) =>
  typeof document === "undefined" ? content : createPortal(content, document.body);

function ResumeMonthInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={7}
      placeholder="MM/YYYY"
      value={formatMonthDisplayValue(value)}
      disabled={disabled}
      onChange={(event) => onChange(parseMonthDisplayValue(event.target.value))}
      onBlur={() => onChange(normalizeMonthInputValue(value))}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
    />
  );
}

export default function ResumeForm({
  image,
  setImage,
  personalInfo,
  setPersonalInfo,
  bio,
  setBio,
  profile,
  setProfile,
  experience,
  setExperience,
  education,
  setEducation,
  skill,
  setSkill,
  language,
  setLanguage,
  certificate,
  setCertificate,
  project,
  setProject,
  award,
  setAward,
  hobby,
  setHobby,
  customSections,
  setCustomSections,
  onReviewResume,
  isReviewingResume = false,
  resumeReview = null,
  onOpenReviewModal,
  onTriggerReview,
  onCloseReviewModal,
  onRestoreCachedReview,
  onJumpToReviewTarget,
  onReviewDialogCloseAutoFocus,
  reviewSession = null,
  isReviewStale = false,
  highlightedSectionKey = null,
}) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const [isModalProfileOpen, setIsModalProfileOpen] = useState(false);
  const [isModalExperienceOpen, setIsModalExperienceOpen] = useState(false);
  const [isModalEducationOpen, setIsModalEducationOpen] = useState(false);
  const [isModalSkillOpen, setIsModalSkillOpen] = useState(false);
  const [isModalLanguageOpen, setIsModalLanguageOpen] = useState(false);
  const [isModalCertificateOpen, setIsModalCertificateOpen] = useState(false);
  const [isModalProjectOpen, setIsModalProjectOpen] = useState(false);
  const [isModalAwardOpen, setIsModalAwardOpen] = useState(false);
  const [isModalHobbyOpen, setIsModalHobbyOpen] = useState(false);
  const [localReviewModalOpen, setLocalReviewModalOpen] = useState(false);
  const reviewTriggerRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [isCurrentExperience, setIsCurrentExperience] = useState(false);
  const [newProfile, setNewProfile] = useState({
    networkName: "",
    username: "",
    link: "",
  });
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [newEducation, setNewEducation] = useState({
    title: "",
    company: "",
    location: "",
    major: "",
    score: "",
    startDate: "",
    endDate: "",
    description: "",
  });

const [newSkill, setNewSkill] = useState({ title: "" });
  const [newLanguage, setNewLanguage] = useState({
    title: "",
    description: "",
  });
  const [newCertificate, setNewCertificate] = useState({
    title: "",
    date: "",
    publisher: "",
    description: "",
  });

  const [newProject, setNewProject] = useState({
    title: "",
    date: "",
    link: "",
    description: "",
  });

  const [newAward, setNewAward] = useState({
    title: "",
    awarder: "",
    date: "",
    description: "",
  });

  const [newHobby, setNewHobby] = useState({
    title: "",
  });

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ảnh đại diện không được lớn hơn 2 MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.onerror = () => showToast("Không thể đọc tệp ảnh này.", "error");
    reader.readAsDataURL(file);
  };

  const handleEditEducation = (item) => {
    setEditingId(item.id);
    setNewEducation({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      major: item.major || "",
      score: item.score || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      description: item.description || "",
    });
    setIsModalEducationOpen(true);
  };
  const handleDeleteEducation = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa mục học vấn này không?",
      onConfirm: () => {
        setEducation(education.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditSkill = (item) => {
    setEditingId(item.id);
setNewSkill({ title: item.title });
    setIsModalSkillOpen(true);
  };
  const handleDeleteSkill = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa kỹ năng này không?",
      onConfirm: () => {
        setSkill(skill.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditLanguage = (item) => {
    setEditingId(item.id);
    setNewLanguage({
      title: item.title,
      description: item.description,
    });
    setIsModalLanguageOpen(true);
  };
  const handleDeleteLanguage = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa ngoại ngữ này không?",
      onConfirm: () => {
        setLanguage(language.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditCertificate = (item) => {
    setEditingId(item.id);
    setNewCertificate({
      title: item.title || "",
      description: item.description || "",
      date: normalizeResumeDateValue(item.date),
      publisher: item.publisher || "",
    });
    setIsModalCertificateOpen(true);
  };
  const handleDeleteCertificate = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa chứng chỉ này không?",
      onConfirm: () => {
        setCertificate(certificate.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditProject = (item) => {
    setEditingId(item.id);
    setNewProject({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      date: normalizeResumeDateValue(item.date),
      link: item.link || "",
      description: item.description || "",
    });
    setIsModalProjectOpen(true);
  };
  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa dự án này không?",
      onConfirm: () => {
        setProject(project.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditAward = (item) => {
    setEditingId(item.id);
    setNewAward({
      title: item.title || "",
      awarder: item.awarder || "",
      date: normalizeResumeDateValue(item.date),
      description: item.description || "",
    });
    setIsModalAwardOpen(true);
  };
  const handleDeleteAward = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa giải thưởng này không?",
      onConfirm: () => {
        setAward(award.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  const handleEditHobby = (item) => {
    setEditingId(item.id);
    setNewHobby({
      title: item.title,
    });
    setIsModalHobbyOpen(true);
  };
  const handleDeleteHobby = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa sở thích này không?",
      onConfirm: () => {
        setHobby(hobby.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  const handleDeleteExperience = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa kinh nghiệm làm việc này không?",
      onConfirm: () => {
        setExperience(experience.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };
  const handleEditProfile = (item) => {
    setEditingId(item.id);
    setNewProfile({
      networkName: item.networkName,
      username: item.username,
      link: item.link || "",
    });
    setIsModalProfileOpen(true);
  };
  const handleEditExperience = (item) => {
    setEditingId(item.id);
    setIsCurrentExperience(isCurrentDateValue(item.endDate));
    setNewExperience({
      title: item.title || "",
      company: item.company || "",
      location: item.location || "",
      startDate: normalizeMonthInputValue(item.startDate),
      endDate: normalizeMonthInputValue(item.endDate),
      description: item.description || "",
    });
    setIsModalExperienceOpen(true);
  };

  const handleDeleteProfile = (e, id) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa tài khoản mạng xã hội này không?",
      onConfirm: () => {
        setProfile(profile.filter((item) => item.id !== id));
        setConfirmState({ isOpen: false, message: "", onConfirm: null });
      },
    });
  };

  const effectiveReviewOpen = reviewSession
    ? Boolean(reviewSession.open)
    : localReviewModalOpen;
  const effectiveReviewStep = reviewSession
    ? reviewSession.step
    : isReviewingResume
      ? "loading"
      : resumeReview
        ? "result"
        : "idle";
  const effectiveReviewResult = reviewSession
    ? reviewSession.result
    : resumeReview;
  const effectiveReviewError = reviewSession?.errorMessage || "";
  const isEffectiveReviewLoading = effectiveReviewStep === "loading";
  const hasCachedReviewResult = Boolean(effectiveReviewResult);
  const isEmptyReviewResult =
    effectiveReviewResult && isReviewResultEmpty(effectiveReviewResult);

  const closeAllItemModals = () => {
    setIsModalProfileOpen(false);
    setIsModalExperienceOpen(false);
    setIsModalEducationOpen(false);
    setIsModalSkillOpen(false);
    setIsModalLanguageOpen(false);
    setIsModalCertificateOpen(false);
    setIsModalProjectOpen(false);
    setIsModalAwardOpen(false);
    setIsModalHobbyOpen(false);
  };

  const handleOpenReviewClick = async () => {
    if (onOpenReviewModal) {
      onOpenReviewModal();
      return;
    }
    setLocalReviewModalOpen(true);
    const completed = await onReviewResume?.();
    if (completed === false) setLocalReviewModalOpen(false);
  };

  const handleTriggerReviewClick = () => {
    (onTriggerReview || onReviewResume)?.();
  };

  const handleCloseReviewClick = () => {
    if (onCloseReviewModal) {
      onCloseReviewModal();
      return;
    }
    setLocalReviewModalOpen(false);
  };

  const handleJumpTarget = (target) => {
    if (!target) return;
    closeAllItemModals();
    onJumpToReviewTarget?.(target);
  };

  const handleReviewModalCloseAutoFocus = (event) => {
    onReviewDialogCloseAutoFocus?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    const triggerEl = reviewTriggerRef.current;
    if (!triggerEl || triggerEl.disabled) return;
    triggerEl.focus({ preventScroll: true });
    window.requestAnimationFrame(() => {
      if (reviewTriggerRef.current && !reviewTriggerRef.current.disabled) {
        reviewTriggerRef.current.focus({ preventScroll: true });
      }
    });
  };

  const getSectionContainerClass = (sectionKey, baseClass = "") => {
    const isHighlighted = highlightedSectionKey === sectionKey;
    return [
      baseClass,
      "scroll-mt-16 transition-all duration-300",
      isHighlighted
        ? "rounded-xl bg-violet-50/40 ring-2 ring-violet-400/80 ring-offset-2 p-2.5 -mx-2.5"
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="w-full bg-white overflow-y-auto h-full">
      {/* Form header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Thông tin CV
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {hasCachedReviewResult && !isEffectiveReviewLoading && (
            <span
              className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${
                isReviewStale
                  ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
              }`}
            >
              {isReviewStale ? "Bản review cũ" : "Đã có kết quả"}
            </span>
          )}
          <button
            ref={reviewTriggerRef}
            type="button"
            onClick={handleOpenReviewClick}
            disabled={isEffectiveReviewLoading}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SparklesIcon className="h-4 w-4" />
            {isEffectiveReviewLoading ? "Đang review..." : "Review toàn bộ CV"}
          </button>
        </div>
      </div>

      <Dialog.Root
        open={effectiveReviewOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleCloseReviewClick();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[1000] bg-slate-950/45 backdrop-blur-[1px]" />
          <Dialog.Content
            onCloseAutoFocus={handleReviewModalCloseAutoFocus}
            className="fixed left-1/2 top-1/2 z-[1001] flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl focus:outline-none"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <SparklesIcon className="h-5 w-5 shrink-0 text-violet-600" />
                <Dialog.Title className="truncate text-sm font-bold text-slate-900">
                  Review toàn bộ CV
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Đóng kết quả review"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Xem đánh giá CV theo tiêu chí, điểm mạnh, góp ý chỉnh sửa theo mục và mở nhanh đúng mục để tự cập nhật.
            </Dialog.Description>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {effectiveReviewStep === "loading" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="grid min-h-[300px] place-items-center px-5 py-12"
                >
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Đang phân tích CV...
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Bạn có thể đóng cửa sổ này để hủy lượt review đang chạy.
                    </p>
                  </div>
                </div>
              ) : effectiveReviewStep === "error" ? (
                <div className="px-4 py-6 sm:px-5">
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-red-900"
                  >
                    <div className="flex items-start gap-2.5">
                      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-red-900">
                          Không thể hoàn tất review CV
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-red-800">
                          {effectiveReviewError ||
                            "Không thể review CV lúc này. Vui lòng thử lại."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleTriggerReviewClick}
                            className="inline-flex h-8 items-center rounded-md bg-red-700 px-3 text-xs font-bold text-white transition hover:bg-red-800"
                          >
                            Thử lại
                          </button>
                          {hasCachedReviewResult && onRestoreCachedReview && (
                            <button
                              type="button"
                              onClick={onRestoreCachedReview}
                              className="inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-800 transition hover:bg-red-100/60"
                            >
                              Xem kết quả trước đó
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : effectiveReviewResult ? (
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  {isReviewStale && (
                    <div
                      role="status"
                      data-review-stale-banner
                      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-900"
                    >
                      <strong className="font-bold">Bản review cũ:</strong>{" "}
                      Nhận xét này được tạo từ phiên bản CV trước khi bạn chỉnh sửa. Bạn vẫn có thể xem lại góp ý bên dưới hoặc bấm{" "}
                      <strong>Review lại</strong> ở cuối hộp thoại để cập nhật đánh giá mới.
                    </div>
                  )}

                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-700 text-white">
                      <strong className="text-2xl">
                        {Math.round(effectiveReviewResult.overallScore || 0)}
                      </strong>
                      <span className="text-[10px] font-bold uppercase">
                        Điểm CV
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {effectiveReviewResult.summary ||
                        (isEmptyReviewResult
                          ? "AI chưa trả về nhận xét chi tiết nào cho phiên bản CV hiện tại."
                          : "Chưa có nhận xét tổng quan.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 border-b border-slate-200 py-4 sm:grid-cols-5">
                    {Object.entries(REVIEW_CATEGORY_LABELS).map(
                      ([key, label]) => (
                        <div
                          key={key}
                          className="px-2 py-2 text-center sm:border-r sm:last:border-r-0"
                        >
                          <strong className="block text-base text-slate-900">
                            {Math.round(
                              effectiveReviewResult.categories?.[key] || 0,
                            )}
                          </strong>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {label}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {isEmptyReviewResult && (
                    <div
                      data-review-empty-state
                      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600"
                    >
                      Chưa có điểm tốt, đề xuất chỉnh sửa hay mục còn thiếu cụ thể nào được trả về cho phiên bản CV này. Bạn có thể tự chỉnh sửa tiếp hoặc bấm{" "}
                      <strong>Review lại</strong> sau khi bổ sung thêm nội dung.
                    </div>
                  )}

                  {effectiveReviewResult.strengths?.length > 0 && (
                    <section className="border-b border-slate-200 py-5">
                      <h3 className="text-xs font-bold uppercase text-emerald-700">
                        Điểm tốt
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {effectiveReviewResult.strengths.map(
                          (strength, idx) => (
                            <li
                              key={`${idx}-${strength}`}
                              className="flex gap-2 text-sm leading-5 text-slate-700"
                            >
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              {strength}
                            </li>
                          ),
                        )}
                      </ul>
                    </section>
                  )}

                  {effectiveReviewResult.improvements?.length > 0 && (
                    <section className="border-b border-slate-200 py-5">
                      <h3 className="text-xs font-bold uppercase text-slate-800">
                        Điểm cần sửa và cách sửa
                      </h3>
                      <div className="mt-3 space-y-3">
                        {effectiveReviewResult.improvements.map(
                          (item, index) => {
                            const priority =
                              REVIEW_PRIORITY_STYLES[item.priority] ||
                              REVIEW_PRIORITY_STYLES.medium;
                            const target = resolveReviewSectionTarget(
                              item.section,
                            );
                            return (
                              <article
                                key={`${item.section}-${index}`}
                                data-review-improvement
                                data-review-section={item.section}
                                data-review-target-key={target?.key || ""}
                                className="rounded-lg border border-slate-200 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {item.section}
                                    </h4>
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${priority.className}`}
                                    >
                                      {priority.label}
                                    </span>
                                  </div>
                                  {target ? (
                                    <button
                                      type="button"
                                      onClick={() => handleJumpTarget(target)}
                                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                                    >
                                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                      {target.actionLabel}
                                    </button>
                                  ) : (
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                      Tham khảo chung
                                    </span>
                                  )}
                                </div>
                                {item.issue && (
                                  <p className="mt-2 text-xs leading-5 text-slate-600">
                                    <strong className="text-slate-800">
                                      Cần sửa:
                                    </strong>{" "}
                                    {item.issue}
                                  </p>
                                )}
                                {item.fix && (
                                  <p className="mt-1.5 text-xs leading-5 text-slate-600">
                                    <strong className="text-violet-700">
                                      Cách sửa:
                                    </strong>{" "}
                                    {item.fix}
                                  </p>
                                )}
                              </article>
                            );
                          },
                        )}
                      </div>
                    </section>
                  )}

                  {effectiveReviewResult.missingSections?.length > 0 && (
                    <section className="pt-5">
                      <h3 className="text-xs font-bold uppercase text-amber-700">
                        Mục còn thiếu
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {effectiveReviewResult.missingSections.map(
                          (section) => {
                            const target =
                              resolveReviewSectionTarget(section);
                            return target ? (
                              <div
                                key={section}
                                data-review-missing-section
                                data-review-section={section}
                                data-review-target-key={target.key}
                                className="inline-flex items-center gap-2 rounded-md bg-amber-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200"
                              >
                                <span>{section}</span>
                                <button
                                  type="button"
                                  onClick={() => handleJumpTarget(target)}
                                  aria-label={`${target.actionLabel} ${section}`}
                                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-200 transition hover:bg-violet-50"
                                >
                                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                                  {target.actionLabel}
                                </button>
                              </div>
                            ) : (
                              <span
                                key={section}
                                data-review-missing-section
                                data-review-section={section}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                              >
                                {section}
                              </span>
                            );
                          },
                        )}
                      </div>
                    </section>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={handleCloseReviewClick}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Đóng
              </button>
              {effectiveReviewStep !== "error" && (
                <button
                  type="button"
                  onClick={handleTriggerReviewClick}
                  disabled={isEffectiveReviewLoading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-violet-700 px-3 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Review lại
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="p-5 space-y-6">
      {/* Avatar */}
      <div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Ảnh đại diện</div>
        <label
          htmlFor="avatar"
          className={`w-20 h-20 rounded-xl cursor-pointer flex items-center justify-center overflow-hidden border-2 transition-all ${
            image ? "border-transparent" : "border-dashed border-gray-300 hover:border-[#9346F5] bg-gray-50 hover:bg-violet-50"
          }`}
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-gray-400 text-[11px] font-semibold text-center px-2">Chọn ảnh</span>
          )}
        </label>

        <input
          id="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onImageChange}
          className="hidden"
        />
      </div>
      <section
        data-resume-section="personalInfo"
        aria-labelledby="resume-section-heading-personalInfo"
        className={getSectionContainerClass("personalInfo", "w-full")}
      >
        <h3
          id="resume-section-heading-personalInfo"
          data-resume-section-heading="personalInfo"
          tabIndex={-1}
          className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 focus:outline-none"
        >
          Thông tin cá nhân
        </h3>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="resume-personal-fullName"
              className="block text-xs font-semibold text-gray-500 mb-1.5"
            >
              Họ và tên
            </label>
            <input
              id="resume-personal-fullName"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label
              htmlFor="resume-personal-jobTitle"
              className="block text-xs font-semibold text-gray-500 mb-1.5"
            >
              Tiêu đề / Vị trí
            </label>
            <input
              id="resume-personal-jobTitle"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
              value={personalInfo.jobTitle}
              onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })}
              placeholder="Frontend Developer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="resume-personal-email"
                className="block text-xs font-semibold text-gray-500 mb-1.5"
              >
                Email
              </label>
              <input
                id="resume-personal-email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label
                htmlFor="resume-personal-website"
                className="block text-xs font-semibold text-gray-500 mb-1.5"
              >
                Trang web
              </label>
              <input
                id="resume-personal-website"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.website}
                onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label
                htmlFor="resume-personal-phone"
                className="block text-xs font-semibold text-gray-500 mb-1.5"
              >
                Điện thoại
              </label>
              <input
                id="resume-personal-phone"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                placeholder="0901 234 567"
              />
            </div>
            <div>
              <label
                htmlFor="resume-personal-location"
                className="block text-xs font-semibold text-gray-500 mb-1.5"
              >
                Địa điểm
              </label>
              <input
                id="resume-personal-location"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/10 transition-all"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>
          </div>
        </div>
      </section>
      <div className="border-t border-gray-100" />
      <section
        data-resume-section="bio"
        aria-labelledby="resume-section-heading-bio"
        className={getSectionContainerClass("bio")}
      >
        <h3
          id="resume-section-heading-bio"
          data-resume-section-heading="bio"
          tabIndex={-1}
          className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600 focus:outline-none"
        >
          Tiểu sử
        </h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <Editor content={bio} onChange={setBio} className="min-h-[160px]" />
        </div>
      </section>
      <div className="border-t border-gray-100" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">Profile / Mạng xã hội</div>
        </div>
      {profile.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditProfile(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.networkName}</div>
              <div className="text-sm text-gray-500">{item.username}</div>
              {item.link && (
                <div className="text-xs text-blue-500 truncate max-w-[200px]">
                  {item.link}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteProfile(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewProfile({ networkName: "", username: "", link: "" });
          setIsModalProfileOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm mục mới
      </div>

      {isModalProfileOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Profile" : "Thêm Profile Mới"}
              </h3>
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mạng lưới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: LinkedIn, GitHub"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.networkName}
                  onChange={(e) =>
                    setNewProfile({
                      ...newProfile,
                      networkName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: nguyenvan_a"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.username}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Đường dẫn
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newProfile.link}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, link: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProfileOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProfile.networkName || !newProfile.username) {
                    alert("Vui lòng điền tên mạng lưới và tên người dùng!");
                    return;
                  }

                  if (editingId) {
                    setProfile(
                      profile.map((item) =>
                        item.id === editingId
                          ? { ...newProfile, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setProfile([
                      ...profile,
                      { ...newProfile, id: Date.now() },
                    ]);
                  }

                  setIsModalProfileOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newProfile.networkName || !newProfile.username
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newProfile.networkName || !newProfile.username}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="border-t border-gray-100 my-4" />
      <section
        data-resume-section="experience"
        aria-labelledby="resume-section-heading-experience"
        className={getSectionContainerClass("experience")}
      >
        <div className="flex items-center justify-between mb-3 mt-4">
          <h3
            id="resume-section-heading-experience"
            data-resume-section-heading="experience"
            tabIndex={-1}
            className="text-xs font-bold text-gray-600 uppercase tracking-widest focus:outline-none"
          >
            Kinh nghiệm làm việc
          </h3>
        </div>
      {experience.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditExperience(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{item.title}</div>
              <div className="text-xs text-gray-500">{item.company}</div>
              <div className="text-xs text-gray-400">{item.location}</div>
              <div className="text-xs text-gray-400">
                {item.startDate} - {item.endDate}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteExperience(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <RichTextContent
            className="mt-1.5 text-xs text-gray-600"
            content={item.description}
          />
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="experience"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setIsCurrentExperience(false);
          setNewExperience({
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            description: "",
          });
          setIsModalExperienceOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm kinh nghiệm làm việc
      </button>
      {isModalExperienceOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Kinh Nghiệm" : "Thêm Kinh Nghiệm Mới"}
              </h3>
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newExperience.company}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newExperience.title}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian bắt đầu
                  </label>
                  <ResumeMonthInput
                    value={newExperience.startDate}
                    onChange={(value) =>
                      setNewExperience({
                        ...newExperience,
                        startDate: value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian kết thúc
                  </label>
                  <ResumeMonthInput
                    value={newExperience.endDate}
                    disabled={isCurrentExperience}
                    onChange={(value) =>
                      setNewExperience({
                        ...newExperience,
                        endDate: value,
                      })
                    }
                  />
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={isCurrentExperience}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        setIsCurrentExperience(isCurrent);
                        if (isCurrent) {
                          setNewExperience({
                            ...newExperience,
                            endDate: "",
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#9346F5] focus:ring-[#9346F5]"
                    />
                    Đang làm việc tại đây
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newExperience.location}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newExperience.description}
                  onChange={(html) =>
                    setNewExperience({ ...newExperience, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalExperienceOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newExperience.company || !newExperience.title) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
                    return;
                  }

                  const experienceData = {
                    ...newExperience,
                    endDate: isCurrentExperience
                      ? "Hiện tại"
                      : newExperience.endDate,
                  };

                  if (editingId) {
                    setExperience(
                      experience.map((item) =>
                        item.id === editingId
                          ? { ...experienceData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setExperience([
                      ...experience,
                      { ...experienceData, id: Date.now() },
                    ]);
                  }

                  setIsModalExperienceOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newExperience.company || !newExperience.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newExperience.company || !newExperience.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="education"
        aria-labelledby="resume-section-heading-education"
        className={getSectionContainerClass("education")}
      >
        <h3
          id="resume-section-heading-education"
          data-resume-section-heading="education"
          tabIndex={-1}
          className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 focus:outline-none"
        >
          Học vấn
        </h3>
      {education.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditEducation(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500">{item.company}</div>
              {(item.major || item.score) && (
                <div className="text-sm text-gray-500">
                  {item.major}{item.major && item.score ? " - " : ""}{item.score}
                </div>
              )}
              <div className="text-xs text-gray-500">{item.location}</div>
              <div className="text-xs text-gray-500">
                {item.startDate} - {item.endDate}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteEducation(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <RichTextContent
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            content={item.description}
          />
        </div>
      ))}

      <button
        type="button"
        data-resume-add-button="education"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewEducation({
            title: "",
            company: "",
            location: "",
            major: "",
            score: "",
            startDate: "",
            endDate: "",
            description: "",
          });
          setIsModalEducationOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm học vấn
      </button>
      {isModalEducationOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Học Vấn" : "Thêm Học Vấn Mới"}
              </h3>
              <button
                onClick={() => setIsModalEducationOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Trường <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại học Bách Khoa"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.company}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bằng cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cử nhân"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.title}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Lĩnh vực học tập
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kỹ thuật phần mềm"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.major}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        major: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bảng điểm
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 3.8/4.0"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newEducation.score}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        score: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian bắt đầu
                  </label>
                  <ResumeMonthInput
                    value={newEducation.startDate}
                    onChange={(value) =>
                      setNewEducation({
                        ...newEducation,
                        startDate: value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian kết thúc
                  </label>
                  <ResumeMonthInput
                    value={newEducation.endDate}
                    onChange={(value) =>
                      setNewEducation({
                        ...newEducation,
                        endDate: value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newEducation.location}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newEducation.description}
                  onChange={(html) =>
                    setNewEducation({ ...newEducation, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalEducationOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newEducation.company || !newEducation.title) {
                    alert("Vui lòng điền tên trường và bằng cấp!");
                    return;
                  }

                  if (editingId) {
                    setEducation(
                      education.map((item) =>
                        item.id === editingId
                          ? { ...newEducation, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setEducation([
                      ...education,
                      { ...newEducation, id: Date.now() },
                    ]);
                  }

                  setIsModalEducationOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newEducation.company || !newEducation.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newEducation.company || !newEducation.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="skill"
        aria-labelledby="resume-section-heading-skill"
        className={getSectionContainerClass("skill")}
      >
        <h3
          id="resume-section-heading-skill"
          data-resume-section-heading="skill"
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          Kỹ năng
        </h3>
      {skill.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditSkill(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>

            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteSkill(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="skill"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
setNewSkill({ title: "" });
          setIsModalSkillOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm kỹ năng
      </button>
      {isModalSkillOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="skill-dialog-title" className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 id="skill-dialog-title" className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng mới"}
              </h3>
              <button type="button" aria-label="Đóng kỹ năng" title="Đóng" onClick={() => setIsModalSkillOpen(false)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(event) => {
              event.preventDefault();
              const title = newSkill.title.trim();
              if (!title) return;
              setSkill(editingId ? skill.map((item) => item.id === editingId ? { title, id: editingId } : item)
                : [...skill, { title, id: crypto.randomUUID() }]);
              setIsModalSkillOpen(false);
            }}>
              <div className="p-5">
                <label htmlFor="skill-name" className="block text-sm font-semibold text-gray-600">Tên kỹ năng</label>
                <input id="skill-name" autoFocus required maxLength={200} placeholder="Ví dụ: ReactJS, Lãnh đạo"
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none"
                  value={newSkill.title} onChange={(event) => setNewSkill({ title: event.target.value })} />
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalSkillOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200">Hủy</button>
                <button type="submit" disabled={!newSkill.title.trim()} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#9346F5] hover:bg-[#7e39d1] disabled:opacity-50 disabled:cursor-not-allowed">
                  {editingId ? "Lưu thay đổi" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="language"
        aria-labelledby="resume-section-heading-language"
        className={getSectionContainerClass("language")}
      >
        <h3
          id="resume-section-heading-language"
          data-resume-section-heading="language"
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          Ngoại ngữ
        </h3>
      {language.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditLanguage(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteLanguage(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="language"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewLanguage({
            title: "",
            description: "",
          });
          setIsModalLanguageOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm ngoại ngữ
      </button>
      {isModalLanguageOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Ngoại Ngữ" : "Thêm Ngoại Ngữ Mới"}
              </h3>
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên ngoại ngữ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newLanguage.title}
                    onChange={(e) =>
                      setNewLanguage({
                        ...newLanguage,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newLanguage.description}
                    onChange={(e) =>
                      setNewLanguage({
                        ...newLanguage,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalLanguageOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newLanguage.title || !newLanguage.description) {
                    alert("Vui lòng điền tên công ty và chức vụ!");
                    return;
                  }

                  if (editingId) {
                    setLanguage(
                      language.map((item) =>
                        item.id === editingId
                          ? { ...newLanguage, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setLanguage([
                      ...language,
                      { ...newLanguage, id: Date.now() },
                    ]);
                  }

                  setIsModalLanguageOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newLanguage.title || !newLanguage.description
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newLanguage.title || !newLanguage.description}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="certificate"
        aria-labelledby="resume-section-heading-certificate"
        className={getSectionContainerClass("certificate")}
      >
        <h3
          id="resume-section-heading-certificate"
          data-resume-section-heading="certificate"
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          Chứng chỉ
        </h3>
      {certificate.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditCertificate(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.publisher}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteCertificate(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <RichTextContent
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            content={item.description}
          />
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="certificate"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewCertificate({
            title: "",
            publisher: "",
            date: "",
            description: "",
          });
          setIsModalCertificateOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm chứng chỉ
      </button>
      {isModalCertificateOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Chứng Chỉ" : "Thêm Chứng Chỉ Mới"}
              </h3>
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Amazon, Google"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.title}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bên cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhân viên văn phòng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.publisher}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        publisher: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newCertificate.date}
                    onChange={(e) =>
                      setNewCertificate({
                        ...newCertificate,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newCertificate.description}
                  onChange={(html) =>
                    setNewCertificate({ ...newCertificate, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalCertificateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newCertificate.title || !newCertificate.publisher) {
                    alert("Vui lòng điền tên chứng chỉ và bên cấp!");
                    return;
                  }

                  const certificateData = {
                    ...newCertificate,
                    date: normalizeResumeDateValue(newCertificate.date),
                  };

                  if (editingId) {
                    setCertificate(
                      certificate.map((item) =>
                        item.id === editingId
                          ? { ...certificateData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setCertificate([
                      ...certificate,
                      { ...certificateData, id: Date.now() },
                    ]);
                  }

                  setIsModalCertificateOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newCertificate.title || !newCertificate.publisher
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newCertificate.title || !newCertificate.publisher}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="project"
        aria-labelledby="resume-section-heading-project"
        className={getSectionContainerClass("project")}
      >
        <h3
          id="resume-section-heading-project"
          data-resume-section-heading="project"
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          Dự án
        </h3>
      {project.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditProject(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteProject(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <RichTextContent
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            content={item.description}
          />
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="project"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewProject({
            title: "",
            date: "",
            link: "",
            description: "",
          });
          setIsModalProjectOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm dự án
      </button>
      {isModalProjectOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
              </h3>
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dự án sinh viên xuất sắc"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.date}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Link dự án (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newProject.link}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        link: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả (Tùy chọn)
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newProject.description}
                  onChange={(html) =>
                    setNewProject({ ...newProject, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalProjectOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newProject.title) {
                    alert("Vui lòng điền tên dự án!");
                    return;
                  }

                  const projectData = {
                    ...newProject,
                    date: normalizeResumeDateValue(newProject.date),
                  };

                  if (editingId) {
                    setProject(
                      project.map((item) =>
                        item.id === editingId
                          ? { ...projectData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setProject([
                      ...project,
                      { ...projectData, id: Date.now() },
                    ]);
                  }

                  setIsModalProjectOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newProject.title
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newProject.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      <div className="border-t border-gray-100 my-4"></div>
      <section
        data-resume-section="award"
        aria-labelledby="resume-section-heading-award"
        className={getSectionContainerClass("award")}
      >
        <h3
          id="resume-section-heading-award"
          data-resume-section-heading="award"
          tabIndex={-1}
          className="font-semibold focus:outline-none"
        >
          Giải thưởng
        </h3>
      {award.map((item) => (
        <div
          key={item.id}
          data-resume-section-item
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditAward(item)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.awarder}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteAward(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <RichTextContent
            className="mt-1.5 text-xs text-gray-500 line-clamp-2"
            content={item.description}
          />
        </div>
      ))}
      <button
        type="button"
        data-resume-add-button="award"
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewAward({
            title: "",
            awarder: "",
            date: "",
            description: "",
          });
          setIsModalAwardOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm giải thưởng
      </button>
      {isModalAwardOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Giải Thưởng" : "Thêm Giải Thưởng Mới"}
              </h3>
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tên giải thưởng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giải thưởng sinh viên xuất sắc"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.title}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Bên trao tặng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Trường Đại học Hà Nội"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.awarder}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        awarder: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="Ví dụ: 2023 hoặc 2023-10"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                    value={newAward.date}
                    onChange={(e) =>
                      setNewAward({
                        ...newAward,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mô tả
                </label>
                <Editor
                  key={editingId ? `edit-${editingId}` : "new"}
                  content={newAward.description}
                  onChange={(html) =>
                    setNewAward({ ...newAward, description: html })
                  }
                  className="h-64"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalAwardOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newAward.title || !newAward.awarder) {
                    alert("Vui lòng điền tên giải thưởng và bên trao tặng!");
                    return;
                  }

                  const awardData = {
                    ...newAward,
                    date: normalizeResumeDateValue(newAward.date),
                  };

                  if (editingId) {
                    setAward(
                      award.map((item) =>
                        item.id === editingId
                          ? { ...awardData, id: editingId }
                          : item,
                      ),
                    );
                  } else {
                    setAward([...award, { ...awardData, id: Date.now() }]);
                  }

                  setIsModalAwardOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${
                    !newAward.title || !newAward.awarder
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-[#9346F5] hover:bg-[#7e39d1]"
                  }
                `}
                disabled={!newAward.title || !newAward.awarder}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>

      <div className="border-t border-gray-100 my-4"></div>
      <div className="font-semibold ">Sở thích</div>
      {hobby.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 p-3 px-4 hover:bg-gray-50 cursor-pointer rounded-xl mt-2 relative group"
          onClick={() => handleEditHobby(item)}
        >
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm text-gray-800">{item.title}</div>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                className="p-1 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                onClick={(e) => handleDeleteHobby(e, item.id)}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <div
        className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-[#9346F5] text-gray-400 hover:text-[#9346F5] py-2 cursor-pointer rounded-xl text-xs font-semibold hover:bg-violet-50/30 transition-all"
        onClick={() => {
          setEditingId(null);
          setNewHobby({ title: "" });
          setIsModalHobbyOpen(true);
        }}
      >
        <PlusIcon className="w-4 h-4" />
        Thêm sở thích
      </div>
      {isModalHobbyOpen && renderInPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in fade-in zoom-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Chỉnh Sửa Sở Thích" : "Thêm Sở Thích Mới"}
              </h3>
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Sở thích <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đọc sách, Nghe nhạc"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9346F5] focus:ring-2 focus:ring-[#9346F5]/10 outline-none transition-all"
                  value={newHobby.title}
                  onChange={(e) => setNewHobby({ ...newHobby, title: e.target.value })}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalHobbyOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newHobby.title) {
                    showToast("Vui lòng điền tên sở thích!", "error");
                    return;
                  }

                  if (editingId) {
                    setHobby(hobby.map((item) => item.id === editingId ? { ...newHobby, id: editingId } : item));
                  } else {
                    setHobby([...hobby, { ...newHobby, id: Date.now() }]);
                  }

                  setIsModalHobbyOpen(false);
                }}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                  ${!newHobby.title ? "bg-purple-300 cursor-not-allowed" : "bg-[#9346F5] hover:bg-[#7e39d1]"}
                `}
                disabled={!newHobby.title}
              >
                {editingId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <div className="px-5 pb-5">
        <ResumeCustomSections sections={customSections} onChange={setCustomSections} />
      </div>
      {confirmState.isOpen && renderInPortal(
        <ConfirmPopUp
          message={confirmState.message}
          confirm={confirmState.onConfirm}
          cancel={() => setConfirmState({ isOpen: false, message: "", onConfirm: null })}
        />
      )}
    </div>
  );
}
