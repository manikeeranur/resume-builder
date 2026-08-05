import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Resume from "@/lib/models/Resume";
import Subscription from "@/lib/models/Subscription";
import Profile from "@/lib/models/Profile";
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
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 25);

  const filter = {};
  if (q) {
    filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  }
  if (role) filter.role = role;

  const [users, total, grandTotal, adminCount] = await Promise.all([
    User.find(filter)
      .select("name email phone image provider role createdAt")
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

  // Batched per-page, not per-row — a resume count, active plan and
  // profile photo for every user on this page, in three queries total
  // instead of 3*N.
  const [resumeCounts, subscriptions, profiles] = await Promise.all([
    Resume.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    Subscription.find({ userId: { $in: userIds }, status: "ACTIVE" }).populate("planId", "name code"),
    Profile.find({ userId: { $in: userIds } }).select("userId sections.personalInfo.photo sections.personalInfo.phone"),
  ]);

  const resumeCountByUser = new Map(resumeCounts.map((r) => [r._id.toString(), r.count]));
  const planByUser = new Map(subscriptions.map((s) => [s.userId.toString(), s.planId]));
  const photoByUser = new Map(profiles.map((p) => [p.userId.toString(), p.sections?.personalInfo?.photo || null]));
  const profilePhoneByUser = new Map(profiles.map((p) => [p.userId.toString(), p.sections?.personalInfo?.phone || null]));

  const result = users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    // User.phone only ever gets set by a future Razorpay-checkout-prefill
    // flow (nothing currently writes to it) — the phone number a user
    // actually enters lives on their Profile (used for their resume's
    // contact info), so that's the one worth showing here.
    phone: profilePhoneByUser.get(u._id.toString()) || u.phone || null,
    // The app-wide precedence (see app/(app)/layout.jsx) is the user's own
    // uploaded profile photo first, falling back to their OAuth avatar.
    photo: photoByUser.get(u._id.toString()) || u.image || null,
    provider: u.provider,
    role: u.role,
    createdAt: u.createdAt,
    resumeCount: resumeCountByUser.get(u._id.toString()) || 0,
    plan: planByUser.get(u._id.toString()) || null,
  }));

  return NextResponse.json({ users: result, total, grandTotal, adminCount, page, limit });
}
