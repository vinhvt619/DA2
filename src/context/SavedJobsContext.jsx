import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToastContext } from "../Components/Toast";
import { useAuth } from "./AuthContext";

const SavedJobsContext = createContext(null);

export function SavedJobsProvider({ children }) {
  const { currentUser, isAuthChecked } = useAuth();
  const currentUserId = isAuthChecked ? (currentUser?._id ?? null) : undefined;
  const [savedSet, setSavedSet] = useState(new Set());
  const [savedJobIdList, setSavedJobIdList] = useState([]);
  const [isLoadingSavedIds, setIsLoadingSavedIds] = useState(true);
  const [pendingIds, setPendingIds] = useState(new Set());
  const showToast = useToastContext();

  // Fetch saved jobs when auth state changes
  useEffect(() => {
    if (currentUserId === undefined) return; // Still checking auth

    if (currentUserId === null) {
      setSavedSet(new Set());
      setSavedJobIdList([]);
      setIsLoadingSavedIds(false);
      return;
    }

    const fetchSavedJobs = async () => {
      setIsLoadingSavedIds(true);
      try {
        const res = await fetch("/api/saved-jobs", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const ids = data.map((item) => item.jobId);
          setSavedJobIdList(ids);
          setSavedSet(new Set(ids));
        } else {
          setSavedSet(new Set());
          setSavedJobIdList([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách công việc đã lưu:", err);
      } finally {
        setIsLoadingSavedIds(false);
      }
    };

    fetchSavedJobs();
  }, [currentUserId]);

  const isLoggedIn = currentUserId !== null && currentUserId !== undefined;

  const isSaved = useCallback((jobId) => {
    return savedSet.has(jobId);
  }, [savedSet]);

  const toggleSave = async (jobId) => {
    if (!isLoggedIn) {
      showToast("Vui lòng đăng nhập để lưu công việc.", "error");
      return;
    }
    
    if (pendingIds.has(jobId)) return;

    const wasSaved = savedSet.has(jobId);
    setPendingIds((prev) => new Set([...prev, jobId]));

    // Optimistic update
    if (wasSaved) {
      setSavedSet((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      setSavedJobIdList((prev) => prev.filter((id) => id !== jobId));
    } else {
      setSavedSet((prev) => new Set([jobId, ...prev]));
      setSavedJobIdList((prev) => [jobId, ...prev]);
    }

    try {
      const method = wasSaved ? "DELETE" : "POST";
      const res = await fetch(`/api/saved-jobs/${jobId}`, {
        method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("API error");
    } catch (err) {
      // Rollback
      if (wasSaved) {
        setSavedSet((prev) => new Set([jobId, ...prev]));
        setSavedJobIdList((prev) => [jobId, ...prev]);
      } else {
        setSavedSet((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setSavedJobIdList((prev) => prev.filter((id) => id !== jobId));
      }
      showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const value = {
    isLoggedIn,
    isSaved,
    savedJobIdList,
    isLoadingSavedIds,
    toggleSave,
    pendingIds,
  };

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (!context) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
}
