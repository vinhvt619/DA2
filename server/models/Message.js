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

export default mongoose.model("Message", MessageSchema);
