import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Plan from "@/lib/models/Plan";
import Subscription from "@/lib/models/Subscription";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendSubscriptionExpiryReminderEmail } from "@/lib/email";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

// Manual, one-click "send to everyone currently on a valid paid plan" —
// unlike the cron, not scoped to the 3-day-to-expiry window, since an admin
// choosing to do this right now is a deliberate broadcast, not a scheduled
// nudge for one specific date.
export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const now = new Date();

  const latest = await Subscription.aggregate([
    { $sort: { userId: 1, createdAt: -1 } },
    { $group: { _id: "$userId", latest: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$latest" } },
    { $match: { expiryDate: { $gt: now } } },
  ]);

  let sent = 0;
  for (const sub of latest) {
    const [user, plan] = await Promise.all([
      User.findById(sub.userId).select("name email"),
      Plan.findById(sub.planId).select("name"),
    ]);
    if (!user || !plan) continue;

    await sendSubscriptionExpiryReminderEmail({
      to: user.email,
      name: user.name,
      planName: plan.name,
      expiryDate: sub.expiryDate,
    });
    await Notification.create({
      userId: user._id,
      title: `Your ${plan.name} plan is expiring soon`,
      message: `Your subscription expires on ${formatDate(sub.expiryDate)}. Renew to keep uninterrupted access.`,
      sentBy: session.user.id,
    });
    await Subscription.updateOne({ _id: sub._id }, { $set: { expiryReminderSentAt: now } });
    sent++;
  }

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "notifications.paymentReminderBroadcast",
    targetType: "Broadcast",
    targetId: session.user.id,
    newValue: { recipientCount: sent },
  });

  return NextResponse.json({ ok: true, recipientCount: sent });
}
