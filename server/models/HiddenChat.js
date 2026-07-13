import mongoose from 'mongoose';

const HiddenChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: String, required: true },
  hiddenAt: { type: Date, default: Date.now }
}, { timestamps: true });

HiddenChatSchema.index({ userId: 1, room: 1 }, { unique: true });

export default mongoose.model('HiddenChat', HiddenChatSchema);
