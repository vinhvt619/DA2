import { isVerifiedCompany } from '../../shared/companyPolicy.js';
const CONTENT_FIELDS = ['title', 'company', 'location', 'type', 'salary', 'experience', 'education', 'workModel', 'description', 'requirements', 'benefits', 'tags', 'expiryDate'];
export function jobSubmissionPolicy(job, body, company) {
  const writesContent = CONTENT_FIELDS.some((key) => body[key] !== undefined);
  const desired = body.status || job?.status || 'Pending';
  if (!['Draft', 'Pending', 'Active', 'Expired'].includes(desired)) throw new Error('Trạng thái tin tuyển dụng không hợp lệ.');
  if (writesContent || !job) {
    const publish = desired !== 'Draft' && isVerifiedCompany(company) && !job?.isAdminHidden;
    return { status: desired === 'Draft' ? 'Draft' : publish ? 'Active' : 'Pending', approvalStatus: publish ? 'Approved' : 'Pending', approvalSource: publish ? 'company_verification' : null, reviewedAt: null, reviewedBy: null, rejectionReason: '' };
  }
  if (job.approvalStatus !== 'Approved') throw new Error('Tin chưa được admin duyệt. Hãy sửa nội dung và gửi duyệt.');
  if (desired === 'Active' && (job.isAdminHidden || (job.expiryDate && new Date(job.expiryDate) < new Date()))) throw new Error('Không thể mở tin đã hết hạn hoặc bị admin ẩn.');
  if (!['Active', 'Expired'].includes(desired)) throw new Error('Chỉ được mở hoặc đóng tin đã duyệt.');
  return { status: desired };
}
export function normalizeJobExpiry(value) {
  if (!value) return null;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999+07:00` : value);
}
