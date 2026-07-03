import Notification from '../models/Notification.js';

/**
 * Tạo mới 1 thông báo
 * @param {Object} data 
 * @param {String} data.recipient - User ID của người nhận
 * @param {String} data.recipientRole - 'employee' hoặc 'company'
 * @param {String} data.type - Loại thông báo (NEW_APPLICATION, ...)
 * @param {String} data.title - Tiêu đề
 * @param {String} data.message - Nội dung chi tiết
 * @param {String} [data.link] - URL điều hướng khi click (tuỳ chọn)
 */
export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Không ném lỗi ra ngoài để tránh crash luồng tính năng chính
    return null;
  }
};

/**
 * Tạo hàng loạt thông báo (dùng cho Cron Job hoặc gửi số đông)
 * @param {Array} dataArray - Mảng các object thông báo
 */
export const createNotificationsBulk = async (dataArray) => {
  if (!dataArray || dataArray.length === 0) return [];
  try {
    const result = await Notification.insertMany(dataArray);
    return result;
  } catch (error) {
    console.error('Error in createNotificationsBulk:', error);
    // Không ném lỗi ra ngoài
    return [];
  }
};
