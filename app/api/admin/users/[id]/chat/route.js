import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/requireAdmin";
import { sanitizeChatHtml, chatHtmlToPlainText } from "@/lib/sanitizeChatHtml";

const MESSAGE_MAX_LENGTH = 4000;

// Any admin can view/reply to a given user's thread — see the model
// comment on ChatMessage.
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const messages = await ChatMessage.find({ userId: params.id }).sort({ createdAt: 1 }).limit(200);
  return NextResponse.json({ messages });
}

export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { message, attachmentUrl, attachmentType, attachmentName } = await req.json().catch(() => ({}));
  // `message` is HTML from the admin's TipTap editor (bold/italic/strike/
  // code marks only) — sanitize before anything else touches it.
  const html = sanitizeChatHtml(message || "");
  const plainText = chatHtmlToPlainText(html);
  if (!plainText && !attachmentUrl) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (plainText.length > MESSAGE_MAX_LENGTH) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  await dbConnect();
  const user = await User.findById(params.id).select("_id");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const created = await ChatMessage.create({
    userId: user._id,
    senderRole: "admin",
    senderId: session.user.id,
    body: plainText ? html : "",
    attachmentUrl: attachmentUrl || null,
    attachmentType: attachmentType || null,
    attachmentName: attachmentName || null,
  });

  return NextResponse.json({ message: created });
}

// Marks every user-sent message in this thread as read — called when an
// admin opens the chat panel for this user.
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  await ChatMessage.updateMany({ userId: params.id, senderRole: "user", read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
