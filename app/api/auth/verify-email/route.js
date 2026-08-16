import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
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
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  try {
    await verifyOtp({ email, purpose: "signup", code: otp });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  user.emailVerified = true;
  await user.save();

  // The account is actually ready to use now — this is where "Welcome"
  // belongs, not at raw signup (see app/api/signup).
  sendWelcomeEmail({ to: email, name: user.name }).catch(() => {});

  return NextResponse.json({ success: true });
}
