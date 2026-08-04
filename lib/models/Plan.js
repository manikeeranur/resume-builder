import mongoose from "mongoose";

// The single source of truth for pricing, limits and feature access — every
// server route re-reads this instead of trusting anything the client sends,
// so an admin edit here takes effect everywhere immediately.
const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Stable identifier used in code (seed script, feature checks); never
    // shown to users. "id" would collide with Mongo's own _id, hence code.
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: "" },
    // Rupees, not paise — converted to paise only when creating a Razorpay order.
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    billingType: { type: String, enum: ["FREE", "MONTHLY", "YEARLY"], required: true },
    durationDays: { type: Number, required: true },
    // null = unlimited.
    resumeLimit: { type: Number, default: null },
    pdfDownloadLimit: { type: Number, default: null },
    premiumTemplateAccess: { type: Boolean, default: false },
    watermarkEnabled: { type: Boolean, default: true },
    customColors: { type: Boolean, default: false },
    customFonts: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Plan || mongoose.model("Plan", planSchema);
