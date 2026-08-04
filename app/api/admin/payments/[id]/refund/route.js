import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { createRazorpayRefund } from "@/lib/razorpay";

// Initiates a refund with Razorpay — the definitive refund state
// (refund.processed) arrives via the webhook, this just kicks it off and
// marks the payment as INITIATED so admins see it's in flight.
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const payment = await Payment.findById(params.id);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "SUCCESS" || !payment.razorpayPaymentId) {
    return NextResponse.json({ error: "Only a successful payment can be refunded" }, { status: 400 });
  }
  if (payment.refundStatus !== "NONE") {
    return NextResponse.json({ error: "A refund has already been initiated for this payment" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const previousRefundStatus = payment.refundStatus;

  try {
    await createRazorpayRefund(payment.razorpayPaymentId, {
      amount: body.amount ? Math.round(Number(body.amount)) : undefined,
      notes: body.reason ? { reason: body.reason } : undefined,
    });
  } catch (err) {
    console.error("Razorpay refund failed:", err.message);
    return NextResponse.json({ error: "Could not initiate refund with Razorpay" }, { status: 502 });
  }

  payment.refundStatus = "INITIATED";
  await payment.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "payment.refund_initiated",
    targetType: "Payment",
    targetId: payment._id,
    previousValue: { refundStatus: previousRefundStatus },
    newValue: { refundStatus: "INITIATED", reason: body.reason || null },
  });

  return NextResponse.json({ success: true, refundStatus: payment.refundStatus });
}
