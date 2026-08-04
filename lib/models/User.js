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
