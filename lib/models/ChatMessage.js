import mongoose from "mongoose";

// One thread per non-admin user — any admin can view/reply (support-inbox
// style), so there's no separate conversationId; userId alone identifies
// the thread, same as Notification.
const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Not required at the schema level — a message can be attachment-only.
    // The API routes enforce "at least one of body/attachmentUrl" instead.
    body: { type: String, trim: true, default: "" },
    attachmentUrl: { type: String, default: null },
    attachmentType: { type: String, enum: ["image", "pdf", "file", null], default: null },
    attachmentName: { type: String, default: null },
    // Has the *other* party (the message's recipient) seen it.
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
