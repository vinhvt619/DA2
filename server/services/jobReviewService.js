import { cleanAiText } from '../utils/aiDataSanitizer.js';
import { isApprovedCompany } from '../../shared/companyPolicy.js';
export function createJobReviewHandler({ JobModel, UserModel, notify }) {
  return async (req, res) => {
    try {
      const { action, reason, updatedAt } = req.body || {};
      if (!['approve', 'reject'].includes(action) || !updatedAt || !Number.isFinite(new Date(updatedAt).getTime())) return res.status(400).json({ message: 'Thao tác hoặc phiên bản tin không hợp lệ.' });
      const rejectionReason = cleanAiText(reason || '', 2000);
      if (action === 'reject' && !rejectionReason.trim()) return res.status(400).json({ message: 'Vui lòng nhập lý do không duyệt.' });
      const job = await JobModel.findById(req.params.id);
      if (!job || job.deletedAt || job.status === 'Deleted') return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
      if (job.status === 'Draft' || job.approvalStatus === 'Approved') return res.status(409).json({ message: 'Tin này không còn chờ duyệt.' });
      const company = await UserModel.findById(job.companyId);
      if (!isApprovedCompany(company)) return res.status(409).json({ message: 'Tài khoản doanh nghiệp chưa được duyệt hoặc đã bị vô hiệu hóa.' });
      if (action === 'approve' && job.expiryDate && new Date(job.expiryDate) < new Date()) return res.status(400).json({ message: 'Tin đã hết hạn, doanh nghiệp cần cập nhật và gửi lại.' });
      const reviewed = await JobModel.findOneAndUpdate({ _id: job._id, updatedAt: new Date(updatedAt), deletedAt: null, status: { $nin: ['Deleted', 'Draft'] }, approvalStatus: { $ne: 'Approved' } }, { $set: {
        status: action === 'approve' ? 'Active' : 'Rejected', approvalStatus: action === 'approve' ? 'Approved' : 'Rejected', approvalSource: 'admin', reviewedAt: new Date(), reviewedBy: req.user.id, rejectionReason: action === 'reject' ? rejectionReason : '',
      } }, { returnDocument: 'after', runValidators: true });
      if (!reviewed) return res.status(409).json({ message: 'Nội dung đã thay đổi. Vui lòng tải lại và đọc trước khi duyệt.' });
      // The decision is persisted even if notification delivery temporarily fails.
      if (notify) await notify({ recipient: company._id, recipientRole: 'company', type: 'SYSTEM', title: action === 'approve' ? 'Tin tuyển dụng đã được duyệt' : 'Tin tuyển dụng không được duyệt', message: action === 'approve' ? job.title : `${job.title}: ${rejectionReason}`, link: '/CompanyDashboard' }).catch(() => {});
      return res.json({ job: reviewed, message: action === 'approve' ? 'Đã duyệt tin tuyển dụng.' : 'Đã từ chối tin tuyển dụng.' });
    } catch {
      return res.status(500).json({ message: 'Không thể xử lý quyết định duyệt tin.' });
    }
  };
}
