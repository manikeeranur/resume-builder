import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import Payment from "@/lib/models/Payment";
import { createRazorpayOrder } from "@/lib/razorpay";

// Client sends only { planId }. Everything that determines what the user is
// actually charged — price, currency, whether the plan is even purchasable —
// is loaded fresh from the database here, never taken from the request body.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId } = await req.json().catch(() => ({}));
    if (!planId) return NextResponse.json({ error: "planId is required" }, { status: 400 });

    await dbConnect();
    const plan = await Plan.findById(planId).catch(() => null);
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "That plan isn't available" }, { status: 400 });
    }
    if (plan.billingType === "FREE" || plan.price <= 0) {
      return NextResponse.json({ error: "The free plan doesn't require checkout" }, { status: 400 });
    }

    const amountInPaise = Math.round(plan.price * 100);

    let order;
    try {
      order = await createRazorpayOrder({
        amountInPaise,
        currency: plan.currency,
        receipt: `plan_${plan.code}_${session.user.id}_${Date.now()}`,
        notes: { userId: session.user.id, planId: plan._id.toString() },
      });
    } catch (err) {
      // The Razorpay SDK rejects API errors with a plain
      // { statusCode, error: { description, code, ... } } object, not a
      // real Error — so err.message is always undefined for those (auth
      // failures, bad params, etc). Log the whole shape so it's actually
      // diagnosable instead of printing "undefined".
      console.error(
        "Razorpay order creation failed:",
        err?.error?.description || err?.message || JSON.stringify(err)
      );
      return NextResponse.json({ error: "Could not start checkout — please try again" }, { status: 502 });
    }

    await Payment.create({
      userId: session.user.id,
      planId: plan._id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: plan.currency,
      status: "CREATED",
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: plan.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (err) {
    console.error("Create-order error:", err);
    return NextResponse.json({ error: "Could not start checkout — please try again" }, { status: 500 });
  }
}
