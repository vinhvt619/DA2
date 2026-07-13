import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({ networkName: String, username: String, link: String });
const ExperienceSchema = new mongoose.Schema({ title: String, company: String, location: String, startDate: String, endDate: String, description: String });
const EducationSchema = new mongoose.Schema({ title: String, company: String, location: String, startDate: String, endDate: String, description: String });
const SkillSchema = new mongoose.Schema({ title: String, description: String, performance: String });
const LanguageSchema = new mongoose.Schema({ title: String, description: String });
const CertificateSchema = new mongoose.Schema({ title: String, date: String, publisher: String, description: String });
const ProjectSchema = new mongoose.Schema({ title: String, company: String, location: String, startDate: String, endDate: String, date: String, link: String, description: String });
const AwardSchema = new mongoose.Schema({ title: String, awarder: String, date: String, description: String });
const HobbySchema = new mongoose.Schema({ title: String });

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, default: "CV Mới Của Tôi" },
  pdfData: { type: String, default: "" },
  fileName: { type: String, default: "" },
  isVirtual: { type: Boolean, default: false },
  image: { type: String, default: "" },
  personalInfo: {
    fullName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" }
  },
  bio: { type: String, default: "" },
  profile: [ProfileSchema],
  experience: [ExperienceSchema],
  education: [EducationSchema],
  skill: [SkillSchema],
  language: [LanguageSchema],
  certificate: [CertificateSchema],
  project: [ProjectSchema],
  award: [AwardSchema],
  hobby: [HobbySchema],
  selectedTemplate: { type: String, default: "modern" },
}, { timestamps: true });

export default mongoose.model('Resume', ResumeSchema);
