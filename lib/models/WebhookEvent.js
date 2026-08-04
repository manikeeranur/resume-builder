import mongoose from "mongoose";

// One row per Razorpay webhook delivery. The unique index on
// razorpayEventId is what makes webhook handling idempotent — a duplicate
// delivery (Razorpay retries on any non-2xx, and can also just double-send)
// fails the insert and is treated as already-processed instead of re-running
// the payment/subscription update.
const webhookEventSchema = new mongoose.Schema(
  {
    razorpayEventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
