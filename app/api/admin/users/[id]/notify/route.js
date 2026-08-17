import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";

// Mirrors app/api/admin/users/[id]/email — same guard/validate/audit-log
// shape, but writes an in-app Notification instead of sending an email.
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message } = await req.json().catch(() => ({}));
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }
  if (title.length > 200) return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  await dbConnect();
  const user = await User.findById(params.id).select("name");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notification = await Notification.create({
    userId: user._id,
    title: title.trim(),
    message: message.trim(),
    sentBy: session.user.id,
  });

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "user.notify",
    targetType: "User",
    targetId: user._id,
    newValue: { title, message },
  });

  return NextResponse.json({ ok: true, notificationId: notification._id });
}
