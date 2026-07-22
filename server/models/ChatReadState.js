import mongoose from "mongoose";

const ChatReadStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

ChatReadStateSchema.index({ userId: 1, room: 1 }, { unique: true });

export default mongoose.model("ChatReadState", ChatReadStateSchema);
