import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const userQuery = searchParams.get("user")?.trim();
  const planId = searchParams.get("planId");
  const status = searchParams.get("status");
  const refundStatus = searchParams.get("refundStatus");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 25);

  const filter = {};

  if (q) {
    const or = [{ razorpayOrderId: new RegExp(q, "i") }, { razorpayPaymentId: new RegExp(q, "i") }];
    if (mongoose.isValidObjectId(q)) or.push({ _id: q });
    filter.$or = or;
  }
  if (userQuery) {
    const users = await User.find({
      $or: [{ name: new RegExp(userQuery, "i") }, { email: new RegExp(userQuery, "i") }],
    }).select("_id");
    filter.userId = { $in: users.map((u) => u._id) };
  }
  if (planId) filter.planId = planId;
  if (status) filter.status = status;
  if (refundStatus) filter.refundStatus = refundStatus;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .populate("planId", "name code"),
    Payment.countDocuments(filter),
  ]);

  return NextResponse.json({ payments, total, page, limit });
}
