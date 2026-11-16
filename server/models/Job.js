import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true, // e.g. "Full-time", "Part-time", "Intern"
  },
  salary: {
    type: String,
    required: true, // e.g. "12-18 triệu"
  },
  experience: {
    type: String,
    default: 'Không yêu cầu',
  },
  education: {
    type: String,
    default: 'Không yêu cầu',
  },
  workModel: {
    type: String,
    default: 'Tại văn phòng',
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: [String],
    default: [],
  },
  benefits: {
    type: [String],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Active', 'Expired', 'Rejected', 'Deleted'],
    default: 'Pending',
  },
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvalSource: { type: String, enum: ['admin', 'company_verification', null], default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: '' },
  deletedAt: { type: Date, default: null },
  isAdminHidden: { type: Boolean, default: false },
  expiryDate: {
    type: Date,
  },
  expiryNotifiedAt: { type: Date, default: null },
  expiredNotifiedAt: { type: Date, default: null },
}, { timestamps: true });

JobSchema.index({
  status: 1,
  approvalStatus: 1,
  deletedAt: 1,
  isAdminHidden: 1,
  createdAt: -1,
});
JobSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model('Job', JobSchema);
