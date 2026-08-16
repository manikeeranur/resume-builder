import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { issueOtp, OTP_TTL_MINUTES } from "@/lib/otp";
import { sendPasswordResetOtpEmail } from "@/lib/email";

// Always responds with the same generic message, whether or not the email
// belongs to an account — the alternative (a distinct "no account found")
// lets anyone enumerate which emails are registered by trying this
// endpoint. A cooldown hit (see lib/otp) is swallowed the same way for the
// same reason: surfacing it would confirm a code was already issued, which
// only happens for a real account.
const GENERIC_MESSAGE = "If an account exists for this email, a reset code has been sent.";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ email });
  // Google-only accounts have no password to reset — sending them a reset
  // code would be actively misleading, not just unnecessary.
  if (user && user.provider === "credentials" && !user.isBlocked) {
    try {
      const otp = await issueOtp({ email, purpose: "password-reset" });
      sendPasswordResetOtpEmail({ to: email, name: user.name, otp, ttlMinutes: OTP_TTL_MINUTES }).catch(() => {});
    } catch {
      // COOLDOWN or any other issuance failure — still respond generically.
    }
  }

  return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
}
