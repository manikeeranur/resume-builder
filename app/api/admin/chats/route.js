import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import ChatMessage from "@/lib/models/ChatMessage";
import { requireAdmin } from "@/lib/requireAdmin";
import { getAdminContactInfo } from "@/lib/adminAvatars";

// Matches the same threshold used in /api/admin/users for the users-table
// green dot, so "online" means the same thing everywhere in the admin panel.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

// One row per user who has ever sent/received a chat message, latest
// activity first — the inbox list for app/admin/(protected)/chats.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();

  const threads = await ChatMessage.aggregate([
    { $sort: { userId: 1, createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        lastMessage: { $first: "$body" },
        lastSenderRole: { $first: "$senderRole" },
        lastAt: { $first: "$createdAt" },
      },
    },
    { $sort: { lastAt: -1 } },
  ]);

  const userIds = threads.map((t) => t._id);
  const [users, unreadCounts, contactByUser, subscriptions] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("name email image lastActiveAt"),
    ChatMessage.aggregate([
      { $match: { userId: { $in: userIds }, senderRole: "user", read: false } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    // Same precedence as /api/admin/users: an uploaded Profile/Resume photo
    // first, User.image (only ever set for Google sign-ins) as fallback —
    // most users never touch /profile, so User.image alone left this blank
    // for anyone who signed up with email/password.
    getAdminContactInfo(userIds),
    // Same "an ACTIVE Subscription row exists" signal /api/admin/users uses
    // for its own crown badge — only ever created for a real paid plan.
    Subscription.find({ userId: { $in: userIds }, status: "ACTIVE" }).select("userId"),
  ]);

  const userById = new Map(users.map((u) => [u._id.toString(), u]));
  const unreadByUser = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));
  const premiumUserIds = new Set(subscriptions.map((s) => s.userId.toString()));

  const result = threads
    .map((t) => {
      const user = userById.get(t._id.toString());
      if (!user) return null;
      const contact = contactByUser.get(t._id.toString()) || {};
      return {
        userId: t._id,
        name: user.name,
        email: user.email,
        photo: contact.photo || user.image || null,
        online: Boolean(user.lastActiveAt) && Date.now() - new Date(user.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS,
        isPremium: premiumUserIds.has(t._id.toString()),
        lastMessage: t.lastMessage,
        lastSenderRole: t.lastSenderRole,
        lastAt: t.lastAt,
        unreadCount: unreadByUser.get(t._id.toString()) || 0,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ threads: result });
}
