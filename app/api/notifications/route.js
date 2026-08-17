import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";

// Polled by components/layout/NotificationBell.jsx every 30s while any
// authenticated page is open. That poll doubles as this user's
// online-presence heartbeat (see the lastActiveAt comment on the User
// model) — no separate heartbeat endpoint.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = session.user.id;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(20),
    Notification.countDocuments({ userId, read: false }),
    User.updateOne({ _id: userId }, { $set: { lastActiveAt: new Date() } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// Bulk "mark all read" — marking a single notification lives at
// /api/notifications/[id] (ownership-scoped there too).
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "markAllRead") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await dbConnect();
  await Notification.updateMany({ userId: session.user.id, read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
