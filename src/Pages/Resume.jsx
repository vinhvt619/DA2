import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmPopUp from "../Components/ConfirmPopUp.jsx";
import ResumeAiFillDialog from "../Components/ResumeAiFillDialog.jsx";
import useResumeAutosave from "../hooks/useResumeAutosave.js";
import { AUTOSAVE_IDLE_DELAY_MS, validateResumeDraftForSave } from "../utils/resumeSavePolicy.js";
import ResumeForm from "../Components/ResumeForm";
import ResumeLayoutEditor from "../Components/ResumeLayoutEditor.jsx";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import useCvZoom from "../hooks/useCvZoom";
import useResumePrint from "../hooks/useResumePrint.js";
import useResumeHistory from "../hooks/useResumeHistory.js";
import { normalizeResumeLayout, setTemplateLayout, resetTemplateLayout, customSectionKey } from "../utils/resumeLayout.js";
import { requestAi } from "../utils/aiApi.js";
import { normalizeCustomSections, normalizeSkillNames } from "../../shared/resumeCustomSections.js";
import { RESUME_TEMPLATE_NAMES as TEMPLATE_NAMES } from "../../shared/resumeTemplates.js";
import { normalizeResumePageCount, RESUME_PAGE_COUNTS } from "../../shared/resumePages.js";
import { showToast } from "../utils/toast.js";
import {
  applySelectedAiProposals,
  buildAiFillProposals,
  cleanGeneratedText,
  DEFAULT_RESUME_TITLE,
  prepareAiFillInput,
} from "../utils/resumeAiFill.js";
import {
  buildReviewSnapshotSignature,
  hasReviewableResumeContent,
  validateAndNormalizeReviewResult,
} from "../utils/resumeReview.js";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const DEFAULT_TITLE = DEFAULT_RESUME_TITLE;
const INITIAL_AI_FILL_SESSION = {
  open: false,
  step: "prompt",
  targetRole: "",
  roleValidationError: "",
  errorMessage: "",
  hasCareerContext: false,
  proposals: [],
  selectedIds: [],
  conflicts: [],
};
const INITIAL_REVIEW_SESSION = {
  open: false,
  step: "idle",
  result: null,
  errorMessage: "",
  snapshotSignature: "",
  docId: null,
  accountId: null,
};
const DEFAULT_PERSONAL_INFO = {
  fullName: "",
  jobTitle: "",
  email: "",
  website: "",
  phone: "",
  location: "",
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
  skill: normalizeSkillNames(mapIds(data.skill)),
  language: mapIds(data.language),
  certificate: mapIds(data.certificate),
  project: mapIds(data.project),
  award: mapIds(data.award),
  hobby: mapIds(data.hobby),
  selectedTemplate: normalizeTemplate(data.selectedTemplate),
  pageCount: normalizeResumePageCount(data.pageCount),
  customSections: normalizeCustomSections(data.customSections),
  layout: normalizeResumeLayout(data.layout, normalizeCustomSections(data.customSections)),
});

