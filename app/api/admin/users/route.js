import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Resume from "@/lib/models/Resume";
import Subscription from "@/lib/models/Subscription";
import PdfDownloadLog from "@/lib/models/PdfDownloadLog";
import { getAdminContactInfo } from "@/lib/adminAvatars";
// Not used directly — importing it registers the schema with Mongoose,
// which populate("planId") below requires. Without it, on a cold process
// (e.g. a fresh Vercel serverless invocation of this route) that never
// touched the Plan model any other way, populate throws MissingSchemaError.
import "@/lib/models/Plan";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");
  const provider = searchParams.get("provider");
  const planId = searchParams.get("planId");
  const joinedFrom = searchParams.get("joinedFrom");
  const joinedTo = searchParams.get("joinedTo");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 25);

  const filter = {};
  if (q) {
    filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  }
  if (role) filter.role = role;
  if (provider) filter.provider = provider;
  if (joinedFrom || joinedTo) {
    filter.createdAt = {};
    if (joinedFrom) filter.createdAt.$gte = new Date(joinedFrom);
    // End-of-day so the "to" date itself is included, not just up to midnight.
    if (joinedTo) filter.createdAt.$lte = new Date(`${joinedTo}T23:59:59.999Z`);
  }

  // Plan isn't a field on User — it's derived from whichever active
  // Subscription (if any) points at this user, same as the rest of this
  // route. Resolve it to a set of userIds first, same join pattern already
  // used by the "user" search filter on /api/admin/subscriptions.
  if (planId) {
    if (planId === "__free__") {
      const paidSubs = await Subscription.find({ status: "ACTIVE" }).populate("planId", "billingType");
      const paidUserIds = paidSubs.filter((s) => s.planId?.billingType !== "FREE").map((s) => s.userId);
      filter._id = { $nin: paidUserIds };
    } else {
      const matching = await Subscription.find({ status: "ACTIVE", planId }).select("userId");
      filter._id = { $in: matching.map((s) => s.userId) };
    }
  }

  const [users, total, grandTotal, adminCount] = await Promise.all([
    User.find(filter)
      .select("name email phone image provider role isBlocked emailVerified createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
    // Unfiltered — the header stat always reflects everyone registered,
    // independent of whatever search/role filter is currently applied.
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
  ]);

  const userIds = users.map((u) => u._id);

  // Batched per-page, not per-row — a resume count, download count, active
  // plan and contact info for every user on this page, in four queries
  // total instead of 4*N.
  const [resumeCounts, downloadCounts, subscriptions, contactByUser] = await Promise.all([
    Resume.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    PdfDownloadLog.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    Subscription.find({ userId: { $in: userIds }, status: "ACTIVE" }).populate("planId", "name code"),
    getAdminContactInfo(userIds),
  ]);

  const resumeCountByUser = new Map(resumeCounts.map((r) => [r._id.toString(), r.count]));
  const downloadCountByUser = new Map(downloadCounts.map((d) => [d._id.toString(), d.count]));
  const subscriptionByUser = new Map(subscriptions.map((s) => [s.userId.toString(), s]));

  const result = users.map((u) => {
    const subscription = subscriptionByUser.get(u._id.toString()) || null;
    const contact = contactByUser.get(u._id.toString()) || {};
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      // User.phone only ever gets set by a future Razorpay-checkout-prefill
      // flow (nothing currently writes to it) — the phone number a user
      // actually entered lives on their Profile or, more often, their
      // resume(s) — see getAdminContactInfo.
      phone: contact.phone || u.phone || null,
      // The app-wide precedence (see app/(app)/layout.jsx) is the user's own
      // uploaded profile photo first, falling back to their OAuth avatar.
      photo: contact.photo || u.image || null,
      provider: u.provider,
      role: u.role,
      isBlocked: u.isBlocked,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      resumeCount: resumeCountByUser.get(u._id.toString()) || 0,
      downloadCount: downloadCountByUser.get(u._id.toString()) || 0,
      plan: subscription?.planId || null,
      subscriptionId: subscription?._id || null,
    };
  });

  return NextResponse.json({ users: result, total, grandTotal, adminCount, page, limit });
}
