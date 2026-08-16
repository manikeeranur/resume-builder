import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import Plan from "@/lib/models/Plan";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { getAdminContactInfo } from "@/lib/adminAvatars";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userQuery = searchParams.get("user")?.trim();
  const planId = searchParams.get("planId");
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 25);

  const filter = {};
  if (userQuery) {
    const users = await User.find({
      $or: [{ name: new RegExp(userQuery, "i") }, { email: new RegExp(userQuery, "i") }],
    }).select("_id");
    filter.userId = { $in: users.map((u) => u._id) };
  }
  if (planId) filter.planId = planId;
  if (status) filter.status = status;

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // counts/expiringSoon are global (unfiltered) — an at-a-glance summary of
  // the whole table, same idea as AdminUsersTable's grandTotal/adminCount,
  // shown alongside `total` (which respects the current filters and drives
  // pagination below).
  const [subscriptions, total, active, expiringSoon, cancelled, grandTotal] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email image")
      .populate("planId", "name code billingType"),
    Subscription.countDocuments(filter),
    Subscription.countDocuments({ status: "ACTIVE" }),
    Subscription.countDocuments({ status: "ACTIVE", expiryDate: { $gte: now, $lte: sevenDaysOut } }),
    Subscription.countDocuments({ status: "CANCELLED" }),
    Subscription.countDocuments(),
  ]);

  // Same precedence as /api/admin/users and the app-wide layout: a user's
  // own uploaded profile photo (their actual resume photo) first, OAuth
  // avatar only as a fallback — not just the OAuth image, so this matches
  // exactly what the user actually looks like elsewhere in the product. See
  // getAdminContactInfo for why a Resume fallback sits in between.
  const userIds = subscriptions.map((s) => s.userId?._id).filter(Boolean);
  const contactByUser = await getAdminContactInfo(userIds);

  const withPhotos = subscriptions.map((s) => {
    const obj = s.toObject();
    if (obj.userId) {
      obj.userId.photo = contactByUser.get(obj.userId._id.toString())?.photo || obj.userId.image || null;
    }
    return obj;
  });

  return NextResponse.json({
    subscriptions: withPhotos,
    total,
    page,
    limit,
    counts: { grandTotal, active, expiringSoon, cancelled },
  });
}

// Assigns a plan to a user who has no Subscription document at all — i.e.
// anyone currently on the Free plan (getUserPlan falls back to Free when no
// active subscription exists, so there's normally never a row to update via
// the PATCH changePlan action on /[id]). This is the admin-side equivalent
// of that user completing a purchase.
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!body.userId || !body.planId) {
    return NextResponse.json({ error: "userId and planId are required" }, { status: 400 });
  }

  await dbConnect();
  const [user, plan] = await Promise.all([User.findById(body.userId), Plan.findById(body.planId)]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const existing = await Subscription.findOne({ userId: user._id, status: "ACTIVE" });
  if (existing) {
    return NextResponse.json(
      { error: "This user already has an active subscription — use changePlan on it instead" },
      { status: 400 }
    );
  }

  const startDate = new Date();
  const durationDays = plan.durationDays || 365 * 100;
  const subscription = await Subscription.create({
    userId: user._id,
    planId: plan._id,
    status: "ACTIVE",
    startDate,
    expiryDate: new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000),
    autoRenew: false,
  });

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "subscription.create",
    targetType: "Subscription",
    targetId: subscription._id,
    previousValue: null,
    newValue: { userId: user._id.toString(), planId: plan._id.toString(), status: subscription.status },
  });

  const populated = await subscription.populate("planId", "name code billingType price currency");
  return NextResponse.json(populated, { status: 201 });
}
