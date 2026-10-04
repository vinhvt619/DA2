import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { companyAccountStatus, companyRegistrationFields, isApprovedCompany, isVerifiedCompany } from '../shared/companyPolicy.js';
import { companyDecision, createCompanyAccountHandler } from '../server/services/companyAdminService.js';
import { jobSubmissionPolicy } from '../server/utils/jobModeration.js';
const approved = { role: 'company', status: 'active', companyAccountApprovalStatus: 'approved', companyVerificationStatus: 'unverified' };
const verified = { ...approved, companyVerificationStatus: 'verified' };
test('self-registration cannot inject account approval or verification', () => {
  const fields = companyRegistrationFields('company', { companyAccountApprovalStatus: 'approved', companyVerificationStatus: 'verified', verified: true, fullName: ' Company ' });
  assert.equal(fields.companyAccountApprovalStatus, 'pending'); assert.equal(fields.companyVerificationStatus, 'unverified'); assert.equal(fields.fullName, 'Company');
});
test('legacy active companies are approved but not implicitly verified', () => {
  const legacy = { role: 'company', status: 'active' };
  assert.equal(companyAccountStatus(legacy), 'approved'); assert.equal(isApprovedCompany(legacy), true); assert.equal(isVerifiedCompany(legacy), false);
  assert.equal(isApprovedCompany({ ...legacy, status: 'pending' }), false);
});
test('approval and verification are independent; restore never verifies', () => {
  assert.equal(companyDecision({ status: 'pending' }, { action: 'approve' }).companyVerificationStatus, undefined);
  assert.equal(companyDecision(approved, { action: 'verify' }).companyVerificationStatus, 'verified');
  assert.equal(companyDecision(verified, { action: 'unverify' }).companyVerificationStatus, 'unverified');
  assert.deepEqual(companyDecision(approved, { action: 'restore' }), { isBanned: false });
  assert.throws(() => companyDecision({ ...approved, companyAccountApprovalStatus: 'pending' }, { action: 'verify' }));
  assert.throws(() => companyDecision({ ...approved, isBanned: true }, { action: 'verify' }));
});
test('account rejection requires reason and removes trust', () => {
  assert.throws(() => companyDecision(approved, { action: 'reject' }));
  assert.throws(() => companyDecision(approved, { action: 'bogus' }));
  const rejection = companyDecision(approved, { action: 'reject', reason: 'Thông tin không hợp lệ' });
  assert.equal(isApprovedCompany({ ...approved, ...rejection }), false); assert.equal(rejection.companyVerificationStatus, 'unverified');
});
test('verified jobs publish immediately; unverified content waits for admin', () => {
  const body = { title: 'Job', status: 'Pending', approvalStatus: 'Approved' };
  assert.equal(jobSubmissionPolicy(null, body, approved).status, 'Pending');
  const trusted = jobSubmissionPolicy(null, body, verified);
  assert.equal(trusted.status, 'Active'); assert.equal(trusted.approvalSource, 'company_verification'); assert.equal(trusted.reviewedBy, null);
  assert.equal(jobSubmissionPolicy({ approvalStatus: 'Approved' }, body, verified).status, 'Active');
  assert.equal(jobSubmissionPolicy(null, { ...body, status: 'Draft' }, verified).status, 'Draft');
});
test('pending, banned, deleted or fake verified accounts never bypass moderation', () => {
  for (const extra of [{ companyAccountApprovalStatus: 'pending' }, { companyAccountApprovalStatus: 'rejected' }, { isBanned: true }, { deletedAt: new Date() }, { role: 'employee' }]) {
    const owner = { ...verified, ...extra }; assert.equal(isApprovedCompany(owner), false); assert.equal(jobSubmissionPolicy(null, { title: 'Job' }, owner).status, 'Pending');
  }
  assert.equal(jobSubmissionPolicy({ isAdminHidden: true }, { title: 'Changed' }, verified).status, 'Pending');
});
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
const valid = { fullName: 'Company', username: 'company', email: 'company@example.test', password: 'password123' };
test('manual company creation hashes password, fixes role, and defaults to unverified', async () => {
  let created;
  const handler = createCompanyAccountHandler({ UserModel: { findOne: async () => null, create: async (body) => { created = body; return body; } }, hashPassword: bcrypt.hash });
  const res = response(); await handler({ body: { ...valid, role: 'admin' } }, res);
  assert.equal(res.code, 201); assert.equal(created.role, 'company'); assert.equal(created.companyAccountApprovalStatus, 'approved'); assert.equal(created.companyVerificationStatus, 'unverified');
  assert.equal(await bcrypt.compare(valid.password, created.password), true); assert.equal(res.body.company.password, undefined);
});
test('manual creation verifies only explicit true and rejects weak input/duplicates', async () => {
  const handler = createCompanyAccountHandler({ UserModel: { findOne: async ({ $or }) => $or[0].username === 'duplicate' ? {} : null, create: async (body) => body }, hashPassword: async () => 'hashed' });
  for (const body of [{ ...valid, password: '123' }, { ...valid, email: 'wrong' }]) { const res = response(); await handler({ body }, res); assert.equal(res.code, 400); }
  const duplicate = response(); await handler({ body: { ...valid, username: 'duplicate' } }, duplicate); assert.equal(duplicate.code, 409);
  const res = response(); await handler({ body: { ...valid, verified: true } }, res); assert.equal(res.body.company.companyVerificationStatus, 'verified');
});
