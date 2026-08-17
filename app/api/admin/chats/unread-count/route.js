import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/requireAdmin";

// Lightweight — polled from AdminSidebar on every admin page (not just
// /admin/chats) for the nav badge, so this deliberately doesn't do the
// full per-conversation aggregation /api/admin/chats does.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const unreadCount = await ChatMessage.countDocuments({ senderRole: "user", read: false });
  return NextResponse.json({ unreadCount });
}
