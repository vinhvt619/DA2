import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/http.js";
import { formatDate } from "../utils/dateTime.js";
import { isJobUnavailable } from "../utils/jobAvailability.js";
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  DEFAULT_SORT,
  resolveCanonicalLocation,
  toPublicJobsSearchParams,
} from "../../shared/jobQueryPolicy.js";

export const publicJobsKey = ["public-jobs"];
const EMPTY_JOBS = [];
const DEFAULT_META = Object.freeze({
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 1,
});

function isSameNonPageCriteria(prevParams, nextParams) {
  if (!prevParams || !nextParams) return false;
  return (
    prevParams.keyword === nextParams.keyword &&
    prevParams.location === nextParams.location &&
    prevParams.category === nextParams.category &&
    prevParams.workTypes === nextParams.workTypes &&
    prevParams.sort === nextParams.sort &&
    prevParams.limit === nextParams.limit &&
    prevParams.companyId === nextParams.companyId
  );
}

export default function usePublicJobs(filterParams = {}) {
  const {
    keyword = "",
    location = "",
    category = "",
    workTypes = [],
    sort = DEFAULT_SORT,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    companyId = "",
    enabled = true,
  } = filterParams;

  const normalizedKeyword = String(keyword || "").normalize("NFC").trim();
  const normalizedLocation = (() => {
    const raw = String(location || "").normalize("NFC").trim();
    if (!raw) return "";
    const resolved = resolveCanonicalLocation(raw);
    return resolved !== null ? resolved : raw.toLowerCase();
  })();
  const normalizedCategory = String(category || "").normalize("NFC").trim().toLowerCase();
  const normalizedWorkTypes = Array.isArray(workTypes)
    ? [...new Set(workTypes.map((wt) => String(wt).trim().toLowerCase()).filter(Boolean))].sort()
    : String(workTypes || "")
        .split(",")
        .map((wt) => wt.trim().toLowerCase())
        .filter(Boolean)
        .sort();
  const normalizedSort = String(sort || DEFAULT_SORT).trim() || DEFAULT_SORT;
  const normalizedPage = Number(page) || DEFAULT_PAGE;
  const normalizedLimit = Number(limit) || DEFAULT_LIMIT;
  const normalizedCompanyId = String(companyId || "").trim().toLowerCase();

  const searchParams = toPublicJobsSearchParams({
    keyword: normalizedKeyword,
    location: normalizedLocation,
    category: normalizedCategory,
    workTypes: normalizedWorkTypes,
    sort: normalizedSort,
    page: normalizedPage,
    limit: normalizedLimit,
    companyId: normalizedCompanyId,
  });

  const queryString = searchParams.toString();
  const keyParams = {
    keyword: normalizedKeyword,
    location: normalizedLocation,
    category: normalizedCategory,
    workTypes: normalizedWorkTypes.join(","),
    sort: normalizedSort,
    page: normalizedPage,
    limit: normalizedLimit,
    companyId: normalizedCompanyId,
  };
  const requestSignature = JSON.stringify(keyParams);
  const canonicalKey = [...publicJobsKey, keyParams];

  const query = useQuery({
    queryKey: canonicalKey,
    queryFn: async ({ signal }) => {
      const url = queryString ? `/api/jobs?${queryString}` : "/api/jobs";
      const response = await fetchJson(url, { signal, cache: "no-store" });

      const rawList = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(rawList)) {
        throw new Error("Danh sách việc làm không hợp lệ.");
      }

      const normalizedJobs = rawList
        .filter((job) => job.status === "Active" && !isJobUnavailable(job))
        .map((job) => ({
          ...job,
          id: job._id || job.id,
          postedAt: formatDate(job.createdAt),
          tags: job.tags || [],
        }));

      const meta = response?.meta || {
        page: normalizedPage,
        limit: normalizedLimit,
        total: normalizedJobs.length,
        totalPages: Math.max(
          1,
          Math.ceil(normalizedJobs.length / normalizedLimit),
        ),
      };

      return {
        jobs: normalizedJobs,
        meta,
        requestSignature,
      };
    },
    enabled,
    // Keep prior page rows visible only while paginating within identical filter/sort/limit/company criteria.
    placeholderData: (previousData, previousQuery) => {
      if (!previousData) return undefined;
      const prevParams = previousQuery?.queryKey?.[1];
      return isSameNonPageCriteria(prevParams, keyParams) ? previousData : undefined;
    },
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
  });

  const jobs = query.isError ? EMPTY_JOBS : query.data?.jobs || EMPTY_JOBS;
  const meta = query.isError ? DEFAULT_META : query.data?.meta || DEFAULT_META;
  const isMatchingSuccess = Boolean(
    enabled &&
      query.isSuccess &&
      !query.isError &&
      !query.isFetching &&
      !query.isPlaceholderData &&
      query.data?.requestSignature === requestSignature,
  );

  return {
    ...query,
    jobs,
    meta,
    totalPages: meta.totalPages,
    total: meta.total,
    page: meta.page,
    isMatchingSuccess,
    requestSignature,
  };
}
