export const isJobDeleted = (job) =>
  Boolean(job?.deletedAt) || job?.status === "Deleted";

export const isJobUnavailable = (job, now = new Date()) => {
  if (!job || isJobDeleted(job) || job.isAdminHidden || job.approvalStatus !== 'Approved') return true;
  if (job.status !== 'Active') return true;
  if (!job.expiryDate) return false;

  const expiryDate = new Date(job.expiryDate);
  return !Number.isNaN(expiryDate.getTime()) && expiryDate < now;
};

export const publicJobsFilter = (now = new Date()) => ({
  status: "Active",
  approvalStatus: "Approved",
  deletedAt: null,
  isAdminHidden: { $ne: true },
  $or: [
    { expiryDate: { $exists: false } },
    { expiryDate: null },
    { expiryDate: { $gte: now } },
  ],
});
