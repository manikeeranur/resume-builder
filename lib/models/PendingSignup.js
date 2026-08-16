import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Holds a credentials signup's data in limbo until the code emailed at
// signup (see app/api/signup) is confirmed — no User document is created
// until then, so an email/password nobody ever finishes verifying never
// shows up as a real account in /admin/users. Deliberately separate from
// EmailOtp (which just proves "this inbox got the code") since this also
// carries the name/passwordHash a real User needs once that's confirmed.
//
// TTL-expires an hour after the last signup/resend attempt for that email —
// an abandoned signup doesn't linger in this collection forever, and the
// same email is free to sign up again once it's gone (or immediately, via
// the upsert in the signup route itself).
const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

pendingSignupSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

pendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.models.PendingSignup || mongoose.model("PendingSignup", pendingSignupSchema);
