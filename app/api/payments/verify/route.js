import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import Plan from "@/lib/models/Plan";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import { verifyPaymentSignature, fetchRazorpayPayment } from "@/lib/razorpay";
import { extendUserSubscription } from "@/lib/subscription/extend-subscription";
import { sendPaymentSuccessEmail, sendSubscriptionActivatedEmail } from "@/lib/email";

// The browser callback alone never activates a subscription — this route
// re-verifies the HMAC signature server-side and is the only path (besides
// the webhook) that flips a Payment to SUCCESS.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    await dbConnect();
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "This order doesn't belong to your account" }, { status: 403 });
    }

    // Idempotent — a duplicate verify call (retry, double-click) for an
    // already-confirmed payment just re-returns the same success summary
    // instead of re-running the signature check and subscription extension.
    if (payment.status === "SUCCESS") {
      return NextResponse.json(await buildSuccessResponse(payment));
    }

    const validSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!validSignature) {
      payment.status = "FAILED";
      payment.failureReason = "Signature verification failed";
      await payment.save();
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const plan = await Plan.findById(payment.planId);
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "This plan is no longer available" }, { status: 400 });
    }

    let paymentMethod = null;
    try {
      const rzpPayment = await fetchRazorpayPayment(razorpay_payment_id);
      paymentMethod = rzpPayment?.method || null;
    } catch {
      // Non-critical — the signature already proved the payment is genuine.
    }

    const mongooseSession = await mongoose.startSession();
    try {
      await mongooseSession.withTransaction(async () => {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = "SUCCESS";
        payment.paymentMethod = paymentMethod;
        payment.paidAt = new Date();
        await payment.save({ session: mongooseSession });

        const subscription = await extendUserSubscription({
          userId: payment.userId,
          plan,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          mongooseSession,
        });

        payment.subscriptionId = subscription._id;
        await payment.save({ session: mongooseSession });
      });
    } finally {
      await mongooseSession.endSession();
    }

    const user = await User.findById(payment.userId);
    const response = await buildSuccessResponse(payment);
    // Awaited (both together) — see the matching comment in
    // app/api/signup/route.js for why an unawaited send can't be trusted to
    // complete on serverless. .catch() on each still means a delivery
    // failure can't fail this response — payment verification already
    // succeeded by this point regardless of whether the email goes out.
    await Promise.all([
      sendPaymentSuccessEmail({
        to: user.email,
        name: user.name,
        planName: plan.name,
        amount: payment.amount,
        currency: payment.currency,
        razorpayPaymentId: razorpay_payment_id,
      }).catch(() => {}),
      sendSubscriptionActivatedEmail({
        to: user.email,
        name: user.name,
        planName: plan.name,
        expiryDate: response.subscription.expiryDate,
      }).catch(() => {}),
    ]);

    return NextResponse.json(response);
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ error: "Payment verification failed — please contact support" }, { status: 500 });
  }
}

async function buildSuccessResponse(payment) {
  const [plan, subscription] = await Promise.all([
    Plan.findById(payment.planId),
    Subscription.findById(payment.subscriptionId),
  ]);
  return {
    success: true,
    paymentId: payment._id.toString(),
    razorpayPaymentId: payment.razorpayPaymentId,
    plan: { name: plan?.name },
    amount: payment.amount,
    currency: payment.currency,
    subscription: {
      startDate: subscription?.startDate,
      expiryDate: subscription?.expiryDate,
    },
  };
}
