import mongoose from "mongoose";

const AiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: {
      type: String,
      enum: [
        "resume_fill",
        "resume_review",
        "interview_practice",
        "interview_session_grade",
        "interview_session_questions",
        "cover_letter",
        "job_description",
      ],
      required: true,
      index: true,
    },
    provider: { type: String, default: "groq" },
    model: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    inputHash: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    errorCode: { type: String, default: "" },
  },
  { timestamps: true },
);

AiUsageSchema.index({ userId: 1, createdAt: -1 });
AiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("AiUsage", AiUsageSchema);
