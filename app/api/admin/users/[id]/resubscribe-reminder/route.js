import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Plan from "@/lib/models/Plan";
import Notification from "@/lib/models/Notification";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendResubscribeReminderEmail } from "@/lib/email";

// Manual, one-click version of the "resubscribe" half of
// app/api/cron/subscription-reminders — admin-triggered for one user right
// now, ignoring the cron's own 14-day-interval guard.
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const user = await User.findById(params.id).select("name email");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const subscription = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!subscription || subscription.expiryDate > new Date()) {
    return NextResponse.json({ error: "This user doesn't have a lapsed subscription" }, { status: 400 });
  }
  const plan = await Plan.findById(subscription.planId).select("name");
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  await sendResubscribeReminderEmail({ to: user.email, name: user.name, planName: plan.name });
  await Notification.create({
    userId: user._id,
    title: "Come back to premium",
    message: `Your ${plan.name} plan has lapsed. Resubscribe anytime to unlock premium templates and unlimited downloads again.`,
    sentBy: session.user.id,
  });
  subscription.resubscribeReminderSentAt = new Date();
  await subscription.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "user.resubscribeReminder",
    targetType: "User",
    targetId: user._id,
    newValue: { expiryDate: subscription.expiryDate },
  });

  return NextResponse.json({ ok: true });
}
