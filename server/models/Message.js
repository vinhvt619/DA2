import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    room: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true },
);

// Chat history and thread summaries both read messages by room and time.
// Keeping this compound index also lets MongoDB satisfy the latest-message
// sort without scanning and sorting the whole messages collection.
MessageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model("Message", MessageSchema);
