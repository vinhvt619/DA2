import { companyAccountStatus } from '../../shared/companyPolicy.js';
import { cleanAiText } from '../utils/aiDataSanitizer.js';

export function companyDecision(company, body) {
  const reason = cleanAiText(body.reason || '', 2000).trim();
  switch (body.action) {
    case 'approve': return { companyAccountApprovalStatus: 'approved', status: 'active', companyAccountRejectionReason: '' };
    case 'reject':
      if (!reason) throw new Error('Vui lòng nhập lý do từ chối tài khoản.');
      return { companyAccountApprovalStatus: 'rejected', status: 'pending', companyVerificationStatus: 'unverified', companyAccountRejectionReason: reason };
    case 'verify':
      if (companyAccountStatus(company) !== 'approved' || company.isBanned) throw new Error('Cần duyệt và mở khóa tài khoản trước khi xác minh.');
      return { companyVerificationStatus: 'verified' };
    case 'unverify': return { companyVerificationStatus: 'unverified' };
    case 'suspend': return { isBanned: true };
    case 'restore': return { isBanned: false };
    default: throw new Error('Thao tác không hợp lệ.');
  }
}

export function createCompanyAccountHandler({ UserModel, hashPassword }) {
  return async (req, res) => {
    try {
      const body = req.body || {};
      const username = String(body.username || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = cleanAiText(body.fullName || '', 200).trim();
      if (!username || username.length > 100 || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 72) return res.status(400).json({ message: 'Nhập tên doanh nghiệp, tên đăng nhập, email hợp lệ và mật khẩu 8–72 ký tự.' });
      if (await UserModel.findOne({ $or: [{ username }, { email }] })) return res.status(409).json({ message: 'Tên đăng nhập hoặc email đã tồn tại.' });
      const company = await UserModel.create({
        username, email, fullName, password: await hashPassword(body.password, 10), role: 'company', status: 'active',
        companyAccountApprovalStatus: 'approved', companyVerificationStatus: body.verified === true ? 'verified' : 'unverified',
        companyTaxCode: cleanAiText(body.companyTaxCode || '', 50), companyWebsite: cleanAiText(body.companyWebsite || '', 500),
      });
      const safe = company.toObject ? company.toObject() : { ...company };
      delete safe.password;
      delete safe.pin;
      return res.status(201).json({ message: 'Đã tạo tài khoản doanh nghiệp.', company: safe });
    } catch (error) {
      return res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'Tên đăng nhập hoặc email đã tồn tại.' : 'Không thể tạo tài khoản doanh nghiệp.' });
    }
  };
}
