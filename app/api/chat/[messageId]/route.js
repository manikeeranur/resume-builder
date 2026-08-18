import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";

// A user can only delete their own outgoing messages in their own thread —
// mirrors app/api/admin/users/[id]/chat/[messageId]'s "only your own
// senderRole" restriction, so admin replies stay part of the support
// record the user can't erase.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const deleted = await ChatMessage.findOneAndDelete({
    _id: params.messageId,
    userId: session.user.id,
    senderRole: "user",
  });
  if (!deleted) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
