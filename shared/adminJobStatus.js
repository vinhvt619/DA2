export function jobHasExpiredDeadline(job, now = new Date()) {
  if (!job?.expiryDate) return false;
  const deadline = new Date(job.expiryDate);
  return Number.isFinite(deadline.getTime()) && deadline < now;
}
export function adminJobStatus(job, now = new Date()) {
  const status = String(job?.rawStatus || job?.status || '').toLowerCase();
  if (job?.deletedAt || status === 'deleted') return 'deleted';
  if (status === 'draft') return 'draft';
  if (status === 'rejected' || job?.approvalStatus === 'Rejected') return 'rejected';
  if (jobHasExpiredDeadline(job, now)) return 'expired';
  if (job?.isAdminHidden) return 'hidden';
  if (['expired', 'closed'].includes(status)) return 'closed';
  if (job?.approvalStatus !== 'Approved' || status === 'pending') return 'pending';
  return status === 'active' ? 'active' : 'closed';
}
