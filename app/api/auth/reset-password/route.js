import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { verifyOtp } from "@/lib/otp";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  const otp = (body.otp || "").trim();
  const newPassword = body.newPassword || "";
  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: "Email, code and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email });
  // Same generic-not-found framing as forgot-password — this endpoint only
  // matters to someone who already has a real code in their inbox, so
  // there's nothing to gain from a more specific message here either.
  if (!user || user.provider !== "credentials") {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  try {
    await verifyOtp({ email, purpose: "password-reset", code: otp });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ success: true });
}
