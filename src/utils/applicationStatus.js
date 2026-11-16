import {
  APPLICATION_STATUSES,
  isAllowedApplicationStatusTransition,
  isValidApplicationStatus,
} from "../../shared/applicationStatusPolicy.js";
import { toDate } from "./dateTime.js";

export const APPLICATION_STATUS_META = Object.freeze({
  Pending: Object.freeze({
    status: "Pending",
    isKnown: true,
    label: "Chờ xử lý",
    description: "Hồ sơ đã được gửi và đang chờ nhà tuyển dụng xử lý.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
    dotClassName: "bg-amber-500",
    nodeClassName: "border-amber-300 bg-amber-50 text-amber-700",
  }),
  Reviewing: Object.freeze({
    status: "Reviewing",
    isKnown: true,
    label: "Đang xem xét",
    description: "Nhà tuyển dụng đang xem xét hồ sơ ứng tuyển.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
    dotClassName: "bg-sky-500",
    nodeClassName: "border-sky-300 bg-sky-50 text-sky-700",
  }),
  Interview: Object.freeze({
    status: "Interview",
    isKnown: true,
    label: "Phỏng vấn",
    description: "Hồ sơ đã chuyển sang giai đoạn phỏng vấn.",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-800",
    dotClassName: "bg-violet-500",
    nodeClassName: "border-violet-300 bg-violet-50 text-violet-700",
  }),
  Offered: Object.freeze({
    status: "Offered",
    isKnown: true,
    label: "Đã đề nghị",
    description: "Nhà tuyển dụng đã gửi đề nghị cho vị trí này.",
    badgeClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    dotClassName: "bg-fuchsia-500",
    nodeClassName: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700",
  }),
  Accepted: Object.freeze({
    status: "Accepted",
    isKnown: true,
    label: "Đã nhận",
    description: "Hồ sơ đã được chấp nhận cho vị trí này.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-600",
    nodeClassName: "border-emerald-300 bg-emerald-50 text-emerald-700",
  }),
  Rejected: Object.freeze({
    status: "Rejected",
    isKnown: true,
    label: "Từ chối",
    description: "Hồ sơ chưa phù hợp với vị trí tuyển dụng.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-800",
    dotClassName: "bg-rose-500",
    nodeClassName: "border-rose-300 bg-rose-50 text-rose-700",
  }),
});

export const APPLICATION_STATUS_OPTIONS = Object.freeze(
  APPLICATION_STATUSES.map((statusKey) =>
    Object.freeze({
      value: statusKey,
      label: APPLICATION_STATUS_META[statusKey].label,
      dotClassName: APPLICATION_STATUS_META[statusKey].dotClassName,
    }),
  ),
);

export function getApplicationStatusMeta(status) {
  if (isValidApplicationStatus(status)) {
    return APPLICATION_STATUS_META[status];
  }
  const raw = typeof status === "string" ? status.trim() : "";
  return {
    status: null,
    isKnown: false,
    label: raw ? `Không rõ (${raw})` : "Chưa rõ trạng thái",
    description: "Chưa có thông tin trạng thái hợp lệ cho hồ sơ này.",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
    nodeClassName: "border-slate-300 bg-slate-50 text-slate-600",
  };
}

export function parseValidApplicationDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return toDate(trimmed);
}

/**
 * Builds an honest, inference-free timeline for both newly recorded and legacy applications.
 * Never fabricates step transition timestamps from updatedAt or assumes intermediate stages.
 */
