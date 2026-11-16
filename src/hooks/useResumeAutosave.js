import { useCallback, useEffect, useRef, useState } from "react";
import { createResumeSaveCoordinator } from "../utils/resumeSaveCoordinator.js";
import {
  AUTOSAVE_IDLE_DELAY_MS,
  parseResumeSaveHttpResponse,
} from "../utils/resumeSavePolicy.js";

/**
 * React hook wrapping createResumeSaveCoordinator for browser fetch lifecycle,
 * online recovery, and unmount/navigation cancellation.
 */
export default function useResumeAutosave({
  debounceMs = AUTOSAVE_IDLE_DELAY_MS,
  onCommitted,
  onFailureFeedback,
} = {}) {
  const onCommittedRef = useRef(onCommitted);
  const onFailureFeedbackRef = useRef(onFailureFeedback);
  useEffect(() => {
    onCommittedRef.current = onCommitted;
    onFailureFeedbackRef.current = onFailureFeedback;
  }, [onCommitted, onFailureFeedback]);

  const coordinatorRef = useRef(null);
  if (!coordinatorRef.current) {
    coordinatorRef.current = createResumeSaveCoordinator({
      debounceMs,
      saveRequest: async ({ payload, signal }) => {
        const response = await fetch("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
          signal,
        });
        return parseResumeSaveHttpResponse(response, { signal });
      },
      onStateChange: (snapshot) => {
        setState(snapshot);
      },
      onCommitted: (details) => {
        onCommittedRef.current?.(details);
      },
      onFailureFeedback: (details) => {
        onFailureFeedbackRef.current?.(details);
      },
    });
  }

  const [saveState, setState] = useState(() =>
    coordinatorRef.current.getSnapshot(),
  );

  // Sync onStateChange listener carefully across StrictMode remounts & browser online events
  useEffect(() => {
    const coordinator = coordinatorRef.current;
    const handleOnline = () => {
      coordinator.handleOnline();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    return () => {
      coordinator.cancelPendingWork();
    };
  }, []);

  const setContext = useCallback((context) => {
    coordinatorRef.current.setContext(context);
  }, []);

  const hydrateClean = useCallback((params) => {
    coordinatorRef.current.hydrateClean(params);
  }, []);

  const syncDraft = useCallback((resumeData) => {
    coordinatorRef.current.syncDraft(resumeData);
  }, []);

  const triggerManualSave = useCallback(
    () => coordinatorRef.current.triggerManualSave(),
    [],
  );

  const triggerRetry = useCallback(
    () => coordinatorRef.current.triggerRetry(),
    [],
  );

  const cancelPendingWork = useCallback(() => {
    coordinatorRef.current.cancelPendingWork();
  }, []);

  const getSnapshot = useCallback(
    () => coordinatorRef.current.getSnapshot(),
    [],
  );

  return {
    saveState,
    setContext,
    hydrateClean,
    syncDraft,
    triggerManualSave,
    triggerRetry,
    cancelPendingWork,
    getSnapshot,
  };
}
