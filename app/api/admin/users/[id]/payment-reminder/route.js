import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Plan from "@/lib/models/Plan";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendSubscriptionExpiryReminderEmail } from "@/lib/email";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

// Manual, one-click version of the "expiring soon" half of
// app/api/cron/subscription-reminders — same email + notification content,
// but admin-triggered for one user right now, ignoring the cron's own
// 3-day-window/already-sent guards since this is a deliberate override.
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const user = await User.findById(params.id).select("name email");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Latest row regardless of stored status — status is only reconciled
  // lazily on that user's own next request (see getUserPlan), so the
  // expiryDate check itself is what's authoritative.
  const subscription = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!subscription || subscription.expiryDate <= new Date()) {
    return NextResponse.json({ error: "This user has no active subscription to remind about" }, { status: 400 });
  }
  const plan = await Plan.findById(subscription.planId).select("name");
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  await sendSubscriptionExpiryReminderEmail({
    to: user.email,
    name: user.name,
    planName: plan.name,
    expiryDate: subscription.expiryDate,
  });
  await Notification.create({
    userId: user._id,
    title: `Your ${plan.name} plan is expiring soon`,
    message: `Your subscription expires on ${formatDate(subscription.expiryDate)}. Renew to keep uninterrupted access.`,
    sentBy: session.user.id,
  });
  subscription.expiryReminderSentAt = new Date();
  await subscription.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "user.paymentReminder",
    targetType: "User",
    targetId: user._id,
    newValue: { expiryDate: subscription.expiryDate },
  });

  return NextResponse.json({ ok: true });
}
