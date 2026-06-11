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
}, { timestamps: true });

export default mongoose.model('Job', JobSchema);
