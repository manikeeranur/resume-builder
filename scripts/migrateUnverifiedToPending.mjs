// One-time migration for the "defer User creation until verified" change:
// any credentials User created under the old flow (unverified, sitting in
// /admin/users like a real account) is converted back into a PendingSignup
// and removed from Users — matching what would have happened had they
// signed up under the new flow. Their existing OTP (if any, and not yet
// expired) is left untouched and keeps working, since EmailOtp is keyed by
// email, not by which collection the pending account lives in.
//   node --env-file=.env scripts/migrateUnverifiedToPending.mjs
import mongoose from "mongoose";
import User from "../lib/models/User.js";
import PendingSignup from "../lib/models/PendingSignup.js";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set — run with: node --env-file=.env scripts/migrateUnverifiedToPending.mjs");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const unverified = await User.find({ provider: "credentials", emailVerified: false });
  for (const user of unverified) {
    await PendingSignup.findOneAndUpdate(
      { email: user.email },
      { name: user.name, passwordHash: user.passwordHash },
      { upsert: true }
    );
    await user.deleteOne();
    console.log(`Migrated ${user.email} back to a pending signup.`);
  }
  console.log(`Done — ${unverified.length} unverified user(s) migrated.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
