// Legacy active accounts remain usable; missing verification never grants trust.
export function companyAccountStatus(company) {
  if (company?.companyAccountApprovalStatus) return company.companyAccountApprovalStatus;
  if (company?.status === 'pending') return company.companyVerificationStatus === 'rejected' ? 'rejected' : 'pending';
  return 'approved';
}
export function isApprovedCompany(company) {
  return Boolean(company && company.role === 'company' && !company.isBanned && !company.deletedAt && companyAccountStatus(company) === 'approved');
}
export function isVerifiedCompany(company) {
  return isApprovedCompany(company) && company.companyVerificationStatus === 'verified';
}
export function companyRegistrationFields(role, body = {}) {
  return role === 'company' ? {
    status: 'pending', companyAccountApprovalStatus: 'pending', companyVerificationStatus: 'unverified',
    fullName: String(body.fullName || '').trim().slice(0, 200),
    companyTaxCode: String(body.companyTaxCode || '').trim().slice(0, 50),
    companyWebsite: String(body.companyWebsite || '').trim().slice(0, 500),
  } : { status: 'active' };
}
