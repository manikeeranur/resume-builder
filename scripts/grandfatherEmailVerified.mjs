// One-time migration for the OTP email-verification feature: marks every
// User that already existed before this feature shipped as emailVerified,
// so nobody who could already log in gets locked out by the new check in
// lib/auth.js's authorize(). Only ever needs running once per environment
// (dev DB and prod DB separately) — anyone who signs up after this has run
// goes through the real OTP flow and starts out unverified as intended.
//   node --env-file=.env scripts/grandfatherEmailVerified.mjs
import mongoose from "mongoose";
import User from "../lib/models/User.js";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set — run with: node --env-file=.env scripts/grandfatherEmailVerified.mjs");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany({ emailVerified: { $ne: true } }, { $set: { emailVerified: true } });
  console.log(`Marked ${result.modifiedCount} existing user(s) as emailVerified.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
