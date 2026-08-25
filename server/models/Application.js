import mongoose from 'mongoose';

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
  jobSnapshot: {
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    type: { type: String, default: "" },
    salary: { type: String, default: "" },
  },
}, { timestamps: true });

ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);
