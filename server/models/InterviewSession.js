import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  startKey: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revision: { type: Number, default: 0 },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
  operationIds: { type: [String], default: [] },
  grading: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

schema.index({ userId: 1, startKey: 1 }, { unique: true });
schema.index({ userId: 1, createdAt: -1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("InterviewSession", schema);
