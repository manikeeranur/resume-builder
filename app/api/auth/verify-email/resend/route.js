import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp";
import { sendSignupOtpEmail } from "@/lib/email";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  try {
    const otp = await issueOtp({ email, purpose: "signup" });
    sendSignupOtpEmail({ to: email, name: user.name, otp, ttlMinutes: OTP_TTL_MINUTES }).catch(() => {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.code === "COOLDOWN" ? 429 : 500 });
  }

  return NextResponse.json({ success: true });
}
