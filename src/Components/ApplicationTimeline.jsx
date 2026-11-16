import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ApplicationStatusBadge from "./ApplicationStatusBadge.jsx";
import { buildApplicationTimeline } from "../utils/applicationStatus.js";
import { getApplicationJobInfo, normalizeIdString } from "../utils/applicationSubmission.js";
import { formatDateTime } from "../utils/dateTime.js";

export function ApplicationTimelineContent({ application }) {
  const timeline = buildApplicationTimeline(application);
  const submittedText = timeline.submittedAt
    ? formatDateTime(timeline.submittedAt, "HH:mm dd/MM/yyyy", "Không rõ")
    : "Không rõ";
  const lastUpdatedText = timeline.lastUpdatedAt
    ? formatDateTime(timeline.lastUpdatedAt, "HH:mm dd/MM/yyyy", "Chưa có dữ liệu")
    : "Chưa có dữ liệu";

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold text-slate-500">Trạng thái hiện tại</dt>
          <dd className="mt-1">
            <ApplicationStatusBadge status={application?.status} size="xs" />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold text-slate-500">Thời điểm nộp</dt>
          <dd className="mt-1 font-semibold text-slate-800">{submittedText}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold text-slate-500">Cập nhật gần nhất</dt>
          <dd className="mt-1 font-semibold text-slate-800">{lastUpdatedText}</dd>
        </div>
      </dl>

      <p className="text-xs leading-5 text-slate-600">
        {timeline.currentMeta.description}
      </p>

      {timeline.isLegacyPartialHistory && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[11px] leading-4 text-amber-900"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Hồ sơ cũ chưa có đầy đủ mốc thời gian cho từng bước trước đó; hệ thống chỉ hiển thị các mốc thực tế đã ghi nhận và không tự suy diễn thời điểm trung gian.
          </span>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Các mốc tiến trình đã ghi nhận
        </h3>
        <ol
          aria-label="Các mốc trạng thái hồ sơ"
          className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4"
        >
          {timeline.milestones.map((item) => {
            const timeLabel = item.timestampKnown
              ? formatDateTime(item.timestamp, "HH:mm dd/MM/yyyy", "Không rõ")
              : "Chưa có mốc thời gian";

            return (
              <li
                key={item.key}
                className="relative rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-[23px] top-3.5 h-3 w-3 rounded-full border-2 border-white ring-1 ring-slate-300 ${item.meta.dotClassName}`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {item.meta.label}
                    </span>
                    {item.isSubmission && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        Nộp hồ sơ
                      </span>
                    )}
                    {item.isCurrent && (
                      <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      item.timestampKnown ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                    {timeLabel}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default function ApplicationTimelineDialog({
  application,
  viewerRole = "candidate",
  onClose,
  onViewCoverLetter,
}) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!application) return undefined;
    const previouslyFocused = document.activeElement;
    previousFocusRef.current =
      previouslyFocused && typeof previouslyFocused.focus === "function"
        ? previouslyFocused
        : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    };
  }, [application, onClose]);

  if (!application) {
    return null;
  }

  const jobInfo = getApplicationJobInfo(application);
  const applicationId = normalizeIdString(application._id);
  const candidateId = normalizeIdString(application.candidateId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-sm font-bold text-slate-950 sm:text-base">
              Tiến trình hồ sơ ứng tuyển
            </h2>
            <p className="mt-1 truncate text-xs font-semibold text-slate-700">
              {viewerRole === "company"
                ? `${application.fullName || "Ứng viên"} · ${jobInfo.title}`
                : `${jobInfo.title} · ${jobInfo.company}`}
            </p>
            {jobInfo.isJobDeleted && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <ExclamationTriangleIcon className="h-3 w-3 shrink-0" />
                Tin đã bị xoá · Giữ snapshot công việc
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => onClose?.()}
            aria-label="Đóng tiến trình hồ sơ"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <ApplicationTimelineContent application={application} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {applicationId && (
              <Link
                to={`/resume/view/application/${applicationId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <DocumentTextIcon className="h-3.5 w-3.5 shrink-0" />
                Xem CV đã nộp
              </Link>
            )}
            {viewerRole === "candidate" && jobInfo.canOpenJobDetail && jobInfo.jobId && (
              <Link
                to={`/jobs/${jobInfo.jobId}`}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Xem công việc
              </Link>
            )}
            {viewerRole === "company" && candidateId && (
              <Link
                to={`/profile/${candidateId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                Trang cá nhân
              </Link>
            )}
            {viewerRole === "company" && application.coverLetter && onViewCoverLetter && (
              <button
                type="button"
                onClick={() => onViewCoverLetter(application)}
                className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                Xem thư ứng tuyển
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Đóng
          </button>
        </footer>
      </section>
    </div>
  );
}
