import mongoose from "mongoose";

// One row per outstanding OTP request — signup verification and
// password-reset both use this, distinguished by `purpose` so a code
// generated for one can never be replayed against the other. `otpHash` is a
// SHA-256 digest (see lib/otp.js), never the plaintext code, so a DB read
// alone can't be used to sign in as someone else.
const emailOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["signup", "password-reset"], required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Capped at OTP_MAX_ATTEMPTS (lib/otp.js) — past that this code is dead
    // even if it hasn't technically expired yet, and a fresh one must be
    // requested. Keeps a leaked/guessed-at code from being brute-forced.
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emailOtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
// TTL cleanup — Mongo drops the document itself once expiresAt passes, so
// stale codes don't pile up and never need a manual sweep.
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.EmailOtp || mongoose.model("EmailOtp", emailOtpSchema);
