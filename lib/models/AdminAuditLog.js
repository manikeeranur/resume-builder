import mongoose from "mongoose";

// Every admin mutation (extend/cancel/reactivate a subscription, edit a
// plan, initiate a refund) writes one row here — who did it, what changed,
// and when — so admin actions stay traceable without bolting ad-hoc history
// fields onto Subscription/Plan themselves.
const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);
