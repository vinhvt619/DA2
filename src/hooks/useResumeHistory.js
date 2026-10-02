import { useCallback, useMemo, useReducer } from "react";
import { createResumeHistory, resumeHistoryReducer } from "../utils/resumeHistory.js";

export default function useResumeHistory(initialValue) {
  const [history, dispatch] = useReducer(resumeHistoryReducer, initialValue, createResumeHistory);
  const update = useCallback((value) => dispatch({ type: "update", value, timestamp: Date.now() }), []);
  const reset = useCallback((value) => dispatch({ type: "reset", value }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const setters = useMemo(() => Object.fromEntries(Object.keys(initialValue).map((field) => [
    field,
    (value) => dispatch({
      type: "update",
      group: ["title", "bio", "personalInfo"].includes(field) ? field : null,
      timestamp: Date.now(),
      value: (current) => ({
        ...current,
        [field]: typeof value === "function" ? value(current[field]) : value,
      }),
    }),
  ])), [initialValue]);
  return { value: history.present, setters, update, reset, undo, redo,
    canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
