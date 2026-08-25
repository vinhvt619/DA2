import Job from '../models/Job.js';
import User from '../models/User.js';
import { createNotificationsBulk } from '../utils/notificationService.js';

export const runJobExpiryCheck = async () => {
  console.log('--- Bắt đầu chạy Cron Job kiểm tra Job hết hạn ---');
  const now = new Date();
  const summary = {
    expiredJobs: 0,
    expiringJobs: 0,
  };
  
  try {
    // ==========================================
    // NHÁNH 1 - JOB SẮP HẾT HẠN (DƯỚI 3 NGÀY)
    // ==========================================
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const expiringJobs = await Job.find({
      expiryDate: { $gte: now, $lte: threeDaysLater },
      expiryNotifiedAt: null,
      status: { $ne: 'Expired' }
    });

    if (expiringJobs.length > 0) {
      const expiringNotifs = [];
      const jobIds = [];

      for (const job of expiringJobs) {
        jobIds.push(job._id);

        // Notif cho Company
        expiringNotifs.push({
          recipient: job.companyId,
          recipientRole: 'company',
          type: 'JOB_EXPIRING_SOON',
          title: 'Tin tuyển dụng sắp hết hạn',
          message: `Tin tuyển dụng "${job.title}" của bạn sẽ hết hạn sau chưa tới 3 ngày.`,
          link: '/CompanyDashboard'
        });

        // Notif cho Candidates đã lưu job
        const savedUsers = await User.find({ 'savedJobs.jobId': job._id.toString() });
        for (const user of savedUsers) {
          expiringNotifs.push({
            recipient: user._id,
            recipientRole: 'employee',
            type: 'JOB_EXPIRING_SOON',
            title: 'Việc làm đã lưu sắp hết hạn',
            message: `Việc làm "${job.title}" mà bạn đã lưu sẽ hết hạn sau chưa tới 3 ngày. Hãy ứng tuyển ngay!`,
            link: '/UserDashboard'
          });
        }
      }

      // Bulk insert Notif
      const result1 = await createNotificationsBulk(expiringNotifs);
      // Chỉ update cờ nếu insert thành công
      if (result1 && result1.length > 0) {
        await Job.updateMany({ _id: { $in: jobIds } }, { $set: { expiryNotifiedAt: now } });
        summary.expiringJobs = jobIds.length;
        console.log(`Đã gửi thông báo sắp hết hạn cho ${jobIds.length} jobs.`);
      }
    }

    // ==========================================
    // NHÁNH 2 - JOB ĐÃ HẾT HẠN
    // ==========================================
    const expiredJobs = await Job.find({
      expiryDate: { $lt: now },
      expiredNotifiedAt: null
    });

    if (expiredJobs.length > 0) {
      const expiredNotifs = [];
      const expiredJobIds = [];

      for (const job of expiredJobs) {
        expiredJobIds.push(job._id);

        // Notif cho Company
        expiredNotifs.push({
          recipient: job.companyId,
          recipientRole: 'company',
          type: 'JOB_EXPIRED',
          title: 'Tin tuyển dụng đã hết hạn',
          message: `Tin tuyển dụng "${job.title}" của bạn đã hết hạn.`,
          link: '/CompanyDashboard'
        });
      }

      // Bulk insert Notif
      const result2 = await createNotificationsBulk(expiredNotifs);
      // Chỉ update cờ và đổi status nếu insert thành công
      if (result2 && result2.length > 0) {
        await Job.updateMany({ _id: { $in: expiredJobIds } }, { $set: { status: 'Expired', expiredNotifiedAt: now } });
        summary.expiredJobs = expiredJobIds.length;
        console.log(`Đã gửi thông báo hết hạn và đổi status cho ${expiredJobIds.length} jobs.`);
      }
    }

    console.log('--- Hoàn tất Cron Job kiểm tra Job hết hạn ---');
    return summary;
  } catch (error) {
    console.error('Lỗi khi chạy Cron Job kiểm tra Job hết hạn:', error);
    throw error;
  }
};
