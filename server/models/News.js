import mongoose from 'mongoose';
const sectionSchema = new mongoose.Schema({ heading: String, paragraphs: [String], bullets: [String] }, { _id: false });
const newsSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, title: String, summary: String, category: String, intro: String,
  content: { type: String, default: '' }, sections: [sectionSchema], status: { type: String, enum: ['Draft', 'Published', 'Deleted'], default: 'Draft' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, publishedAt: Date,
}, { timestamps: true });
export default mongoose.model('News', newsSchema);
