import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"],
      default: "PENDING",
    },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

// A user's most recent subscription is looked up constantly (every access
// check); this keeps that a cheap index scan.
subscriptionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
