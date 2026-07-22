export const isJobDeleted = (job) =>
  Boolean(job?.deletedAt) || job?.status === "Deleted";

export const isJobUnavailable = (job, now = new Date()) => {
  if (!job || isJobDeleted(job)) return true;
  if (["Draft", "Expired"].includes(job.status)) return true;
  if (!job.expiryDate) return false;

  const expiryDate = new Date(job.expiryDate);
  return !Number.isNaN(expiryDate.getTime()) && expiryDate < now;
};
