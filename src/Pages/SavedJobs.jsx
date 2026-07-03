import React, { useState, useEffect } from "react";
import { BookmarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Header from "../Components/Header";
import StickyProfile from "../Components/SitckyProfile";
import Jobs from "../Components/ListJob";
import { useSavedJobs } from "../context/SavedJobsContext";
import { getJobById } from "../data/jobsData";
import "../App.css";

function ErrorJobCard({ jobId, onRetry, onRemove }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry(jobId, onRemove);
    setRetrying(false);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-lg">
      <div className="text-sm text-red-600">
        Không tải được thông tin công việc.
      </div>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
      >
        <ArrowPathIcon className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
        Thử lại
      </button>
    </div>
  );
}

function SkeletonJobCard() {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
          <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
          <div className="flex gap-2 mt-3">
            <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
            <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedJobs() {
  const { savedJobIdList, isLoadingSavedIds } = useSavedJobs();
  const [resolvedJobs, setResolvedJobs] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(new Set());
  const [errorJobs, setErrorJobs] = useState(new Set());

  const resolveJob = async (jobId, onRemove) => {
    // 1. Check static data
    const staticJob = getJobById(jobId);
    if (staticJob) {
      setResolvedJobs((prev) => ({ ...prev, [jobId]: staticJob }));
      return;
    }

    // 2. Fetch from DB
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.status === 404) {
        onRemove(jobId);
      } else if (res.ok) {
        const data = await res.json();
        const normalizedJob = {
          ...data,
          id: data._id,
          postedAt: new Date(data.createdAt).toLocaleDateString("vi-VN"),
        };
        setResolvedJobs((prev) => ({ ...prev, [jobId]: normalizedJob }));
        setErrorJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        throw new Error("Failed to fetch");
      }
    } catch {
      setErrorJobs((prev) => new Set([...prev, jobId]));
    }
  };

  useEffect(() => {
    if (isLoadingSavedIds) return;

    const fetchAllJobs = async () => {
      const jobsToFetch = savedJobIdList.filter(
        (id) => !resolvedJobs[id] && !errorJobs.has(id)
      );

      if (jobsToFetch.length === 0) return;

      setLoadingJobs(new Set(jobsToFetch));

      const onRemove = (id) => {
        // We do a silent remove if it's 404
        setResolvedJobs((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      };

      await Promise.allSettled(
        jobsToFetch.map(async (jobId) => {
          await resolveJob(jobId, onRemove);
          setLoadingJobs((prev) => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
        })
      );
    };

    fetchAllJobs();
  }, [savedJobIdList, isLoadingSavedIds]); // Removed resolvedJobs and errorJobs to avoid infinite loops

  // Display logic
  const displayedJobs = savedJobIdList.filter((id) => {
    // Hide 404s (jobs that were attempted but neither resolved nor errored out - meaning silent remove)
    if (!loadingJobs.has(id) && !errorJobs.has(id) && !resolvedJobs[id]) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col font-sans antialiased text-slate-900 text-sm page-transition">
      <Header />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
            <StickyProfile />
          </div>

          <div className="flex-1 min-w-0 w-full space-y-5 pb-12">
            <div
              className="bg-white/70 rounded-2xl border border-white/80 shadow-sm p-6"
              style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-100 rounded-lg text-[#9346F5]">
                  <BookmarkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Việc làm đã lưu</h1>
                  <p className="text-xs text-gray-500">Danh sách các cơ hội nghề nghiệp bạn đang quan tâm</p>
                </div>
              </div>

              {isLoadingSavedIds ? (
                <div className="flex justify-center py-12">
                  <ArrowPathIcon className="w-6 h-6 text-[#9346F5] animate-spin" />
                </div>
              ) : displayedJobs.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-50 mb-4">
                    <BookmarkIcon className="w-8 h-8 text-[#9346F5]" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Chưa có việc làm nào được lưu</h3>
                  <p className="text-xs text-gray-500">Hãy tiếp tục khám phá và lưu lại những cơ hội phù hợp nhé!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedJobs.map((jobId) => {
                    if (loadingJobs.has(jobId)) {
                      return <SkeletonJobCard key={jobId} />;
                    }
                    if (errorJobs.has(jobId)) {
                      return (
                        <ErrorJobCard
                          key={jobId}
                          jobId={jobId}
                          onRetry={resolveJob}
                          onRemove={() => {}} // Handle onRemove inside resolveJob
                        />
                      );
                    }
                    if (resolvedJobs[jobId]) {
                      return <Jobs key={jobId} job={resolvedJobs[jobId]} />;
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
