import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import PendingSignup from "@/lib/models/PendingSignup";
import { verifyOtp } from "@/lib/otp";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  const otp = (body.otp || "").trim();
  if (!email || !otp) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  await dbConnect();

  const existingUser = await User.findOne({ email });
  if (existingUser?.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  // Normally there's no User yet at all — see lib/models/PendingSignup —
  // but `existingUser` (unverified) is also handled here for any account
  // that was already mid-signup under the old flow, before this file
  // started sourcing new accounts from PendingSignup instead.
  const pending = existingUser ? null : await PendingSignup.findOne({ email });
  if (!existingUser && !pending) {
    return NextResponse.json({ error: "No pending signup found for this email — please sign up again" }, { status: 404 });
  }

  try {
    await verifyOtp({ email, purpose: "signup", code: otp });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // The account becomes real right here — this is the only place a
  // credentials signup ever turns into an actual User document.
  let user = existingUser;
  if (user) {
    user.emailVerified = true;
    await user.save();
  } else {
    user = await User.create({
      name: pending.name,
      email,
      passwordHash: pending.passwordHash,
      provider: "credentials",
      emailVerified: true,
    });
    await PendingSignup.deleteOne({ _id: pending._id });
  }

  // The account is actually ready to use now — this is where "Welcome"
  // belongs, not at raw signup (see app/api/signup). Awaited — see the
  // matching comment in app/api/signup/route.js for why (serverless can
  // freeze the function right after the response returns).
  await sendWelcomeEmail({ to: email, name: user.name }).catch(() => {});

  return NextResponse.json({ success: true });
}
