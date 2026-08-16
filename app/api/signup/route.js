import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await dbConnect();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await User.hashPassword(password);
    await User.create({ name, email: email.toLowerCase(), passwordHash, provider: "credentials" });

    // Best-effort, same as every other email in the app — a delivery
    // failure must never fail the signup response itself.
    sendWelcomeEmail({ to: email.toLowerCase(), name }).catch(() => {});

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Signup failed" }, { status: 500 });
  }
}
