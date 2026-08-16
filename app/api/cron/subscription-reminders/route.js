import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import { sendSubscriptionExpiryReminderEmail } from "@/lib/email";
// Registers the Plan/User schemas with Mongoose — required by populate()
// below even though neither is imported directly. See the same note in
// app/api/admin/users/route.js.
import "@/lib/models/Plan";
import "@/lib/models/User";

const REMINDER_WINDOW_DAYS = 3;

// Triggered daily by Vercel Cron (see vercel.json) — finds every ACTIVE
// subscription expiring within REMINDER_WINDOW_DAYS that hasn't already
// gotten a reminder for its *current* expiryDate (expiryReminderSentAt is
// reset to null anywhere expiryDate itself moves forward — see
// extendUserSubscription and the admin "extend" action — so a renewed
// subscription gets a fresh reminder next time it's actually close to
// expiring again, instead of being silently skipped forever).
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

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
    // sendMail() swallows its own delivery errors (best-effort everywhere in
    // this app — see lib/email.js), so this always runs; a failed send just
    // means no email went out, not a reason to keep retrying it daily.
    sub.expiryReminderSentAt = now;
    await sub.save();
    sent++;
  }

  return NextResponse.json({ checked: due.length, sent });
}
