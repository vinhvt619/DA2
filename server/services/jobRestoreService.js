import { isApprovedCompany, isVerifiedCompany } from '../../shared/companyPolicy.js';
import { jobHasExpiredDeadline } from '../../shared/adminJobStatus.js';

export function createJobRestoreHandler({ JobModel, UserModel }) {
  return async (req, res) => {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
      if (job.deletedAt || job.status === 'Deleted') return res.status(410).json({ message: 'Tin tuyển dụng đã bị xóa.' });
      if (!job.isAdminHidden) return res.status(400).json({ message: 'Tin này không bị admin ẩn.' });
      if (job.status === 'Draft' || job.status === 'Rejected' || job.approvalStatus === 'Rejected') return res.status(400).json({ message: 'Không thể khôi phục tin nháp hoặc tin đã bị từ chối.' });
      if (jobHasExpiredDeadline(job)) return res.status(400).json({ message: 'Tin đã hết hạn. Doanh nghiệp cần cập nhật hạn tuyển dụng trước khi hiện lại.' });
      const company = await UserModel.findById(job.companyId);
      if (!isApprovedCompany(company)) return res.status(409).json({ message: 'Tài khoản doanh nghiệp chưa được duyệt hoặc đã bị khóa/xóa.' });
      const trustedLegacy = job.approvalStatus !== 'Approved';
      if (trustedLegacy && !isVerifiedCompany(company)) return res.status(400).json({ message: 'Tin chưa được duyệt và doanh nghiệp chưa được xác minh, không thể hiện lại.' });
      const update = { status: 'Active', isAdminHidden: false };
      if (trustedLegacy) Object.assign(update, { approvalStatus: 'Approved', approvalSource: 'company_verification', reviewedBy: null, reviewedAt: null, rejectionReason: '' });
      const restored = await JobModel.findOneAndUpdate({
        _id: job._id, updatedAt: job.updatedAt || { $exists: false }, deletedAt: null, isAdminHidden: true,
        status: { $nin: ['Draft', 'Rejected', 'Deleted'] }, approvalStatus: { $ne: 'Rejected' },
        $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }],
      }, { $set: update }, { returnDocument: 'after', runValidators: true });
      if (!restored) return res.status(409).json({ message: 'Tin đã thay đổi hoặc vừa hết hạn. Vui lòng tải lại trước khi khôi phục.' });
      return res.json({ message: 'Đã hiện lại tin tuyển dụng.', job: restored });
    } catch {
      return res.status(500).json({ message: 'Không thể khôi phục tin tuyển dụng lúc này.' });
    }
  };
}
