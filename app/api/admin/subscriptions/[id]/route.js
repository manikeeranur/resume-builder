import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import Payment from "@/lib/models/Payment";
import Plan from "@/lib/models/Plan";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const subscription = await Subscription.findById(params.id)
    .populate("userId", "name email")
    .populate("planId", "name code billingType price currency");
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = await Payment.find({ subscriptionId: subscription._id }).sort({ createdAt: -1 });

  return NextResponse.json({ subscription, payments });
}

const ACTIONS = new Set(["extend", "changePlan", "cancel", "reactivate"]);

// Every branch here is an admin override of state a user would otherwise
// only reach through the payment flow — each one is validated server-side
// and written to AdminAuditLog with the admin id, prior value, new value.
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await dbConnect();
  const subscription = await Subscription.findById(params.id);
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previousValue = {
    status: subscription.status,
    planId: subscription.planId.toString(),
    expiryDate: subscription.expiryDate,
  };

  if (body.action === "extend") {
    const days = Number(body.days);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "days must be a positive number" }, { status: 400 });
    }
    const base = subscription.expiryDate > new Date() ? subscription.expiryDate : new Date();
    subscription.expiryDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    subscription.status = "ACTIVE";
  } else if (body.action === "changePlan") {
    const plan = await Plan.findById(body.planId);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    subscription.planId = plan._id;
  } else if (body.action === "cancel") {
    subscription.status = "CANCELLED";
    subscription.autoRenew = false;
  } else if (body.action === "reactivate") {
    if (subscription.expiryDate <= new Date()) {
      return NextResponse.json(
        { error: "Subscription has already expired — extend it before reactivating" },
        { status: 400 }
      );
    }
    subscription.status = "ACTIVE";
  }

  await subscription.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: `subscription.${body.action}`,
    targetType: "Subscription",
    targetId: subscription._id,
    previousValue,
    newValue: {
      status: subscription.status,
      planId: subscription.planId.toString(),
      expiryDate: subscription.expiryDate,
    },
  });

  return NextResponse.json(subscription);
}
