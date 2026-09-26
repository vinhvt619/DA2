import {
  differenceInCalendarDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  isValid,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";

export function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(String(value));
  return isValid(date) ? date : null;
}

export function formatDate(value, pattern = "dd/MM/yyyy", fallback = "") {
  const date = toDate(value);
  return date ? format(date, pattern, { locale: vi }) : fallback;
}

export function formatDateTime(
  value,
  pattern = "HH:mm dd/MM/yyyy",
  fallback = "",
) {
  return formatDate(value, pattern, fallback);
}

export function formatRelativeTime(value, fallback = "") {
  const date = toDate(value);
  if (!date) return fallback;

  const now = new Date();
  const seconds = Math.max(0, differenceInSeconds(now, date));
  if (seconds < 60) return "Vừa xong";

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} giờ trước`;

  const days = differenceInDays(now, date);
  if (days < 7) return `${days} ngày trước`;

  return formatDate(date, "dd/MM/yyyy", fallback);
}

export function formatRelativeDay(value, fallback = "Không rõ") {
  const date = toDate(value);
  if (!date) return fallback;

  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days > 1) return `${days} ngày trước`;
  return formatDate(date, "dd/MM/yyyy", fallback);
}

export function formatChatDateLabel(
  value,
  referenceDate = new Date(),
  fallback = "Không rõ ngày",
) {
  const date = toDate(value);
  if (!date) return fallback;

  const days = differenceInCalendarDays(referenceDate, date);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return formatDate(date, "dd/MM/yyyy", fallback);
}

export function formatResumeDate(value) {
  if (!value || typeof value !== "string") return "";
  if (/^\d{4}-\d{2}$/.test(value)) {
    return formatDate(`${value}-01`, "MM/yyyy", value);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value, "dd/MM/yyyy", value);
  }
  return value;
}

export function formatResumeDateRange(startDate, endDate) {
  return [formatResumeDate(startDate), formatResumeDate(endDate)]
    .filter(Boolean)
    .join(" - ");
}