export function buildApplicationTimeline(application) {
  const rawStatus = application?.status;
  const currentMeta = getApplicationStatusMeta(rawStatus);
  const currentStatus = currentMeta.isKnown ? currentMeta.status : null;
  const createdAtDate = parseValidApplicationDate(application?.createdAt);
  const updatedAtDate = parseValidApplicationDate(application?.updatedAt);

  const rawHistory = Array.isArray(application?.statusHistory)
    ? application.statusHistory
    : [];

  const recordedEntries = rawHistory
    .map((entry, index) => {
      if (!entry || !isValidApplicationStatus(entry.status)) return null;
      const parsedTimestamp = parseValidApplicationDate(entry.timestamp);
      return {
        status: entry.status,
        timestamp: parsedTimestamp,
        timestampKnown: Boolean(parsedTimestamp),
        order: index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.getTime() - b.timestamp.getTime() || a.order - b.order;
      }
      return a.order - b.order;
    });

  const milestones = [];
  const recordedPending = recordedEntries.find((item) => item.status === "Pending");

  if (!recordedPending && createdAtDate) {
    milestones.push({
      key: "submitted-Pending",
      status: "Pending",
      meta: APPLICATION_STATUS_META.Pending,
      timestamp: createdAtDate,
      timestampKnown: true,
      source: "createdAt",
      isSubmission: true,
      isCurrent: false,
    });
  }

  for (let i = 0; i < recordedEntries.length; i += 1) {
    const entry = recordedEntries[i];
    const isFirstPending = entry.status === "Pending" && entry === recordedPending;
    const resolvedTimestamp =
      entry.timestamp || (isFirstPending ? createdAtDate : null);
    milestones.push({
      key: `history-${entry.status}-${i}`,
      status: entry.status,
      meta: getApplicationStatusMeta(entry.status),
      timestamp: resolvedTimestamp,
      timestampKnown: Boolean(resolvedTimestamp),
      source: entry.timestamp
        ? "history"
        : isFirstPending && createdAtDate
          ? "createdAt"
          : "history-undated",
      isSubmission: isFirstPending,
      isCurrent: false,
    });
  }

  const lastRecordedStatus = milestones.at(-1)?.status || null;
  if (currentStatus && currentStatus !== lastRecordedStatus) {
    milestones.push({
      key: `current-${currentStatus}`,
      status: currentStatus,
      meta: currentMeta,
      timestamp: null,
      timestampKnown: false,
      source: "current-status",
      isSubmission: currentStatus === "Pending",
      isCurrent: true,
    });
  } else if (!currentStatus) {
    milestones.push({
      key: "current-unknown",
      status: typeof rawStatus === "string" ? rawStatus.trim() || null : null,
      meta: currentMeta,
      timestamp: null,
      timestampKnown: false,
      source: "current-status",
      isSubmission: false,
      isCurrent: true,
    });
  } else if (milestones.length > 0) {
    milestones[milestones.length - 1].isCurrent = true;
  }

  let hasUnrecordedSteps = false;
  if (milestones.some((item) => item.meta?.isKnown && !item.timestampKnown)) {
    hasUnrecordedSteps = true;
  }
  for (let i = 1; i < milestones.length; i += 1) {
    const prevStatus = milestones[i - 1]?.status;
    const currStatus = milestones[i]?.status;
    if (
      isValidApplicationStatus(prevStatus) &&
      isValidApplicationStatus(currStatus) &&
      prevStatus !== currStatus &&
      !isAllowedApplicationStatusTransition(prevStatus, currStatus)
    ) {
      hasUnrecordedSteps = true;
      break;
    }
  }
  if (!createdAtDate && !recordedPending && currentStatus !== "Pending") {
    hasUnrecordedSteps = true;
  }

  const submittedAt =
    createdAtDate ||
    recordedPending?.timestamp ||
    null;

  const latestHistoryTimestamp = recordedEntries.reduce((latest, entry) => {
    if (!entry.timestamp) return latest;
    if (!latest || entry.timestamp.getTime() > latest.getTime()) {
      return entry.timestamp;
    }
    return latest;
  }, null);

  const lastUpdatedAt =
    updatedAtDate && latestHistoryTimestamp
      ? updatedAtDate.getTime() >= latestHistoryTimestamp.getTime()
        ? updatedAtDate
        : latestHistoryTimestamp
      : updatedAtDate || latestHistoryTimestamp || null;

  return {
    currentStatus,
    currentMeta,
    submittedAt,
    lastUpdatedAt,
    milestones,
    hasRecordedHistory: recordedEntries.length > 0,
    isLegacyPartialHistory: hasUnrecordedSteps,
  };
}

/**
 * Merges a validated PUT /api/jobs/applications/:id response into a company dashboard record
 * while preserving populated fields (such as jobId) and snapshot metadata.
 */
export function mergeUpdatedApplicationRecord(existingApp, responsePayload) {
  if (!existingApp || typeof existingApp !== "object") {
    return existingApp;
  }
  const serverApp =
    responsePayload?.application && typeof responsePayload.application === "object"
      ? responsePayload.application
      : null;
  if (!serverApp) {
    return existingApp;
  }

  const nextStatus = isValidApplicationStatus(serverApp.status)
    ? serverApp.status
    : existingApp.status;

  const preservedJobId =
    serverApp.jobId && typeof serverApp.jobId === "object"
      ? serverApp.jobId
      : existingApp.jobId && typeof existingApp.jobId === "object"
        ? existingApp.jobId
        : (serverApp.jobId ?? existingApp.jobId);

  const preservedCandidateId =
    serverApp.candidateId && typeof serverApp.candidateId === "object"
      ? serverApp.candidateId
      : existingApp.candidateId && typeof existingApp.candidateId === "object"
        ? existingApp.candidateId
        : (serverApp.candidateId ?? existingApp.candidateId);

  const nextHistory = Array.isArray(serverApp.statusHistory)
    ? serverApp.statusHistory
    : existingApp.statusHistory;

  const nextUpdatedAt = parseValidApplicationDate(serverApp.updatedAt)
    ? serverApp.updatedAt
    : existingApp.updatedAt;

  const nextCreatedAt = parseValidApplicationDate(serverApp.createdAt)
    ? serverApp.createdAt
    : existingApp.createdAt;

  return {
    ...existingApp,
    ...serverApp,
    status: nextStatus,
    jobId: preservedJobId,
    candidateId: preservedCandidateId,
    jobSnapshot: serverApp.jobSnapshot || existingApp.jobSnapshot,
    statusHistory: nextHistory,
    createdAt: nextCreatedAt,
    updatedAt: nextUpdatedAt,
  };
}
