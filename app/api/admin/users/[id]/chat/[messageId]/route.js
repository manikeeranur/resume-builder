import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/requireAdmin";

// Any admin can delete any admin-sent message in a thread — mirrors the
// "any admin can reply" shared-inbox model on ChatMessage. User-sent
// messages are never deletable here, so the support record the user sees
// on their side can't be erased by an admin.
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const deleted = await ChatMessage.findOneAndDelete({
    _id: params.messageId,
    userId: params.id,
    senderRole: "admin",
  });
  if (!deleted) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