export default function CreateResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeId: routeResumeId } = useParams();
  const routeResumeKey = routeResumeId || location.state?.cvId || null;
  const previewRef = useCvZoom();
  const printContentRef = useRef(null);
  const titleInputRef = useRef(null);
  const loadedResumeRef = useRef({ id: null, userId: null, attempt: -1 });
  const prevRouteContextRef = useRef({ routeId: routeResumeKey, userId: null });
  const pendingInternalRedirectRef = useRef(null);
  const isLeavingRef = useRef(false);

  const [showForm, setShowForm] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [showTemplates, setShowTemplates] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1600,
  );
  const [promotedDocId, setPromotedDocId] = useState(null);
  const _id = routeResumeKey !== null ? routeResumeKey : promotedDocId;
  const initialResume = useMemo(
    () => normalizeResume({ selectedTemplate: location.state?.template }),
    [location.state?.template],
  );
  const {
    value: resumeData,
    setters,
    update: updateResume,
    reset: resetResume,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useResumeHistory(initialResume);
  const {
    title,
    selectedTemplate,
    image,
    bio,
    personalInfo,
    profile,
    experience,
    education,
    skill,
    language,
    certificate,
    project,
    award,
    hobby,
    layout,
    customSections,
    pageCount,
  } = resumeData;
  const {
    title: setTitle,
    selectedTemplate: setSelectedTemplate,
    image: setImage,
    bio: setBio,
    personalInfo: setPersonalInfo,
    profile: setProfile,
    experience: setExperience,
    education: setEducation,
    skill: setSkill,
    language: setLanguage,
    certificate: setCertificate,
    project: setProject,
    award: setAward,
    hobby: setHobby,
  } = setters;
  const setCustomSections = useCallback(
    (value) =>
      updateResume((current) => {
        const next =
          typeof value === "function" ? value(current.customSections) : value;
        return {
          ...current,
          customSections: next,
          layout: normalizeResumeLayout(current.layout, next),
        };
      }),
    [updateResume],
  );
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [isLoadingResume, setIsLoadingResume] = useState(Boolean(routeResumeKey));
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [reviewSession, setReviewSession] = useState(INITIAL_REVIEW_SESSION);
  const [highlightedSectionKey, setHighlightedSectionKey] = useState(null);
  const [aiSession, setAiSession] = useState(INITIAL_AI_FILL_SESSION);
  const isReviewModalOpen = reviewSession.open;
  const isAiFillingResume = aiSession.open && aiSession.step === "loading";
  const isAiModalOpen = aiSession.open;

  const { currentUser, isAuthChecked } = useAuth();
  const currentUserId =
    currentUser?._id || currentUser?.id || currentUser?.username || null;
  const isCandidateAllowed =
    Boolean(currentUser) &&
    currentUser.role !== "admin" &&
    currentUser.role !== "company";

  const currentUserIdRef = useRef(currentUserId);
  const currentUserRef = useRef(currentUser);
  const resumeDataRef = useRef(resumeData);
  const routeResumeKeyRef = useRef(routeResumeKey);
  const docIdRef = useRef(_id);
  const loadAttemptRef = useRef(loadAttempt);
  const loadErrorRef = useRef(loadError);
  const isCandidateAllowedRef = useRef(isCandidateAllowed);
  const reviewSessionRef = useRef(reviewSession);
  const aiGenerationRef = useRef(0);
  const aiAbortControllerRef = useRef(null);
  const reviewGenerationRef = useRef(0);
  const reviewAbortControllerRef = useRef(null);
  const pendingReviewTargetRef = useRef(null);
  const reviewFocusTimersRef = useRef([]);
  const highlightTimerRef = useRef(null);
  const aiMountedRef = useRef(true);
  currentUserIdRef.current = currentUserId;
  currentUserRef.current = currentUser;
  resumeDataRef.current = resumeData;
  routeResumeKeyRef.current = routeResumeKey;
  docIdRef.current = _id;
  loadAttemptRef.current = loadAttempt;
  loadErrorRef.current = loadError;
  isCandidateAllowedRef.current = isCandidateAllowed;
  reviewSessionRef.current = reviewSession;

  const clearReviewFocusTimers = useCallback(() => {
    reviewFocusTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    reviewFocusTimersRef.current = [];
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const cancelReviewRequest = useCallback(() => {
    reviewGenerationRef.current += 1;
    if (reviewAbortControllerRef.current) {
      reviewAbortControllerRef.current.abort();
      reviewAbortControllerRef.current = null;
    }
  }, []);

  const resetReviewSession = useCallback(() => {
    cancelReviewRequest();
    clearReviewFocusTimers();
    pendingReviewTargetRef.current = null;
    setHighlightedSectionKey(null);
    setReviewSession(INITIAL_REVIEW_SESSION);
  }, [cancelReviewRequest, clearReviewFocusTimers]);

  const cancelAiFillSession = useCallback(() => {
    aiGenerationRef.current += 1;
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setAiSession(INITIAL_AI_FILL_SESSION);
  }, []);

  useEffect(() => {
    aiMountedRef.current = true;
    return () => {
      aiMountedRef.current = false;
      aiGenerationRef.current += 1;
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      reviewGenerationRef.current += 1;
      if (reviewAbortControllerRef.current) {
        reviewAbortControllerRef.current.abort();
        reviewAbortControllerRef.current = null;
      }
      reviewFocusTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      reviewFocusTimersRef.current = [];
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);

  const {
    saveState,
    setContext: setSaveContext,
    hydrateClean,
    syncDraft,
    triggerManualSave,
    triggerRetry,
    cancelPendingWork,
    getSnapshot: getSaveSnapshot,
  } = useResumeAutosave({
    debounceMs: AUTOSAVE_IDLE_DELAY_MS,
    onCommitted: ({ mode, isFirstCreate, savedId }) => {
      setTitleError("");
      if (isFirstCreate && savedId) {
        loadedResumeRef.current = {
          id: savedId,
          userId: currentUserIdRef.current,
          attempt: loadAttemptRef.current,
        };
        setReviewSession((prev) =>
          prev.result &&
          prev.docId === null &&
          prev.accountId === currentUserIdRef.current
            ? { ...prev, docId: savedId }
            : prev,
        );
        setPromotedDocId(savedId);
        pendingInternalRedirectRef.current = `/resume/${savedId}`;
        navigate(`/resume/${savedId}`, { replace: true });
      }
      if (mode === "manual" || mode === "retry") {
        showToast("Lưu CV thành công!", "success");
      }
    },
    onFailureFeedback: ({ mode, classifiedError, isValidation, field }) => {
      const shouldFocusTitle =
        classifiedError.isDuplicateTitle || (isValidation && field === "title");
      if (shouldFocusTitle) {
        setTitleError(classifiedError.userMessage);
        if (mode === "manual" || mode === "retry") {
          showToast(classifiedError.userMessage, "error");
          window.requestAnimationFrame(() => {
            titleInputRef.current?.focus();
            if (classifiedError.isDuplicateTitle) {
              titleInputRef.current?.select();
            }
          });
        }
        return;
      }
      if (mode === "manual" || mode === "retry") {
        showToast(classifiedError.userMessage, "error");
      }
    },
  });

  const isDirty = saveState.isDirty;
  const isSaving = saveState.isManualSaving;
  const lastSaved = saveState.lastSavedAt;

  const applyResume = useCallback(
    (data) => {
      const normalized = normalizeResume(data);
      resetResume(normalized);
      return normalized;
    },
    [resetResume],
  );

  // Sync validation or duplicate-title error from coordinator cleanly
  useEffect(() => {
    const err = saveState.lastError;
    if (
      saveState.status === "failed" &&
      err &&
      (err.isDuplicateTitle || err.kind === "validation")
    ) {
      setTitleError(err.userMessage);
    } else {
      setTitleError("");
    }
  }, [saveState.status, saveState.lastError]);

  const shouldBlockNavigation = useCallback(
    ({ currentLocation, nextLocation }) => {
      if (isLeavingRef.current) return false;
      if (!/^\/resume(\/|$)/i.test(currentLocation.pathname)) return false;
      if (!isCandidateAllowedRef.current) return false;
      if (
        pendingInternalRedirectRef.current &&
        nextLocation.pathname === pendingInternalRedirectRef.current
      ) {
        return false;
      }
      const sameLocation =
        currentLocation.pathname === nextLocation.pathname &&
        currentLocation.search === nextLocation.search;
      if (sameLocation) return false;
      if (loadErrorRef.current) return false;
      return getSaveSnapshot().hasUnsavedOrInFlightWork;
    },
    [getSaveSnapshot],
  );

  const blocker = useBlocker(shouldBlockNavigation);
  const isBlockerOpen = blocker.state === "blocked";

  useEffect(() => {
    if (
      pendingInternalRedirectRef.current &&
      location.pathname === pendingInternalRedirectRef.current
    ) {
      pendingInternalRedirectRef.current = null;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (blocker.state === "blocked" && !isCandidateAllowed) {
      cancelPendingWork();
      cancelAiFillSession();
      resetReviewSession();
      blocker.proceed();
    }
  }, [
    blocker,
    isCandidateAllowed,
    cancelPendingWork,
    cancelAiFillSession,
    resetReviewSession,
  ]);

  // Keep coordinator context synchronized with loading, auth, AI fill, and leave modal
  useEffect(() => {
    setSaveContext({
      accountId: currentUserId,
      docId: _id,
      loading: isLoadingResume,
      loadError,
      aiFilling: isAiModalOpen,
      blockedPromptOpen: isBlockerOpen,
    });
  }, [
    _id,
    currentUserId,
    isAiModalOpen,
    isBlockerOpen,
    isLoadingResume,
    loadError,
    setSaveContext,
  ]);

  // Sync draft edits to coordinator; no-op when unhydrated or matching saved snapshot
  useEffect(() => {
    syncDraft(resumeData);
  }, [resumeData, syncDraft]);

  const historyDisabled =
    isLoadingResume ||
    Boolean(loadError) ||
    isSaving ||
    isAiModalOpen ||
    isReviewModalOpen;
  useEffect(() => {
    const handleHistoryKey = (event) => {
      if (
        historyDisabled ||
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.target.closest?.(
          "input, textarea, [contenteditable], dialog, [role='dialog']",
        )
      ) {
        return;
      }
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleHistoryKey);
    return () => window.removeEventListener("keydown", handleHistoryKey);
  }, [historyDisabled, undo, redo]);

  // Handle route/account transitions: reset cleanly when switching documents or returning to /resume
  useEffect(() => {
    const prev = prevRouteContextRef.current;
    const isPromotedNewDoc =
      Boolean(routeResumeKey) &&
      loadedResumeRef.current.id === routeResumeKey &&
      loadedResumeRef.current.userId === currentUserId;
    const routeChanged = prev.routeId !== routeResumeKey;
    const accountChanged =
      prev.userId !== null && prev.userId !== currentUserId;

    prevRouteContextRef.current = {
      routeId: routeResumeKey,
      userId: currentUserId,
    };

    if ((routeChanged || accountChanged) && !isPromotedNewDoc) {
      isLeavingRef.current = false;
      setPromotedDocId(null);
      cancelPendingWork();
      cancelAiFillSession();
      resetReviewSession();
      loadedResumeRef.current = { id: null, userId: null, attempt: -1 };
      setTitleError("");
      setLoadError("");
      if (!routeResumeKey) {
        const fresh = applyResume({
          selectedTemplate: location.state?.template,
        });
        setIsLoadingResume(false);
        hydrateClean({
          accountId: currentUserId,
          docId: null,
          resumeData: fresh,
        });
      } else {
        setIsLoadingResume(true);
      }
    } else if (routeResumeKey) {
      setPromotedDocId((prevPromotedId) =>
        prevPromotedId === routeResumeKey ? null : prevPromotedId
      );
    }
  }, [
    applyResume,
    cancelAiFillSession,
    cancelPendingWork,
    currentUserId,
    hydrateClean,
    location.state?.template,
    resetReviewSession,
    routeResumeKey,
  ]);

  const shouldWarnBeforeLeave =
    saveState.hasUnsavedOrInFlightWork && !loadError && isCandidateAllowed;

  useEffect(() => {
    if (!shouldWarnBeforeLeave) return undefined;

    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [shouldWarnBeforeLeave]);

  useEffect(() => {
    if (!isAuthChecked) return undefined;
    if (!currentUser) {
      cancelPendingWork();
      cancelAiFillSession();
      resetReviewSession();
      navigate("/login");
      return undefined;
    }

    if (!_id) {
      setIsLoadingResume(false);
      setLoadError("");
      if (!saveState.hydrated || saveState.accountId !== currentUserId) {
        hydrateClean({
          accountId: currentUserId,
          docId: null,
          resumeData: initialResume,
        });
      }
      return undefined;
    }

    if (
      loadedResumeRef.current.id === _id &&
      loadedResumeRef.current.userId === currentUserId &&
      loadedResumeRef.current.attempt === loadAttempt
    ) {
      return undefined;
    }

    const controller = new AbortController();
    const expectedId = _id;
    const expectedAccount = currentUserId;

    const fetchResumeData = async () => {
      setIsLoadingResume(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/resume/${expectedId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải CV này.");
        }

        if (
          controller.signal.aborted ||
          expectedAccount !== currentUserIdRef.current
        ) {
          return;
        }

        const normalized = applyResume(data);
        loadedResumeRef.current = {
          id: expectedId,
          userId: expectedAccount,
          attempt: loadAttempt,
        };
        hydrateClean({
          accountId: expectedAccount,
          docId: expectedId,
          resumeData: normalized,
        });
      } catch (error) {
        if (error.name === "AbortError" || controller.signal.aborted) return;
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
    cancelAiFillSession,
    cancelPendingWork,
    currentUser,
    currentUserId,
    hydrateClean,
    initialResume,
    isAuthChecked,
    loadAttempt,
    navigate,
    resetReviewSession,
    saveState.accountId,
    saveState.hydrated,
  ]);

  useEffect(() => {
    if (isAuthChecked && (!isCandidateAllowed || loadError)) {
      cancelAiFillSession();
      resetReviewSession();
    }
  }, [
    cancelAiFillSession,
    isAuthChecked,
    isCandidateAllowed,
    loadError,
    resetReviewSession,
  ]);

  const handleAiFillResume = useCallback(async (requestedRole = "") => {
    if (!isCandidateAllowedRef.current || loadErrorRef.current) {
      return;
    }

    const latestResume = resumeDataRef.current;
    const latestUser = currentUserRef.current;
    const roleInput = typeof requestedRole === "string" ? requestedRole : "";
    const basePrepared = prepareAiFillInput({
      resumeData: latestResume,
      currentUser: latestUser,
      requestedTargetRole: "",
    });
    const prepared = prepareAiFillInput({
      resumeData: latestResume,
      currentUser: latestUser,
      requestedTargetRole: roleInput,
    });

    if (!prepared.hasCareerContext) {
      aiGenerationRef.current += 1;
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      setAiSession({
        ...INITIAL_AI_FILL_SESSION,
        open: true,
        step: "prompt",
        targetRole: roleInput,
        hasCareerContext: false,
      });
      return;
    }

    const generation = ++aiGenerationRef.current;
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    const startUserId = currentUserIdRef.current;
    const startRouteKey = routeResumeKeyRef.current;
    const startDocId = docIdRef.current;

    setAiSession({
      ...INITIAL_AI_FILL_SESSION,
      open: true,
      step: "loading",
      targetRole: roleInput,
      hasCareerContext: basePrepared.hasCareerContext,
    });

    const isRequestStillValid = () =>
      aiMountedRef.current &&
      aiGenerationRef.current === generation &&
      !controller.signal.aborted &&
      currentUserIdRef.current === startUserId &&
      routeResumeKeyRef.current === startRouteKey &&
      docIdRef.current === startDocId &&
      isCandidateAllowedRef.current;

    try {
      const data = await requestAi("/resume/fill", {
        resumeContext: prepared.resumeContext,
      }, { signal: controller.signal, requireResultObject: true });
      if (!isRequestStillValid()) return;

      const generated = data?.result || {};
      const { proposals } = buildAiFillProposals({
        resumeData: resumeDataRef.current,
        currentUser: currentUserRef.current,
        requestedTargetRole: prepared.requestedRoleClean,
        generatedResult: generated,
      });
      if (!isRequestStillValid()) return;

      const defaultSelectedIds = proposals
        .filter((item) => item.defaultSelected)
        .map((item) => item.id);

      setAiSession((prev) => ({
        ...prev,
        open: true,
        step: proposals.length > 0 ? "preview" : "empty",
        proposals,
        selectedIds: defaultSelectedIds,
        conflicts: [],
        errorMessage: "",
      }));
    } catch (error) {
      if (!isRequestStillValid() || error?.name === "AbortError") {
        return;
      }
      setAiSession((prev) => ({
        ...prev,
        open: true,
        step: "error",
        errorMessage: error?.message || "Không thể xử lý yêu cầu AI lúc này.",
      }));
    } finally {
      if (aiAbortControllerRef.current === controller) {
        aiAbortControllerRef.current = null;
      }
    }
  }, []);

  const handleSubmitAiRole = useCallback(
    (roleValue) => {
      const cleanRole = cleanGeneratedText(roleValue, 160);
      if (!cleanRole) {
        setAiSession((prev) => ({
          ...prev,
          roleValidationError: "Hãy nhập vị trí mong muốn.",
        }));
        showToast("Hãy nhập vị trí mong muốn.", "error");
        return;
      }
      void handleAiFillResume(cleanRole);
    },
    [handleAiFillResume],
  );

  const handleToggleAiProposal = useCallback((proposalId) => {
    setAiSession((prev) => {
      const next = new Set(prev.selectedIds);
      if (next.has(proposalId)) {
        next.delete(proposalId);
      } else {
        next.add(proposalId);
      }
      return { ...prev, selectedIds: Array.from(next), conflicts: [] };
    });
  }, []);

  const handleSelectSafeDefaults = useCallback(() => {
    setAiSession((prev) => ({
      ...prev,
      selectedIds: prev.proposals
        .filter((item) => item.defaultSelected)
        .map((item) => item.id),
      conflicts: [],
    }));
  }, []);

  const handleSelectAllProposals = useCallback(() => {
    setAiSession((prev) => ({
      ...prev,
      selectedIds: prev.proposals.map((item) => item.id),
      conflicts: [],
    }));
  }, []);

  const handleDeselectAllProposals = useCallback(() => {
    setAiSession((prev) => ({
      ...prev,
      selectedIds: [],
      conflicts: [],
    }));
  }, []);

  const handleConfirmAiProposals = useCallback(() => {
    const proposalsSnapshot = aiSession.proposals;
    const selectedSnapshot = new Set(aiSession.selectedIds);
    const outcome = applySelectedAiProposals(
      resumeDataRef.current,
      proposalsSnapshot,
      selectedSnapshot,
    );

    if (!outcome.changed) {
      if (outcome.conflicts.length > 0) {
        setAiSession((prev) => ({
          ...prev,
          conflicts: outcome.conflicts,
        }));
        showToast(
          "Dữ liệu CV đã thay đổi nên các mục đã chọn được giữ nguyên. Hãy tạo lại đề xuất mới.",
          "error",
        );
      }
      return;
    }

    updateResume((current) => {
      const result = applySelectedAiProposals(
        current,
        proposalsSnapshot,
        selectedSnapshot,
      );
      return result.changed ? result.nextResume : current;
    });

    cancelAiFillSession();
    if (outcome.conflicts.length > 0) {
      showToast(
        `Đã áp dụng ${outcome.appliedCount} mục. ${outcome.conflicts.length} mục đã có nội dung mới nên được bỏ qua.`,
        "success",
      );
    } else {
      showToast(
        `Đã áp dụng ${outcome.appliedCount} đề xuất vào CV. Hãy kiểm tra trước khi lưu.`,
        "success",
      );
    }
  }, [
    aiSession.proposals,
    aiSession.selectedIds,
    cancelAiFillSession,
    updateResume,
  ]);

  const currentReviewSnapshotSignature = useMemo(
    () => buildReviewSnapshotSignature(resumeData),
    [resumeData],
  );
  const isReviewStale = Boolean(
    reviewSession.result &&
      reviewSession.snapshotSignature &&
      currentReviewSnapshotSignature !== reviewSession.snapshotSignature,
  );

  const tryFocusEditorSection = useCallback((sectionKey) => {
    if (typeof document === "undefined") return false;
    const sectionEl = document.querySelector(
      `[data-resume-section="${sectionKey}"]`,
    );
    if (!sectionEl) return false;

    sectionEl.scrollIntoView({
      behavior: "auto",
      block: "start",
      inline: "nearest",
    });

    if (
      document.activeElement &&
      sectionEl.contains(document.activeElement)
    ) {
      return true;
    }

    let focusTarget;
    if (sectionKey === "personalInfo") {
      focusTarget = sectionEl.querySelector("input, textarea, select");
    } else if (sectionKey === "bio") {
      focusTarget = sectionEl.querySelector('[contenteditable="true"]');
    } else {
      const items = sectionEl.querySelectorAll("[data-resume-section-item]");
      if (items.length === 0) {
        focusTarget = sectionEl.querySelector(
          `[data-resume-add-button="${sectionKey}"]`,
        );
      } else {
        focusTarget = sectionEl.querySelector(
          `[data-resume-section-heading="${sectionKey}"]`,
        );
      }
    }

    const resolvedNode =
      focusTarget ||
      sectionEl.querySelector(`[data-resume-section-heading="${sectionKey}"]`) ||
      sectionEl;
    resolvedNode.focus?.({ preventScroll: true });
    return Boolean(
      document.activeElement && sectionEl.contains(document.activeElement),
    );
  }, []);

  const executePendingReviewTarget = useCallback(() => {
    const target = pendingReviewTargetRef.current;
    if (!target || !aiMountedRef.current) return;
    pendingReviewTargetRef.current = null;
    clearReviewFocusTimers();

    if (target.type === "layout_editor") {
      const timerId = window.setTimeout(() => {
        if (aiMountedRef.current) {
          setIsLayoutEditorOpen(true);
        }
      }, 0);
      reviewFocusTimersRef.current.push(timerId);
      return;
    }

    if (target.type === "editor_section" && target.sectionKey) {
      setHighlightedSectionKey(target.sectionKey);
      highlightTimerRef.current = window.setTimeout(() => {
        if (aiMountedRef.current) {
          setHighlightedSectionKey((prev) =>
            prev === target.sectionKey ? null : prev,
          );
        }
      }, 2400);

      window.requestAnimationFrame(() => {
        if (!aiMountedRef.current) return;
        tryFocusEditorSection(target.sectionKey);
        const settleId = window.setTimeout(() => {
          if (aiMountedRef.current) {
            tryFocusEditorSection(target.sectionKey);
          }
        }, 230);
        reviewFocusTimersRef.current.push(settleId);
      });
    }
  }, [clearReviewFocusTimers, tryFocusEditorSection]);

  const handleReviewResume = useCallback(async () => {
    if (!isCandidateAllowedRef.current || loadErrorRef.current) {
      return false;
    }

    const latestResume = resumeDataRef.current;
    if (!hasReviewableResumeContent(latestResume)) {
      const message =
        "Hãy nhập tiểu sử, kỹ năng, kinh nghiệm hoặc học vấn trước khi review CV.";
      showToast(message, "error");
      if (reviewSessionRef.current?.open) {
        setReviewSession((prev) => ({
          ...prev,
          open: true,
          step: "error",
          errorMessage: message,
        }));
      }
      return false;
    }

    const generation = ++reviewGenerationRef.current;
    if (reviewAbortControllerRef.current) {
      reviewAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    reviewAbortControllerRef.current = controller;

    const startUserId = currentUserIdRef.current;
    const startRouteKey = routeResumeKeyRef.current;
    const startDocId = docIdRef.current;
    const snapshotSignature = buildReviewSnapshotSignature(latestResume);

    setReviewSession((prev) => ({
      ...prev,
      open: true,
      step: "loading",
      errorMessage: "",
    }));

    const isRequestStillValid = () =>
      aiMountedRef.current &&
      reviewGenerationRef.current === generation &&
      !controller.signal.aborted &&
      currentUserIdRef.current === startUserId &&
      routeResumeKeyRef.current === startRouteKey &&
      docIdRef.current === startDocId &&
      isCandidateAllowedRef.current &&
      !loadErrorRef.current;

    try {
      const data = await requestAi("/resume/review", {
        resumeId: startDocId || undefined,
        resumeContext: {
          title: latestResume.title,
          personalInfo: latestResume.personalInfo,
          bio: latestResume.bio,
          profile: latestResume.profile,
          experience: latestResume.experience,
          education: latestResume.education,
          skill: latestResume.skill,
          language: latestResume.language,
          certificate: latestResume.certificate,
          project: latestResume.project,
          award: latestResume.award,
          hobby: latestResume.hobby,
          selectedTemplate: latestResume.selectedTemplate,
          customSections: latestResume.customSections,
        },
      }, { signal: controller.signal });
      if (!isRequestStillValid()) return false;

      const validatedResult = validateAndNormalizeReviewResult(data?.result);
      if (!isRequestStillValid()) return false;

      setReviewSession({
        open: true,
        step: "result",
        result: validatedResult,
        errorMessage: "",
        snapshotSignature,
        docId: startDocId,
        accountId: startUserId,
      });
      return true;
    } catch (error) {
      if (!isRequestStillValid() || error?.name === "AbortError") {
        return false;
      }
      setReviewSession((prev) => ({
        ...prev,
        open: true,
        step: "error",
        errorMessage:
          error?.message || "Không thể review CV lúc này. Vui lòng thử lại.",
      }));
      return false;
    } finally {
      if (reviewAbortControllerRef.current === controller) {
        reviewAbortControllerRef.current = null;
      }
    }
  }, []);

  const handleOpenReviewModal = useCallback(() => {
    if (!isCandidateAllowedRef.current || loadErrorRef.current) return;
    const current = reviewSessionRef.current;
    if (
      current.result &&
      current.docId === docIdRef.current &&
      current.accountId === currentUserIdRef.current
    ) {
      setReviewSession((prev) => ({
        ...prev,
        open: true,
        step: "result",
        errorMessage: "",
      }));
      return;
    }
    void handleReviewResume();
  }, [handleReviewResume]);

  const handleCloseReviewModal = useCallback(() => {
    cancelReviewRequest();
    setReviewSession((prev) => {
      const hasValidCache =
        Boolean(prev.result) &&
        prev.docId === docIdRef.current &&
        prev.accountId === currentUserIdRef.current;
      return hasValidCache
        ? { ...prev, open: false, step: "result", errorMessage: "" }
        : INITIAL_REVIEW_SESSION;
    });
  }, [cancelReviewRequest]);

  const handleRestoreCachedReview = useCallback(() => {
    setReviewSession((prev) =>
      prev.result
        ? { ...prev, open: true, step: "result", errorMessage: "" }
        : prev,
    );
  }, []);

  const handleJumpToReviewTarget = useCallback(
    (target) => {
      if (!target) return;
      pendingReviewTargetRef.current = target;
      if (target.type === "editor_section") {
        setShowForm(true);
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setShowTemplates(false);
        }
      }
      setReviewSession((prev) => ({
        ...prev,
        open: false,
        errorMessage: "",
      }));
      const fallbackTimer = window.setTimeout(() => {
        if (pendingReviewTargetRef.current) {
          executePendingReviewTarget();
        }
      }, 60);
      reviewFocusTimersRef.current.push(fallbackTimer);
    },
    [executePendingReviewTarget],
  );

  const handleReviewDialogCloseAutoFocus = useCallback(
    (event) => {
      if (pendingReviewTargetRef.current) {
        event?.preventDefault?.();
        executePendingReviewTarget();
      }
    },
    [executePendingReviewTarget],
  );

  const handleSave = () => {
    void triggerManualSave();
  };

  const handleBack = () => {
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

  const draftValidation = useMemo(
    () => validateResumeDraftForSave(resumeData, TEMPLATE_NAMES),
    [resumeData],
  );

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

  const saveDisabled = isSaving || isAiFillingResume || isLoadingResume || Boolean(loadError);

  return (
    <div className="resume-editor-root flex h-screen flex-col overflow-hidden bg-[var(--page-background)] font-sans page-transition">
      <div className="resume-editor-toolbar z-30 flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={undo} disabled={!canUndo || historyDisabled} aria-label="Hoàn tác CV" title="Hoàn tác CV (Ctrl+Z)" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUturnLeftIcon className="h-4 w-4" /></button>
          <button type="button" onClick={redo} disabled={!canRedo || historyDisabled} aria-label="Làm lại CV" title="Làm lại CV (Ctrl+Shift+Z)" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUturnRightIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => setIsLayoutEditorOpen(true)} disabled={historyDisabled} aria-label="Chỉnh bố cục CV" title="Chỉnh bố cục CV" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"><Squares2X2Icon className="h-4 w-4" /></button>
        </div>
        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap">
          <fieldset className="flex shrink-0 items-center gap-2" disabled={historyDisabled}>
            <legend className="sr-only">Số trang A4</legend>
            <div className="flex rounded-md border border-slate-200 p-0.5">
              {RESUME_PAGE_COUNTS.map((count) => <label key={count} className={`relative cursor-pointer rounded px-2.5 py-1 text-xs font-semibold ${pageCount === count ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-slate-50"}`}>
                <input type="radio" name="resume-page-count" value={count} checked={pageCount === count} onChange={() => setters.pageCount(count)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-violet-600">{count} trang</span>
              </label>)}
            </div>
          </fieldset>
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

          {!isLoadingResume && !loadError && (
            <div
              role="status"
              aria-live="polite"
              data-resume-save-status={saveState.status}
              className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium"
            >
              {saveState.status === "saving" ? (
                <span className="text-violet-600">
                  {saveState.activeMode === "auto"
                    ? "Đang tự động lưu..."
                    : "Đang lưu..."}
                </span>
              ) : saveState.status === "retrying" ? (
                <>
                  <span className="text-amber-600">
                    Lỗi tạm thời, đang thử lại...
                  </span>
                  <button
                    type="button"
                    onClick={() => void triggerRetry()}
                    className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Thử lại
                  </button>
                </>
              ) : saveState.status === "failed" ? (
                <>
                  <span
                    title={saveState.lastError?.userMessage || ""}
                    className="inline-flex items-center gap-1 text-red-600"
                  >
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    {saveState.lastError?.statusBadge || "Lưu thất bại"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void triggerRetry()}
                    className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Thử lại
                  </button>
                </>
              ) : isDirty ? (
                <span
                  title={
                    !draftValidation.isValid
                      ? draftValidation.validationError
                      : _id
                        ? "Chưa lưu — sẽ tự động lưu sau khi dừng chỉnh sửa"
                        : "Bản nháp mới — bấm Lưu CV để tạo"
                  }
                  className={
                    !draftValidation.isValid ? "text-red-600" : "text-amber-600"
                  }
                >
                  {!draftValidation.isValid && draftValidation.field === "title"
                    ? "Thiếu tên CV"
                    : "Chưa lưu"}
                </span>
              ) : formattedTime ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                  Đã lưu lúc {formattedTime}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-5 items-center gap-1.5 sm:ml-auto sm:flex sm:w-auto">
          <button
            type="button"
            onClick={toggleForm}
            aria-label="Nội dung"
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
            aria-label="Mẫu CV"
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
            disabled={isAiFillingResume || isLoadingResume || Boolean(loadError)}
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

      <ResumeLayoutEditor open={isLayoutEditorOpen} template={selectedTemplate} layout={layout} customSections={customSections}
        sectionCounts={{ bio: bio ? 1 : 0, experience: experience.length, education: education.length,
          skill: skill.length, project: project.length, certificate: certificate.length, award: award.length,
          language: language.length, hobby: hobby.length, ...Object.fromEntries(customSections.map((item) => [customSectionKey(item.id), item.items.length])) }}
        onClose={() => setIsLayoutEditorOpen(false)}
        onSave={(zones) => {
          setters.layout(setTemplateLayout(layout, selectedTemplate, zones, customSections));
          setIsLayoutEditorOpen(false);
        }}
        onReset={() => setters.layout(resetTemplateLayout(layout, selectedTemplate, customSections))} />

      <ResumeAiFillDialog
        open={aiSession.open}
        step={aiSession.step}
        targetRole={aiSession.targetRole}
        onTargetRoleChange={(value) =>
          setAiSession((prev) => ({
            ...prev,
            targetRole: value,
            roleValidationError: "",
          }))
        }
        roleValidationError={aiSession.roleValidationError}
        errorMessage={aiSession.errorMessage}
        hasCareerContext={aiSession.hasCareerContext}
        proposals={aiSession.proposals}
        selectedIds={aiSession.selectedIds}
        conflicts={aiSession.conflicts}
        onToggleProposal={handleToggleAiProposal}
        onSelectSafeDefaults={handleSelectSafeDefaults}
        onSelectAllProposals={handleSelectAllProposals}
        onDeselectAllProposals={handleDeselectAllProposals}
        onSubmitRole={handleSubmitAiRole}
        onRetry={() => handleAiFillResume(aiSession.targetRole)}
        onEditRole={() =>
          setAiSession((prev) => ({
            ...prev,
            step: "prompt",
            errorMessage: "",
            roleValidationError: "",
          }))
        }
        onRefreshPreview={() => handleAiFillResume(aiSession.targetRole)}
        onConfirmApply={handleConfirmAiProposals}
        onCancel={cancelAiFillSession}
      />

      {saveState.status === "failed" && saveState.lastError && !titleError && (
        <div
          role="alert"
          data-resume-save-error
          className="z-20 flex items-center gap-1.5 border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 sm:px-4"
        >
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          <span>{saveState.lastError.userMessage}</span>
        </div>
      )}

      {isBlockerOpen && (
        <ConfirmPopUp
          message={
            saveState.isSaving
              ? "CV đang được lưu. Nếu rời trang ngay bây giờ, thay đổi mới có thể chưa hoàn tất. Bạn vẫn muốn rời trang?"
              : "CV có thay đổi chưa lưu. Bạn vẫn muốn rời trang?"
          }
          confirm={() => {
            isLeavingRef.current = true;
            cancelPendingWork();
            blocker.proceed();
          }}
          cancel={() => {
            blocker.reset();
          }}
        />
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
              customSections={customSections}
              setCustomSections={setCustomSections}
              onOpenReviewModal={handleOpenReviewModal}
              onTriggerReview={handleReviewResume}
              onCloseReviewModal={handleCloseReviewModal}
              onRestoreCachedReview={handleRestoreCachedReview}
              onJumpToReviewTarget={handleJumpToReviewTarget}
              onReviewDialogCloseAutoFocus={handleReviewDialogCloseAutoFocus}
              reviewSession={reviewSession}
              isReviewStale={isReviewStale}
              highlightedSectionKey={highlightedSectionKey}
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

              <div ref={printContentRef} className={`cv-wrapper ${pageCount === 2 ? "cv-document" : ""} mb-10 rounded-sm bg-white shadow-lg print:w-full print:shadow-none`}>
                <ResumePreview
                  pageCount={pageCount}
                  selectedTemplate={selectedTemplate}
                  layout={layout}
                  customSections={customSections}
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
