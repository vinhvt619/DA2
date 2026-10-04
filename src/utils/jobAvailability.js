const UNAVAILABLE_STATUSES = new Set(['Draft', 'Pending', 'Rejected', 'Expired']);

export const isJobDeleted = (job) =>
  Boolean(job?.deletedAt) || job?.status === "Deleted";

export const isJobExpired = (job, now = new Date()) => {
  if (!job) return false;
  if (job.status === "Expired") return true;
  if (!job.expiryDate) return false;

  const expiryDate = new Date(job.expiryDate);
  const currentDate = now instanceof Date ? now : new Date(now);
  return (
    !Number.isNaN(expiryDate.getTime()) &&
    !Number.isNaN(currentDate.getTime()) &&
    expiryDate < currentDate
  );
};

export const isJobUnavailable = (job, now = new Date()) => {
  if (!job || isJobDeleted(job) || job.isAdminHidden || (job.approvalStatus && job.approvalStatus !== 'Approved')) return true;
  if (UNAVAILABLE_STATUSES.has(job.status)) return true;
  return isJobExpired(job, now);
};

export const formatJobDeadline = (job, now = new Date()) => {
  if (isJobExpired(job, now)) return "Đã hết hạn";
  if (!job?.expiryDate) return job?.deadline || "Không giới hạn";

  const expiryDate = new Date(job.expiryDate);
  const currentDate = now instanceof Date ? now : new Date(now);
  if (
    Number.isNaN(expiryDate.getTime()) ||
    Number.isNaN(currentDate.getTime())
  ) {
    return job.deadline || "Không giới hạn";
  }

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(expiryDate);
  const remainingDays = Math.ceil(
    (expiryDate.getTime() - currentDate.getTime()) / 86400000,
  );

  if (remainingDays === 0) return `${formattedDate} (hôm nay)`;
  return `${formattedDate} (còn ${remainingDays} ngày)`;
};
