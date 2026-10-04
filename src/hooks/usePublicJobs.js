import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/http.js";
import { formatDate } from "../utils/dateTime.js";
import { isJobUnavailable } from "../utils/jobAvailability.js";

export const publicJobsKey = ["public-jobs"];
const EMPTY_JOBS = [];

export default function usePublicJobs() {
  const query = useQuery({
    queryKey: publicJobsKey,
    queryFn: async ({ signal }) => {
      const data = await fetchJson("/api/jobs", { signal, cache: "no-store" });
      if (!Array.isArray(data)) throw new Error("Danh sách việc làm không hợp lệ.");
      return data.filter((job) => job.status === "Active" && !isJobUnavailable(job)).map((job) => ({
        ...job,
        id: job._id,
        postedAt: formatDate(job.createdAt),
        tags: job.tags || [],
      }));
    },
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    refetchInterval: 15_000,
  });
  return { ...query, jobs: query.isError ? EMPTY_JOBS : query.data || EMPTY_JOBS };
}
