import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { sendAdminCustomEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/requireAdmin";

const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;

// Lets an admin send a one-off, freeform email to a single user — account
// notices, a heads-up before blocking them, anything that doesn't fit one
// of the fixed templates in lib/email.js. Logged to AdminAuditLog (with the
// content itself, not just that a send happened) same as every other admin
// mutation, so there's a record of what a user was actually told.
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const subject = (body.subject || "").trim();
  const message = (body.message || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer` }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(params.id).select("name email");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await sendAdminCustomEmail({ to: user.email, name: user.name, subject, message });

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "user.email",
    targetType: "User",
    targetId: user._id,
    previousValue: null,
    newValue: { subject, message },
  });

  return NextResponse.json({ success: true });
}
