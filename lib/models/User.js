import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Absent for Google-only accounts.
    passwordHash: { type: String, default: null },
    image: { type: String, default: null },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    // Used to prefill Razorpay Checkout; not collected at signup.
    phone: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    // Credentials signups start false and must verify via the OTP email
    // sent at signup (see app/api/signup and app/api/auth/verify-email)
    // before authorize() will let them log in. Google accounts are set true
    // immediately — Google has already confirmed ownership of that inbox,
    // so a second verification would just be redundant friction.
    emailVerified: { type: Boolean, default: false },
    // Bumped on every /api/notifications poll (see that route) — the
    // notification bell's own polling doubles as an online-presence
    // heartbeat, so there's no separate heartbeat endpoint. Admin's "online"
    // green dot (components/admin/AdminUsersTable.jsx) treats anyone active
    // within the last couple of minutes as online.
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
