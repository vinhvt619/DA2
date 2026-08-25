import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useMemo } from "react";
import { fetchJson } from "../utils/http.js";
import { showToast } from "../utils/toast.js";
import { useAuth } from "./AuthContext";

const SavedJobsContext = createContext(null);
const savedJobsKey = (userId) => ["saved-jobs", userId];

export function SavedJobsProvider({ children }) {
  const { currentUser, isAuthChecked } = useAuth();
  const currentUserId = currentUser?._id;
  const queryClient = useQueryClient();
  const isLoggedIn = Boolean(isAuthChecked && currentUserId);

  const savedJobsQuery = useQuery({
    queryKey: savedJobsKey(currentUserId),
    queryFn: async () => {
      const savedJobs = await fetchJson("/api/saved-jobs");
      return savedJobs.map((item) => item.jobId);
    },
    enabled: isLoggedIn,
  });

  const toggleMutation = useMutation({
    mutationKey: ["saved-jobs", "toggle", currentUserId],
    mutationFn: ({ jobId, wasSaved }) =>
      fetchJson(`/api/saved-jobs/${jobId}`, {
        method: wasSaved ? "DELETE" : "POST",
      }),
    onMutate: async ({ jobId, wasSaved }) => {
      const queryKey = savedJobsKey(currentUserId);
      await queryClient.cancelQueries({ queryKey });
      const previousIds = queryClient.getQueryData(queryKey) || [];
      queryClient.setQueryData(queryKey, (ids = []) =>
        wasSaved
          ? ids.filter((id) => id !== jobId)
          : [jobId, ...ids.filter((id) => id !== jobId)],
      );
      return { previousIds };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(
        savedJobsKey(currentUserId),
        context?.previousIds || [],
      );
      showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobsKey(currentUserId) });
    },
  });

  const pendingJobIds = useMutationState({
    filters: {
      mutationKey: ["saved-jobs", "toggle", currentUserId],
      status: "pending",
    },
    select: (mutation) => mutation.state.variables?.jobId,
  });

  const savedJobIdList = useMemo(
    () => (isLoggedIn ? (savedJobsQuery.data || []) : []),
    [isLoggedIn, savedJobsQuery.data],
  );
  const savedSet = useMemo(() => new Set(savedJobIdList), [savedJobIdList]);
  const pendingIds = useMemo(
    () => new Set(pendingJobIds.filter(Boolean)),
    [pendingJobIds],
  );
  const isSaved = useCallback((jobId) => savedSet.has(jobId), [savedSet]);

  const toggleSave = useCallback(
    async (jobId) => {
      if (!isLoggedIn) {
        showToast("Vui lòng đăng nhập để lưu công việc.", "error");
        return;
      }
      if (pendingIds.has(jobId)) return;

      try {
        await toggleMutation.mutateAsync({
          jobId,
          wasSaved: savedSet.has(jobId),
        });
      } catch {
        // The mutation already restores the cache and shows user feedback.
      }
    },
    [isLoggedIn, pendingIds, savedSet, toggleMutation],
  );

  const value = useMemo(
    () => ({
      isLoggedIn,
      isSaved,
      savedJobIdList,
      isLoadingSavedIds: !isAuthChecked || savedJobsQuery.isLoading,
      toggleSave,
      pendingIds,
    }),
    [
      isAuthChecked,
      isLoggedIn,
      isSaved,
      pendingIds,
      savedJobIdList,
      savedJobsQuery.isLoading,
      toggleSave,
    ],
  );

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
