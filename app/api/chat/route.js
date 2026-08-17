import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";

const MESSAGE_MAX_LENGTH = 4000;
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;

// The logged-in user's own thread with admin support — see the model
// comment on ChatMessage for why there's no separate conversationId.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const userId = session.user.id;
  // Rolling 24h window on the *user's* side only — nothing is deleted, so
  // the admin's view (app/api/admin/users/[id]/chat, no such filter) keeps
  // full history for support/audit purposes. Scoping unreadCount to the
  // same window too, since a badge for a message the user can no longer
  // see in their own list would be confusing.
  const since = new Date(Date.now() - HISTORY_WINDOW_MS);

  const [messages, unreadCount] = await Promise.all([
    ChatMessage.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: 1 }).limit(200),
    ChatMessage.countDocuments({ userId, senderRole: "admin", read: false, createdAt: { $gte: since } }),
  ]);

  return NextResponse.json({ messages, unreadCount });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, attachmentUrl, attachmentType, attachmentName } = await req.json().catch(() => ({}));
  const text = message?.trim() || "";
  if (!text && !attachmentUrl) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (text.length > MESSAGE_MAX_LENGTH) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  await dbConnect();
  const created = await ChatMessage.create({
    userId: session.user.id,
    senderRole: "user",
    senderId: session.user.id,
    body: text,
    attachmentUrl: attachmentUrl || null,
    attachmentType: attachmentType || null,
    attachmentName: attachmentName || null,
  });

  return NextResponse.json({ message: created });
}

// Marks every admin-sent message in this user's own thread as read —
// called when the chat widget is opened.
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  await ChatMessage.updateMany(
    { userId: session.user.id, senderRole: "admin", read: false },
    { $set: { read: true } }
  );
  return NextResponse.json({ ok: true });
}
