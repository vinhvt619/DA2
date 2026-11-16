import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getAccountId, isCandidateEligible } from "../utils/applicationSubmission";

export const MY_APPLICATIONS_QUERY_ROOT = "candidate-applications";
const EMPTY_APPLICATIONS = Object.freeze([]);

export function myApplicationsKey(accountId) {
  return [MY_APPLICATIONS_QUERY_ROOT, accountId || null];
}

async function fetchCandidateApplications({ signal }) {
  const response = await fetch("/api/jobs/applications/mine", {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error || "Không thể tải danh sách hồ sơ đã nộp.",
    );
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }

  if (!Array.isArray(payload)) {
    throw new Error("Dữ liệu hồ sơ đã nộp từ máy chủ không hợp lệ.");
  }

  return payload;
}

export function useMyApplications({ enabled = true } = {}) {
  const { currentUser, isAuthChecked } = useAuth();
  const queryClient = useQueryClient();

  const accountId = getAccountId(currentUser);
  const isCandidate = isCandidateEligible(currentUser);
  const canQuery = Boolean(enabled && isAuthChecked && isCandidate && accountId);
  const previousAccountIdRef = useRef(accountId);

  useEffect(() => {
    if (!isAuthChecked) return;

    const previousAccountId = previousAccountIdRef.current;
    if (!isCandidate || !accountId) {
      queryClient.removeQueries({ queryKey: [MY_APPLICATIONS_QUERY_ROOT] });
      previousAccountIdRef.current = null;
      return;
    }

    if (previousAccountId && previousAccountId !== accountId) {
      queryClient.removeQueries({
        queryKey: myApplicationsKey(previousAccountId),
      });
    }
    previousAccountIdRef.current = accountId;
  }, [accountId, isAuthChecked, isCandidate, queryClient]);

  const query = useQuery({
    queryKey: myApplicationsKey(accountId),
    queryFn: fetchCandidateApplications,
    enabled: canQuery,
  });

  const invalidate = useCallback(async () => {
    if (!accountId || !isCandidate) return;
    await queryClient.invalidateQueries({
      queryKey: myApplicationsKey(accountId),
    });
  }, [accountId, isCandidate, queryClient]);

  return {
    applications: canQuery && Array.isArray(query.data) ? query.data : EMPTY_APPLICATIONS,
    isLoading: canQuery ? query.isLoading : false,
    isFetching: canQuery ? query.isFetching : false,
    isError: canQuery ? query.isError : false,
    error: canQuery ? query.error : null,
    refetch: query.refetch,
    invalidate,
    accountId,
    isCandidate,
    isAuthChecked,
  };
}
