import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import Plan from "@/lib/models/Plan";
import User from "@/lib/models/User";
import WebhookEvent from "@/lib/models/WebhookEvent";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { extendUserSubscription } from "@/lib/subscription/extend-subscription";
import {
  sendPaymentSuccessEmail,
  sendSubscriptionActivatedEmail,
  sendPaymentFailureEmail,
  sendRefundConfirmationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

// This is the source of truth for final payment state — it fires even if
// the user closes the tab right after paying, before /api/payments/verify
// ever runs. It must never create a second Payment/Subscription for
// something /verify (or an earlier webhook delivery) already finalized.
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  let validSignature;
  try {
    validSignature = verifyWebhookSignature({ rawBody, signature });
  } catch (err) {
    // Missing RAZORPAY_WEBHOOK_SECRET — a config error, not an attack, but
    // we still must not process an unverifiable payload.
    console.error("Webhook signature check unavailable:", err.message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity || event.payload?.refund?.entity;
  // Razorpay doesn't guarantee a body-level event id on every account
  // configuration; the x-razorpay-event-id header is the documented
  // dedup key when present, falling back to a composite of the event type
  // + underlying entity id (itself unique per payment/refund).
  const razorpayEventId = req.headers.get("x-razorpay-event-id") || `${event.event}_${entity?.id}_${event.created_at}`;

  await dbConnect();

  try {
    await WebhookEvent.create({ razorpayEventId, eventType: event.event, payload: event });
  } catch (err) {
    if (err.code === 11000) {
      // Already received and (at least) recorded — ack so Razorpay stops retrying.
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    await handleEvent(event);
    await WebhookEvent.updateOne({ razorpayEventId }, { $set: { processed: true, processedAt: new Date() } });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    // Leave processed:false so it's visible for investigation; still ack
    // with 200 since retries would just hit the same application error.
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event) {
  switch (event.event) {
    case "payment.captured":
      return handlePaymentCaptured(event.payload.payment.entity);
    case "payment.failed":
      return handlePaymentFailed(event.payload.payment.entity);
    case "refund.created":
      return handleRefundUpdate(event.payload.refund.entity, "INITIATED");
    case "refund.processed":
      return handleRefundUpdate(event.payload.refund.entity, "PROCESSED");
    default:
      return;
  }
}

async function handlePaymentCaptured(paymentEntity) {
  const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
  if (!payment) return;
  // Already finalized by /api/payments/verify (or an earlier delivery of
  // this same webhook) — nothing left to do.
  if (payment.status === "SUCCESS") return;

  const plan = await Plan.findById(payment.planId);
  if (!plan) return;

  let subscription;
  const mongooseSession = await mongoose.startSession();
  try {
    await mongooseSession.withTransaction(async () => {
      payment.razorpayPaymentId = paymentEntity.id;
      payment.status = "SUCCESS";
      payment.paymentMethod = paymentEntity.method || null;
      payment.paidAt = new Date();
      await payment.save({ session: mongooseSession });

      subscription = await extendUserSubscription({
        userId: payment.userId,
        plan,
        razorpayOrderId: paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        mongooseSession,
      });

      payment.subscriptionId = subscription._id;
      await payment.save({ session: mongooseSession });
    });
  } finally {
    await mongooseSession.endSession();
  }

  const user = await User.findById(payment.userId);
  if (user) {
    sendPaymentSuccessEmail({
      to: user.email,
      name: user.name,
      planName: plan.name,
      amount: payment.amount,
      currency: payment.currency,
      razorpayPaymentId: paymentEntity.id,
    }).catch(() => {});
    sendSubscriptionActivatedEmail({
      to: user.email,
      name: user.name,
      planName: plan.name,
      expiryDate: subscription.expiryDate,
    }).catch(() => {});
  }
}

async function handlePaymentFailed(paymentEntity) {
  const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
  if (!payment || payment.status === "SUCCESS" || payment.status === "FAILED") return;

  payment.status = "FAILED";
  payment.failureReason = paymentEntity.error_description || "Payment failed";
  await payment.save();

  const [user, plan] = await Promise.all([User.findById(payment.userId), Plan.findById(payment.planId)]);
  if (user && plan) {
    sendPaymentFailureEmail({ to: user.email, name: user.name, planName: plan.name, reason: payment.failureReason }).catch(
      () => {}
    );
  }
}

async function handleRefundUpdate(refundEntity, refundStatus) {
  const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
  if (!payment) return;

  payment.refundStatus = refundStatus;
  if (refundStatus === "PROCESSED") payment.status = "REFUNDED";
  await payment.save();

  if (refundStatus === "PROCESSED") {
    const [user, plan] = await Promise.all([User.findById(payment.userId), Plan.findById(payment.planId)]);
    if (user && plan) {
      sendRefundConfirmationEmail({
        to: user.email,
        name: user.name,
        planName: plan.name,
        amount: refundEntity.amount,
        currency: payment.currency,
      }).catch(() => {});
    }
  }
}
