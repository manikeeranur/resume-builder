import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import Plan from "@/lib/models/Plan";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import { sendSubscriptionExpiryReminderEmail, sendResubscribeReminderEmail } from "@/lib/email";

const EXPIRY_WINDOW_DAYS = 3;
const RESUBSCRIBE_REMINDER_INTERVAL_DAYS = 14;

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

// Triggered daily by Vercel Cron (see vercel.json). Runs both reminder
// passes off the one schedule (rather than a second cron entry) since
// Vercel's lower tiers cap how many cron jobs a project gets.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();

  const expiring = await sendExpiryReminders(now);
  const resubscribe = await sendResubscribeReminders(now);

  return NextResponse.json({ expiring, resubscribe });
}

// "Payment reminder" — finds every ACTIVE subscription expiring within
// EXPIRY_WINDOW_DAYS that hasn't already gotten a reminder for its *current*
// expiryDate (expiryReminderSentAt is reset to null anywhere expiryDate
// itself moves forward — see extendUserSubscription and the admin "extend"
// action — so a renewed subscription gets a fresh reminder next time it's
// actually close to expiring again, instead of being silently skipped
// forever).
async function sendExpiryReminders(now) {
  const windowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const due = await Subscription.find({
    status: "ACTIVE",
    expiryDate: { $gte: now, $lte: windowEnd },
    expiryReminderSentAt: null,
  })
    .populate("userId", "name email")
    .populate("planId", "name");

  // Sent one at a time, not in parallel — SMTP here is a personal Gmail
  // account (see lib/email.js), and Gmail's relay is far more likely to
  // throttle a sudden burst of concurrent sends than a slow trickle.
  let sent = 0;
  for (const sub of due) {
    if (!sub.userId || !sub.planId) continue;
    await sendSubscriptionExpiryReminderEmail({
      to: sub.userId.email,
      name: sub.userId.name,
      planName: sub.planId.name,
      expiryDate: sub.expiryDate,
    });
    await Notification.create({
      userId: sub.userId._id,
      title: `Your ${sub.planId.name} plan is expiring soon`,
      message: `Your subscription expires on ${formatDate(sub.expiryDate)}. Renew to keep uninterrupted access.`,
    });
    // sendMail() swallows its own delivery errors (best-effort everywhere in
    // this app — see lib/email.js), so this always runs; a failed send just
    // means no email went out, not a reason to keep retrying it daily.
    sub.expiryReminderSentAt = now;
    await sub.save();
    sent++;
  }
  return { checked: due.length, sent };
}

// "Resubscribe reminder" — nudges users whose most recent subscription has
// already lapsed. status alone can't identify these: it's only reconciled
// lazily on that user's next request (see getUserPlan), so a user who
// never comes back stays sitting at status "ACTIVE" with a past expiryDate
// indefinitely. expiryDate < now on each user's single latest Subscription
// row is what's actually authoritative — extendUserSubscription always
// creates a fresh row on resubscribe, so "latest row is lapsed" reliably
// means "hasn't come back since."
async function sendResubscribeReminders(now) {
  const cutoff = new Date(now.getTime() - RESUBSCRIBE_REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await Subscription.aggregate([
    { $sort: { userId: 1, createdAt: -1 } },
    { $group: { _id: "$userId", latest: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$latest" } },
    {
      $match: {
        expiryDate: { $lt: now },
        $or: [{ resubscribeReminderSentAt: null }, { resubscribeReminderSentAt: { $lt: cutoff } }],
      },
    },
  ]);

  let sent = 0;
  for (const sub of candidates) {
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
    });
    await Subscription.updateOne({ _id: sub._id }, { $set: { resubscribeReminderSentAt: now } });
    sent++;
  }
  return { checked: candidates.length, sent };
}
