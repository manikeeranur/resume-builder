import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Plan from "@/lib/models/Plan";
import Subscription from "@/lib/models/Subscription";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendResubscribeReminderEmail } from "@/lib/email";

// Manual, one-click "send to everyone currently lapsed" — unlike the cron,
// not scoped to the 14-day resend interval, since an admin choosing to do
// this right now is a deliberate broadcast.
export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const now = new Date();

  const latest = await Subscription.aggregate([
    { $sort: { userId: 1, createdAt: -1 } },
    { $group: { _id: "$userId", latest: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$latest" } },
    { $match: { expiryDate: { $lt: now } } },
  ]);

  let sent = 0;
  for (const sub of latest) {
    const [user, plan] = await Promise.all([
      User.findById(sub.userId).select("name email"),
      Plan.findById(sub.planId).select("name"),
    ]);
    if (!user || !plan) continue;

    await sendResubscribeReminderEmail({ to: user.email, name: user.name, planName: plan.name });
    await Notification.create({
      userId: user._id,
      title: "Come back to premium",
      message: `Your ${plan.name} plan has lapsed. Resubscribe anytime to unlock premium templates and unlimited downloads again.`,
      sentBy: session.user.id,
    });
    await Subscription.updateOne({ _id: sub._id }, { $set: { resubscribeReminderSentAt: now } });
    sent++;
  }

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "notifications.resubscribeReminderBroadcast",
    targetType: "Broadcast",
    targetId: session.user.id,
    newValue: { recipientCount: sent },
  });

  return NextResponse.json({ ok: true, recipientCount: sent });
}
