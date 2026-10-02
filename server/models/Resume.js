import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({ networkName: String, username: String, link: String });
const ExperienceSchema = new mongoose.Schema({ title: String, company: String, location: String, startDate: String, endDate: String, description: String });
const EducationSchema = new mongoose.Schema({ title: String, major: String, company: String, location: String, startDate: String, endDate: String, score: String, description: String });
const SkillSchema = new mongoose.Schema({ title: String });
const LanguageSchema = new mongoose.Schema({ title: String, description: String });
const CertificateSchema = new mongoose.Schema({ title: String, date: String, publisher: String, description: String });
const ProjectSchema = new mongoose.Schema({ title: String, company: String, location: String, startDate: String, endDate: String, date: String, link: String, description: String });
const AwardSchema = new mongoose.Schema({ title: String, awarder: String, date: String, description: String });
const HobbySchema = new mongoose.Schema({ title: String });

const CustomEntrySchema = new mongoose.Schema({
  id: String, title: String, organization: String, location: String,
  startDate: String, endDate: String, link: String, description: String,
  details: [new mongoose.Schema({ id: String, label: String, value: String }, { _id: false })],
}, { _id: false });
const CustomSectionSchema = new mongoose.Schema({
  id: String, title: String,
  content: String, // Read legacy CVs; the save path migrates this block to an entry.
  fields: { organization: Boolean, location: Boolean, dates: Boolean, link: Boolean, description: Boolean },
  items: { type: [CustomEntrySchema], default: undefined },
}, { _id: false });
const LayoutZonesSchema = new mongoose.Schema({
  main: [{ type: String }],
  sidebar: [{ type: String }],
}, { _id: false });

const ResumeLayoutSchema = new mongoose.Schema({
  version: { type: Number, default: 1 },
  customizedTemplates: [{ type: String }],
  byTemplate: {
    classic: { type: LayoutZonesSchema, default: undefined },
    modern: { type: LayoutZonesSchema, default: undefined },
    professional: { type: LayoutZonesSchema, default: undefined },
    elegant: { type: LayoutZonesSchema, default: undefined },
    creative: { type: LayoutZonesSchema, default: undefined },
    compact: { type: LayoutZonesSchema, default: undefined },
  },
}, { _id: false });

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
  customSections: [CustomSectionSchema],
  layout: { type: ResumeLayoutSchema, default: () => ({ version: 1 }) },
  selectedTemplate: {
    type: String,
    enum: ["classic", "modern", "professional", "elegant", "creative", "compact"],
    default: "modern",
  },
}, { timestamps: true });

export default mongoose.model('Resume', ResumeSchema);
