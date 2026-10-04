import test from 'node:test';
import assert from 'node:assert/strict';
import { jobSubmissionPolicy, normalizeJobExpiry } from '../server/utils/jobModeration.js';
import { isJobUnavailable } from '../server/utils/jobAvailability.js';
import { createJobReviewHandler } from '../server/services/jobReviewService.js';
const company = { _id: 'company', role: 'company', companyVerificationStatus: 'verified' };
const job = { _id: 'job', title: 'Lập trình viên', companyId: 'company', status: 'Pending', approvalStatus: 'Pending', updatedAt: '2026-10-02T01:00:00Z' };
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
async function review(body, options = {}) {
  const res = response(); let update;
  const handler = createJobReviewHandler({ JobModel: { findById: async () => ({ ...job, ...options.job }), findOneAndUpdate: async (filter, value) => { update = { filter, value }; return options.stale ? null : value.$set; } }, UserModel: { findById: async () => options.company === null ? null : { ...company, ...options.company } } });
  await handler({ params: { id: 'job' }, user: { id: 'admin' }, body: { updatedAt: job.updatedAt, ...body } }, res);
  return { res, update };
}
test('new jobs cannot self-approve; drafts remain private', () => {
  assert.equal(jobSubmissionPolicy(null, { title: 'Job', status: 'Active', approvalStatus: 'Approved' }).status, 'Pending');
  assert.equal(jobSubmissionPolicy(null, { title: 'Job', status: 'Draft' }).status, 'Draft');
  assert.equal(isJobUnavailable({ status: 'Active' }), true);
});
test('editing approved content resets review; approved jobs may close and reopen', () => {
  const approved = { ...job, status: 'Active', approvalStatus: 'Approved' };
  assert.equal(jobSubmissionPolicy(approved, { description: 'Changed' }).approvalStatus, 'Pending');
  assert.deepEqual(jobSubmissionPolicy(approved, { status: 'Expired' }), { status: 'Expired' });
  assert.deepEqual(jobSubmissionPolicy({ ...approved, status: 'Expired' }, { status: 'Active' }), { status: 'Active' });
});
test('pending/rejected/hidden/expired jobs cannot be reopened by company', () => {
  assert.throws(() => jobSubmissionPolicy(job, { status: 'Active' }));
  assert.throws(() => jobSubmissionPolicy({ ...job, approvalStatus: 'Rejected' }, { status: 'Active' }));
  for (const extra of [{ isAdminHidden: true }, { expiryDate: '2020-01-01' }]) assert.throws(() => jobSubmissionPolicy({ ...job, approvalStatus: 'Approved', ...extra }, { status: 'Active' }));
});
test('date-only deadline ends at end of Vietnam day', () => { assert.equal(normalizeJobExpiry('2026-10-02').toISOString(), '2026-10-02T16:59:59.999Z'); });
test('admin approval records actor, timestamp and exact content version', async () => {
  const { res, update } = await review({ action: 'approve' });
  assert.equal(res.body.job.approvalStatus, 'Approved'); assert.equal(update.filter.updatedAt.toISOString(), new Date(job.updatedAt).toISOString()); assert.equal(update.value.$set.reviewedBy, 'admin');
});
test('admin can approve jobs from approved but unverified companies', async () => {
  const { res } = await review({ action: 'approve' }, { company: { companyAccountApprovalStatus: 'approved', companyVerificationStatus: 'unverified' } });
  assert.equal(res.body.job.approvalStatus, 'Approved');
  assert.equal(res.body.job.approvalSource, 'admin');
});
test('reject requires reason and persists rejection', async () => {
  assert.equal((await review({ action: 'reject', reason: ' ' })).res.code, 400);
  const { res } = await review({ action: 'reject', reason: 'Thiếu thông tin' });
  assert.equal(res.body.job.status, 'Rejected'); assert.equal(res.body.job.rejectionReason, 'Thiếu thông tin');
});
test('review rejects stale version, draft, deleted and disabled owner', async () => {
  assert.equal((await review({ action: 'approve' }, { stale: true })).res.code, 409);
  assert.equal((await review({ action: 'approve' }, { job: { status: 'Draft' } })).res.code, 409);
  assert.equal((await review({ action: 'approve' }, { job: { deletedAt: new Date() } })).res.code, 404);
  for (const owner of [null, { deletedAt: new Date() }, { isBanned: true }, { companyAccountApprovalStatus: 'pending' }]) assert.equal((await review({ action: 'approve' }, { company: owner })).res.code, 409);
});
test('expired post cannot be approved', async () => { assert.equal((await review({ action: 'approve' }, { job: { expiryDate: '2020-01-01' } })).res.code, 400); });
