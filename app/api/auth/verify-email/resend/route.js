import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import PendingSignup from "@/lib/models/PendingSignup";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp";
import { sendSignupOtpEmail } from "@/lib/email";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  await dbConnect();

  const existingUser = await User.findOne({ email });
  if (existingUser?.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  // See the matching lookup in ../route.js — normally there's a
  // PendingSignup and no User yet at all; `existingUser` only comes into
  // play for an account still mid-signup from before that split existed.
  const name = existingUser?.name || (await PendingSignup.findOne({ email }))?.name;
  if (!name) {
    return NextResponse.json({ error: "No pending signup found for this email — please sign up again" }, { status: 404 });
  }

  try {
    const otp = await issueOtp({ email, purpose: "signup" });
    // Awaited — see the matching comment in app/api/signup/route.js.
    await sendSignupOtpEmail({ to: email, name, otp, ttlMinutes: OTP_TTL_MINUTES }).catch(() => {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.code === "COOLDOWN" ? 429 : 500 });
  }

  return NextResponse.json({ success: true });
}
