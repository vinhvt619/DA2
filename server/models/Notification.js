import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['employee', 'company'], required: true },
  type: { 
    type: String, 
    enum: ['NEW_APPLICATION', 'APPLICATION_STATUS_CHANGED', 'INTERVIEW_INVITE', 'JOB_EXPIRING_SOON', 'JOB_EXPIRED', 'SYSTEM', 'APPLICATION_SUBMITTED'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Compound index để tối ưu query danh sách và đếm số lượng chưa đọc
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
