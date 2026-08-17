import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";

// One Notification document per user (see the model comment) — inserted in
// bulk so the unread-count/list queries the bell polls stay a plain
// per-user find, same as an individual send.
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message } = await req.json().catch(() => ({}));
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }
  if (title.length > 200) return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  await dbConnect();
  const users = await User.find({}, "_id");
  if (!users.length) return NextResponse.json({ error: "No users to notify" }, { status: 400 });

  await Notification.insertMany(
    users.map((u) => ({
      userId: u._id,
      title: title.trim(),
      message: message.trim(),
      sentBy: session.user.id,
      broadcast: true,
    }))
  );

  // A broadcast has no single natural targetId the way an individual send
  // does — AdminAuditLog.targetId is required, so this logs against the
  // sending admin's own id, with the real detail (recipient count) in
  // newValue instead.
  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "notifications.broadcast",
    targetType: "Broadcast",
    targetId: session.user.id,
    newValue: { title, message, recipientCount: users.length },
  });

  return NextResponse.json({ ok: true, recipientCount: users.length });
}
