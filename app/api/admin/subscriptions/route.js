import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/requireAdmin";
// Registers the Plan schema with Mongoose — required by populate("planId")
// below even though Plan isn't referenced directly. See the same note in
// app/api/admin/users/route.js.
import "@/lib/models/Plan";

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

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .populate("planId", "name code billingType"),
    Subscription.countDocuments(filter),
  ]);

  return NextResponse.json({ subscriptions, total, page, limit });
}
