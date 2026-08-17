import mongoose from "mongoose";

// One row per recipient, even for a broadcast (see
// app/api/admin/notifications/broadcast) — keeps unread-count/list queries
// a plain per-user find instead of needing a separate "read by" join.
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    // Admin who sent it — null is reserved for future system-generated
    // notifications, nothing writes that today (every notification is
    // currently admin-authored).
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    broadcast: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
