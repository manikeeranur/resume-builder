// Bootstraps the first admin — there's no in-app way to grant the very
// first admin role, since /admin/* itself requires an existing admin.
//   node --env-file=.env scripts/promoteAdmin.mjs someone@example.com
import mongoose from "mongoose";
import User from "../lib/models/User.js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Usage: node --env-file=.env scripts/promoteAdmin.mjs <email>");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set — run with: node --env-file=.env scripts/promoteAdmin.mjs <email>");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: "admin" } },
    { new: true }
  );
  if (!user) {
    throw new Error(`No user found with email ${email}`);
  }
  console.log(`${user.email} is now an admin.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
