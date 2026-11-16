export const APPLICATION_STATUSES = Object.freeze([
  'Pending',
  'Reviewing',
  'Interview',
  'Offered',
  'Accepted',
  'Rejected',
]);

export const ALLOWED_NEXT_APPLICATION_STATUSES = Object.freeze({
  Pending: Object.freeze(['Reviewing', 'Rejected']),
  Reviewing: Object.freeze(['Interview', 'Rejected']),
  Interview: Object.freeze(['Offered', 'Rejected']),
  Offered: Object.freeze(['Accepted', 'Rejected']),
  Accepted: Object.freeze(['Rejected']),
  Rejected: Object.freeze([]),
});

export function isValidApplicationStatus(status) {
  return APPLICATION_STATUSES.includes(status);
}

export function getAllowedNextApplicationStatuses(currentStatus = 'Pending') {
  const normalized = isValidApplicationStatus(currentStatus) ? currentStatus : 'Pending';
  return ALLOWED_NEXT_APPLICATION_STATUSES[normalized] || [];
}

export function getAllowedPreviousStatuses(targetStatus) {
  if (!isValidApplicationStatus(targetStatus)) {
    return [];
  }
  return APPLICATION_STATUSES.filter((sourceStatus) =>
    ALLOWED_NEXT_APPLICATION_STATUSES[sourceStatus]?.includes(targetStatus)
  );
}

export function isAllowedApplicationStatusTransition(fromStatus, toStatus) {
  if (!isValidApplicationStatus(fromStatus) || !isValidApplicationStatus(toStatus)) {
    return false;
  }
  return ALLOWED_NEXT_APPLICATION_STATUSES[fromStatus].includes(toStatus);
}
