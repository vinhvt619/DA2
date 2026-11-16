import mongoose from 'mongoose';
import Resume from './Resume.js';

const ResumeSnapshotSchema = new mongoose.Schema({ ...Resume.schema.obj }, { _id: false, id: false });
ResumeSnapshotSchema.remove('userId');

const ApplicationStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Reviewing', 'Interview', 'Offered', 'Rejected', 'Accepted'],
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
}, { _id: false, id: false });

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  resumeSnapshot: {
    type: ResumeSnapshotSchema,
    default: undefined,
    select: false,
  },
  resumeSnapshotCapturedAt: Date,
  resumeSnapshotOrigin: {
    type: String,
    enum: ['submitted', 'legacy'],
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  coverLetter: {
    type: String,
    default: "",
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewing', 'Interview', 'Offered', 'Rejected', 'Accepted'],
    default: 'Pending',
  },
  statusHistory: {
    type: [ApplicationStatusHistorySchema],
    default: undefined,
  },
  jobSnapshot: {
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    type: { type: String, default: "" },
    salary: { type: String, default: "" },
  },
}, {
  timestamps: true,
  toJSON: {
    transform(_document, value) {
      delete value.resumeSnapshot;
      return value;
    },
  },
});

ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
ApplicationSchema.index({ resumeId: 1 });

export default mongoose.model('Application', ApplicationSchema);
