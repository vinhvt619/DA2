import { RESUME_TEMPLATE_NAMES } from "../../shared/resumeTemplates.js";
import {
  AUTOSAVE_IDLE_DELAY_MS,
  buildResumeSavePayload,
  classifyResumeSaveError,
  getResumeSignature,
  MAX_TRANSIENT_AUTO_RETRIES,
  SAVE_REQUEST_TIMEOUT_MS,
  TRANSIENT_RETRY_DELAY_MS,
  validateResumeDraftForSave,
} from "./resumeSavePolicy.js";

/**
 * Coordinates manual and debounced CV autosave requests using a single-flight lock,
 * latest-edit coalescing, captured-snapshot dirty tracking, and async generation guards.
 */
export function createResumeSaveCoordinator({
  saveRequest,
  scheduleTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  now = () => Date.now(),
  isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false),
  templateNames = RESUME_TEMPLATE_NAMES,
  debounceMs = AUTOSAVE_IDLE_DELAY_MS,
  retryDelayMs = TRANSIENT_RETRY_DELAY_MS,
  timeoutMs = SAVE_REQUEST_TIMEOUT_MS,
  maxAutoRetries = MAX_TRANSIENT_AUTO_RETRIES,
  onStateChange = () => {},
  onCommitted = () => {},
  onFailureFeedback = () => {},
} = {}) {
  let disposed = false;
  let generation = 0;

  let accountId = null;
  let docId = null;
  let hydrated = false;
  let loading = false;
  let loadError = "";
  let blockedPromptOpen = false;
  let aiFilling = false;

  let latestDraft = null;
  let latestSignature = null;
  let lastEditAt = 0;
  let savedSignature = null;

  let inFlight = null;
  let queuedSave = null;
  let debounceTimer = null;
  let retryTimer = null;
  let validationTimer = null;

  let transientRetryCount = 0;
  let retryDeadlineAt = null;
  let lastFailedSignature = null;
  let rejectedDuplicateTitle = null;

  let status = "idle"; // idle | dirty | saving | retrying | saved | failed
  let activeMode = null; // null | auto | manual | retry
  let lastSavedAt = null;
  let lastError = null;

  const isDirtyNow = () =>
    savedSignature !== null &&
    latestSignature !== null &&
    latestSignature !== savedSignature;

  const clearDebounceTimers = () => {
    if (debounceTimer !== null) {
      clearTimer(debounceTimer);
      debounceTimer = null;
    }
    if (validationTimer !== null) {
      clearTimer(validationTimer);
      validationTimer = null;
    }
  };

  const clearRetryTimer = () => {
    if (retryTimer !== null) {
      clearTimer(retryTimer);
      retryTimer = null;
    }
  };

  const emitState = () => {
    if (disposed) return;
    onStateChange(getSnapshot());
  };

  function getSnapshot() {
    const isDirty = isDirtyNow();
    const isSaving = Boolean(inFlight);
    return {
      accountId,
      docId,
      hydrated,
      loading,
      loadError,
      isDirty,
      isSaving,
      isManualSaving: Boolean(inFlight?.mode === "manual" || queuedSave?.mode === "manual"),
      isAutoSaving: Boolean(inFlight?.mode === "auto"),
      hasUnsavedOrInFlightWork:
        !loadError && (isDirty || isSaving || status === "retrying"),
      status,
      activeMode,
      lastSavedAt,
      lastError,
      savedSignature,
      latestSignature,
      transientRetryCount,
    };
  }

  function cancelPendingWork() {
    generation += 1;
    clearDebounceTimers();
    clearRetryTimer();
    retryDeadlineAt = null;
    queuedSave = null;
    if (inFlight) {
      const staleAttempt = inFlight;
      inFlight = null;
      try {
        staleAttempt.controller.abort();
      } catch {
        // Ignore abort errors on cleanup.
      }
    }
    activeMode = null;
    if (status === "retrying" || status === "saving") {
      status = isDirtyNow()
        ? lastError
          ? "failed"
          : "dirty"
        : lastSavedAt
          ? "saved"
          : "idle";
    }
  }

  function resetDocumentState() {
    cancelPendingWork();
    hydrated = false;
    latestDraft = null;
    latestSignature = null;
    savedSignature = null;
    lastEditAt = 0;
    transientRetryCount = 0;
    retryDeadlineAt = null;
    lastFailedSignature = null;
    rejectedDuplicateTitle = null;
    status = "idle";
    lastSavedAt = null;
    lastError = null;
  }

  const canScheduleAutoSave = () => {
    if (disposed || loading || loadError || !hydrated || !accountId) return false;
    if (!docId || blockedPromptOpen || aiFilling) return false;
    return isDirtyNow();
  };

  const scheduleAutosaveAfter = (delayMs) => {
    clearDebounceTimers();
    clearRetryTimer();
    if (!canScheduleAutoSave()) return;
    const capturedGen = generation;
    debounceTimer = scheduleTimer(() => {
      debounceTimer = null;
      if (disposed || capturedGen !== generation) return;
      if (!canScheduleAutoSave()) return;
      void executeSave({ mode: "auto" });
    }, Math.max(0, delayMs));
  };

  const scheduleValidationIdleSurface = (validation) => {
    clearDebounceTimers();
    clearRetryTimer();
    if (!hydrated || loading || loadError || blockedPromptOpen || aiFilling) return;
    const capturedGen = generation;
    const capturedSig = latestSignature;
    validationTimer = scheduleTimer(() => {
      validationTimer = null;
      if (disposed || capturedGen !== generation) return;
      if (latestSignature !== capturedSig || !isDirtyNow()) return;
      lastError = {
        kind: "validation",
        retryable: false,
        isDuplicateTitle: false,
        statusBadge: validation.field === "title" ? "Thiếu tên CV" : "Dữ liệu chưa hợp lệ",
        userMessage: validation.validationError,
      };
      status = "failed";
      emitState();
    }, debounceMs);
  };

  const scheduleBoundedRetry = (delayMs = retryDelayMs) => {
    clearRetryTimer();
    if (!canScheduleAutoSave() || !isOnline()) return false;
    const capturedGen = generation;
    retryTimer = scheduleTimer(() => {
      retryTimer = null;
      if (disposed || capturedGen !== generation) return;
      if (blockedPromptOpen || aiFilling) return;
      if (!canScheduleAutoSave()) {
        retryDeadlineAt = null;
        if (status === "retrying") {
          status = isDirtyNow() ? "failed" : lastSavedAt ? "saved" : "idle";
          emitState();
        }
        return;
      }
      if (!isOnline()) {
        retryDeadlineAt = null;
        const offlineError = classifyResumeSaveError({
          isOffline: true,
          isCreate: !docId,
        });
        lastError = offlineError;
        status = "failed";
        emitState();
        onFailureFeedback({
          mode: "retry",
          classifiedError: offlineError,
          isValidation: false,
          field: null,
        });
        return;
      }
      retryDeadlineAt = null;
      void executeSave({ mode: "auto" });
    }, Math.max(0, delayMs));
    return true;
  };

  async function executeSave({ mode }) {
    if (disposed || inFlight || !accountId || !hydrated || loading || loadError || aiFilling) {
      return false;
    }

    const isAuto = mode === "auto";
    if (isAuto && (!docId || blockedPromptOpen || !isDirtyNow())) {
      return false;
    }

    const draft = latestDraft;
    const capturedSignature = latestSignature;
    const validation = validateResumeDraftForSave(draft, templateNames);
    if (!validation.isValid) {
      if (isAuto) {
        lastError = {
          kind: "validation",
          retryable: false,
          isDuplicateTitle: false,
          statusBadge: validation.field === "title" ? "Thiếu tên CV" : "Dữ liệu chưa hợp lệ",
          userMessage: validation.validationError,
        };
        status = "failed";
        emitState();
      } else {
        const classified = {
          kind: "validation",
          retryable: false,
          isDuplicateTitle: false,
          statusBadge: validation.field === "title" ? "Thiếu tên CV" : "Dữ liệu chưa hợp lệ",
          userMessage: validation.validationError,
        };
        lastError = classified;
        status = "failed";
        emitState();
        onFailureFeedback({
          mode,
          classifiedError: classified,
          isValidation: true,
          field: validation.field,
        });
      }
      return false;
    }

    if (!isOnline()) {
      const classified = classifyResumeSaveError({
        isOffline: true,
        isCreate: !docId,
      });
      lastFailedSignature = capturedSignature;
      lastError = classified;
      status = "failed";
      emitState();
      if (!isAuto) {
        onFailureFeedback({ mode, classifiedError: classified, isValidation: false });
      }
      return false;
    }

    clearDebounceTimers();
    clearRetryTimer();
    retryDeadlineAt = null;

    const capturedDocId = docId;
    const capturedAccountId = accountId;
    const capturedGeneration = generation;
    const isCreate = !capturedDocId;
    const payload = buildResumeSavePayload(draft, capturedDocId);
    const controller = new AbortController();

    const attempt = {
      signature: capturedSignature,
      mode,
      docId: capturedDocId,
      accountId: capturedAccountId,
      generation: capturedGeneration,
      controller,
      didTimeout: false,
    };
    inFlight = attempt;
    status = "saving";
    activeMode = mode;
    queuedSave = null;
    lastError = null;
    emitState();

    const timeoutHandle = scheduleTimer(() => {
      attempt.didTimeout = true;
      try {
        controller.abort();
      } catch {
        // Ignore timeout abort errors.
      }
    }, timeoutMs);

    try {
      const result = await saveRequest({ payload, signal: controller.signal, mode });

      if (
        disposed ||
        capturedGeneration !== generation ||
        capturedAccountId !== accountId ||
        inFlight !== attempt
      ) {
        return false;
      }

      if (attempt.didTimeout) {
        const timeoutError = new Error("Save request timed out");
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }

      if (controller.signal.aborted) {
        const abortError = new Error("Save request aborted");
        abortError.name = "AbortError";
        throw abortError;
      }

      if (result?.ok !== true) {
        const err = new Error(result?.data?.message || "Lỗi khi lưu CV.");
        err.status = result?.status ?? 0;
        err.code = result?.data?.code || "";
        err.responseData = result?.data;
        err.isUnconfirmedResponse = Boolean(result?.isUnconfirmedResponse);
        throw err;
      }

      const returnedResume =
        result?.data && typeof result.data === "object" && !Array.isArray(result.data)
          ? result.data.resume
          : null;
      const isPlainResumeObject =
        Boolean(returnedResume) &&
        typeof returnedResume === "object" &&
        !Array.isArray(returnedResume);
      const returnedId =
        isPlainResumeObject && typeof returnedResume._id === "string"
          ? returnedResume._id.trim()
          : "";
      const hasValidSavedId = isCreate
        ? returnedId.length > 0
        : returnedId.length > 0 && returnedId === capturedDocId;

      if (!isPlainResumeObject || !hasValidSavedId) {
        const err = new Error(
          isCreate
            ? "Không thể xác nhận CV đã được lưu trên máy chủ."
            : "Phản hồi từ máy chủ không khớp với CV đang lưu.",
        );
        err.status = result?.status ?? 200;
        err.code = result?.data?.code || "UNCONFIRMED_SAVE_RESPONSE";
        err.responseData = result?.data;
        err.isUnconfirmedResponse = true;
        throw err;
      }

      const savedId = returnedResume._id;
      inFlight = null;
      activeMode = null;

      if (isCreate && savedId) {
        docId = savedId;
      }

      savedSignature = capturedSignature;
      lastSavedAt = new Date(now());
      lastError = null;
      lastFailedSignature = null;
      rejectedDuplicateTitle = null;
      transientRetryCount = 0;

      const hasNewerEdits = latestSignature !== capturedSignature;
      const queuedManual = queuedSave?.mode === "manual";
      queuedSave = null;

      if (hasNewerEdits) {
        status = "dirty";
        emitState();
        onCommitted({
          mode: queuedManual ? "manual" : mode,
          isFirstCreate: isCreate,
          savedId,
          responseData: result.data,
          capturedSignature,
          payload,
          hasNewerEdits: true,
        });

        if (queuedManual) {
          void executeSave({ mode: "manual" });
        } else if (canScheduleAutoSave()) {
          const latestValidation = validateResumeDraftForSave(latestDraft, templateNames);
          if (latestValidation.isValid) {
            const elapsed = Math.max(0, now() - lastEditAt);
            scheduleAutosaveAfter(Math.max(0, debounceMs - elapsed));
          } else {
            scheduleValidationIdleSurface(latestValidation);
          }
        }
      } else {
        status = "saved";
        emitState();
        onCommitted({
          mode: queuedManual ? "manual" : mode,
          isFirstCreate: isCreate,
          savedId,
          responseData: result.data,
          capturedSignature,
          payload,
          hasNewerEdits: false,
        });
      }

      return true;
    } catch (error) {
      if (
        disposed ||
        capturedGeneration !== generation ||
        capturedAccountId !== accountId ||
        inFlight !== attempt
      ) {
        return false;
      }

      const intentionalAbort =
        !attempt.didTimeout &&
        (error?.name === "AbortError" || controller.signal.aborted);
      if (intentionalAbort) {
        inFlight = null;
        activeMode = null;
        status = isDirtyNow() ? "dirty" : lastSavedAt ? "saved" : "idle";
        emitState();
        return false;
      }

      inFlight = null;
      activeMode = null;

      const classified = classifyResumeSaveError({
        status: error?.status ?? 0,
        code: error?.code || "",
        message: error?.message || "",
        isNetworkError:
          error?.status === undefined &&
          !attempt.didTimeout &&
          !error?.isUnconfirmedResponse,
        isTimeout: attempt.didTimeout,
        isOffline: !isOnline(),
        isCreate,
        isUnconfirmedResponse: Boolean(error?.isUnconfirmedResponse),
      });

      const queuedManual = queuedSave?.mode === "manual";
      queuedSave = null;

      if (classified.isDuplicateTitle) {
        rejectedDuplicateTitle = payload.title;
      }

      const editedDuringFailedSave = latestSignature !== capturedSignature;
      if (editedDuringFailedSave) {
        const stillMatchesDuplicate =
          rejectedDuplicateTitle !== null &&
          latestDraft?.title?.trim() === rejectedDuplicateTitle;

        if (!stillMatchesDuplicate && classified.isDuplicateTitle) {
          rejectedDuplicateTitle = null;
        }

        if (isCreate) {
          const effectiveError =
            classified.isDuplicateTitle && !stillMatchesDuplicate
              ? {
                  kind: "create_failed",
                  retryable: false,
                  isDuplicateTitle: false,
                  statusBadge: "Tạo CV thất bại",
                  userMessage:
                    "Yêu cầu tạo CV trước đó đã thất bại do trùng tên cũ. Thay đổi mới vẫn được giữ; hãy bấm Lưu CV để tạo.",
                }
              : classified;
          lastFailedSignature = null;
          transientRetryCount = 0;
          retryDeadlineAt = null;
          lastError = effectiveError;
          status = "failed";
          emitState();
          onFailureFeedback({
            mode,
            classifiedError: effectiveError,
            isValidation: false,
            field: stillMatchesDuplicate ? "title" : null,
          });
          return false;
        }

        lastFailedSignature = null;
        transientRetryCount = 0;
        retryDeadlineAt = null;
        lastError = stillMatchesDuplicate ? classified : null;
        status = stillMatchesDuplicate ? "failed" : "dirty";
        emitState();

        if (queuedManual) {
          void executeSave({ mode: "manual" });
        } else if (canScheduleAutoSave() && !stillMatchesDuplicate) {
          const latestValidation = validateResumeDraftForSave(latestDraft, templateNames);
          if (latestValidation.isValid) {
            const elapsed = Math.max(0, now() - lastEditAt);
            scheduleAutosaveAfter(Math.max(0, debounceMs - elapsed));
          } else {
            scheduleValidationIdleSurface(latestValidation);
          }
        }
        return false;
      }

      lastFailedSignature = capturedSignature;
      lastError = classified;

      if (queuedManual) {
        retryDeadlineAt = null;
        status = "dirty";
        emitState();
        void executeSave({ mode: "manual" });
        return false;
      }

      const canBoundedRetry =
        isAuto &&
        !isCreate &&
        classified.retryable &&
        isOnline() &&
        transientRetryCount < maxAutoRetries;

      const isPausedForRetry =
        (blockedPromptOpen || aiFilling) &&
        !disposed &&
        !loading &&
        !loadError &&
        hydrated &&
        Boolean(accountId) &&
        Boolean(docId) &&
        isDirtyNow();

      if (canBoundedRetry && (canScheduleAutoSave() || isPausedForRetry)) {
        transientRetryCount += 1;
        retryDeadlineAt = now() + retryDelayMs;
        status = "retrying";
        emitState();
        if (!isPausedForRetry) {
          scheduleBoundedRetry(retryDelayMs);
        }
        return false;
      }

      retryDeadlineAt = null;
      status = "failed";
      emitState();
      onFailureFeedback({
        mode,
        classifiedError: classified,
        isValidation: false,
        field: classified.isDuplicateTitle ? "title" : null,
      });
      return false;
    } finally {
      clearTimer(timeoutHandle);
    }
  }

  return {
    getSnapshot,
    setContext(nextContext) {
      if (disposed) return;
      const nextAccountId = nextContext.accountId ?? null;
      const nextDocId = nextContext.docId ?? null;
      const accountChanged = nextAccountId !== accountId;
      const docChanged = nextDocId !== docId;

      if (accountChanged || docChanged) {
        resetDocumentState();
      }

      accountId = nextAccountId;
      docId = nextDocId;
      const prevLoading = loading;
      const prevAiFilling = aiFilling;

      if (nextContext.hydrated !== undefined) {
        hydrated = Boolean(nextContext.hydrated);
      }
      if (nextContext.loading !== undefined) {
        loading = Boolean(nextContext.loading);
      }
      if (nextContext.loadError !== undefined) {
        loadError = nextContext.loadError || "";
      }
      if (nextContext.aiFilling !== undefined) {
        aiFilling = Boolean(nextContext.aiFilling);
      }

      const nextBlocked =
        nextContext.blockedPromptOpen !== undefined
          ? Boolean(nextContext.blockedPromptOpen)
          : blockedPromptOpen;
      const resumedFromBlock = blockedPromptOpen && !nextBlocked;
      const resumedFromAiFill = prevAiFilling && !aiFilling;
      const resumedFromLoading = prevLoading && !loading;
      blockedPromptOpen = nextBlocked;

      let deferredFailureFeedback = null;

      if (blockedPromptOpen || loading || loadError || aiFilling) {
        clearDebounceTimers();
        clearRetryTimer();
      } else if (status === "retrying" && !inFlight && !retryTimer) {
        const validation = validateResumeDraftForSave(latestDraft, templateNames);
        const hasDuplicateLock =
          rejectedDuplicateTitle !== null &&
          validation.cleanTitle === rejectedDuplicateTitle;
        const canResumeRetry =
          canScheduleAutoSave() &&
          isOnline() &&
          retryDeadlineAt !== null &&
          lastFailedSignature === latestSignature &&
          Boolean(lastError?.retryable) &&
          validation.isValid &&
          !hasDuplicateLock;

        if (canResumeRetry) {
          const remainingMs = Math.max(0, retryDeadlineAt - now());
          scheduleBoundedRetry(remainingMs);
        } else {
          retryDeadlineAt = null;
          if (!isOnline()) {
            const offlineError = classifyResumeSaveError({
              isOffline: true,
              isCreate: !docId,
            });
            lastError = offlineError;
            status = "failed";
            deferredFailureFeedback = {
              mode: "retry",
              classifiedError: offlineError,
              isValidation: false,
              field: null,
            };
          } else if (!validation.isValid) {
            const validationError = {
              kind: "validation",
              retryable: false,
              isDuplicateTitle: false,
              statusBadge:
                validation.field === "title"
                  ? "Thiếu tên CV"
                  : "Dữ liệu chưa hợp lệ",
              userMessage: validation.validationError,
            };
            lastError = validationError;
            status = "failed";
            deferredFailureFeedback = {
              mode: "retry",
              classifiedError: validationError,
              isValidation: true,
              field: validation.field,
            };
          } else {
            status = isDirtyNow() ? "failed" : lastSavedAt ? "saved" : "idle";
            if (status === "failed" && lastError) {
              deferredFailureFeedback = {
                mode: "retry",
                classifiedError: lastError,
                isValidation: false,
                field: lastError.isDuplicateTitle ? "title" : null,
              };
            }
          }
        }
      } else if (
        (resumedFromBlock || resumedFromAiFill || resumedFromLoading) &&
        canScheduleAutoSave() &&
        !inFlight &&
        status === "dirty" &&
        lastFailedSignature !== latestSignature
      ) {
        const validation = validateResumeDraftForSave(latestDraft, templateNames);
        if (
          validation.isValid &&
          !(rejectedDuplicateTitle !== null && validation.cleanTitle === rejectedDuplicateTitle)
        ) {
          scheduleAutosaveAfter(debounceMs);
        }
      }

      emitState();
      if (deferredFailureFeedback) {
        onFailureFeedback(deferredFailureFeedback);
      }
    },

    hydrateClean({ accountId: nextAccountId, docId: nextDocId, resumeData }) {
      if (disposed) return;
      cancelPendingWork();
      accountId = nextAccountId ?? null;
      docId = nextDocId ?? null;
      hydrated = true;
      loading = false;
      loadError = "";
      latestDraft = resumeData;
      latestSignature = getResumeSignature(resumeData);
      savedSignature = latestSignature;
      lastEditAt = 0;
      transientRetryCount = 0;
      retryDeadlineAt = null;
      lastFailedSignature = null;
      rejectedDuplicateTitle = null;
      status = "idle";
      lastSavedAt = null;
      lastError = null;
      emitState();
    },

    syncDraft(resumeData) {
      if (disposed || loading || loadError || !hydrated) return;
      const sig = getResumeSignature(resumeData);
      if (sig === latestSignature) return;

      latestDraft = resumeData;
      latestSignature = sig;
      lastEditAt = now();
      transientRetryCount = 0;
      lastFailedSignature = null;

      const validation = validateResumeDraftForSave(resumeData, templateNames);
      if (rejectedDuplicateTitle !== null && validation.cleanTitle !== rejectedDuplicateTitle) {
        rejectedDuplicateTitle = null;
      }

      if (!isDirtyNow()) {
        clearDebounceTimers();
        clearRetryTimer();
        retryDeadlineAt = null;
        lastError = null;
        if (!inFlight) {
          status = lastSavedAt ? "saved" : "idle";
          queuedSave = null;
        }
        emitState();
        return;
      }

      clearRetryTimer();
      retryDeadlineAt = null;

      const hasDuplicateLock =
        rejectedDuplicateTitle !== null &&
        validation.cleanTitle === rejectedDuplicateTitle;

      if (!hasDuplicateLock) {
        lastError = null;
      }

      if (inFlight) {
        status = "saving";
        emitState();
        return;
      }

      status = "dirty";
      emitState();

      if (!validation.isValid) {
        scheduleValidationIdleSurface(validation);
        return;
      }

      if (hasDuplicateLock) {
        clearDebounceTimers();
        status = "failed";
        lastError = classifyResumeSaveError({
          code: "DUPLICATE_RESUME_TITLE",
          isCreate: !docId,
        });
        emitState();
        return;
      }

      if (canScheduleAutoSave()) {
        scheduleAutosaveAfter(debounceMs);
      }
    },

    triggerManualSave() {
      if (disposed || loading || loadError || aiFilling || !hydrated || !accountId) {
        return Promise.resolve(false);
      }
      clearDebounceTimers();
      clearRetryTimer();
      retryDeadlineAt = null;

      if (inFlight) {
        if (inFlight.mode === "manual" || !docId) {
          return Promise.resolve(false);
        }
        queuedSave = { mode: "manual" };
        emitState();
        return Promise.resolve(true);
      }

      rejectedDuplicateTitle = null;
      transientRetryCount = 0;
      lastFailedSignature = null;
      return executeSave({ mode: "manual" });
    },

    triggerRetry() {
      if (disposed || loading || loadError || aiFilling || !hydrated || !accountId) {
        return Promise.resolve(false);
      }
      clearDebounceTimers();
      clearRetryTimer();
      retryDeadlineAt = null;

      if (inFlight) {
        return Promise.resolve(false);
      }

      rejectedDuplicateTitle = null;
      transientRetryCount = 0;
      lastFailedSignature = null;
      return executeSave({ mode: docId ? "retry" : "manual" });
    },

    handleOnline() {
      if (disposed || !canScheduleAutoSave() || inFlight) return;
      if (status !== "failed" || !lastError?.retryable) return;
      transientRetryCount = 0;
      lastFailedSignature = null;
      const validation = validateResumeDraftForSave(latestDraft, templateNames);
      if (validation.isValid) {
        void executeSave({ mode: "auto" });
      }
    },

    cancelPendingWork() {
      cancelPendingWork();
      emitState();
    },

    dispose() {
      disposed = true;
      cancelPendingWork();
    },
  };
}
