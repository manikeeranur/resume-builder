import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import Plan from "@/lib/models/Plan";
import User from "@/lib/models/User";

// Simple, sequential-looking invoice number derived from the payment's own
// id and paid date — no separate counter/collection needed.
export function invoiceNumberFor(payment) {
  const date = payment.paidAt || payment.createdAt;
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `INV-${ym}-${payment._id.toString().slice(-6).toUpperCase()}`;
}

// Loads everything the invoice template needs, and enforces that only the
// paying user or an admin can view it — callers just supply who's asking.
export async function getInvoiceData(paymentId, { userId, isAdmin }) {
  await dbConnect();
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== "SUCCESS") return null;
  if (!isAdmin && payment.userId.toString() !== userId) return null;

  const [plan, user] = await Promise.all([Plan.findById(payment.planId), User.findById(payment.userId)]);
  if (!plan || !user) return null;

  // This is a payment record, not a GST-compliant tax invoice — the amount
  // charged at checkout is treated as the total; no separate tax line is
  // fabricated here since this app doesn't collect tax registration details.
  return {
    invoiceNumber: invoiceNumberFor(payment),
    user: { name: user.name, email: user.email },
    plan: { name: plan.name, billingType: plan.billingType },
    payment: {
      id: payment._id.toString(),
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt,
    },
    company: {
      name: process.env.INVOICE_COMPANY_NAME || "ResumePro",
      supportEmail: process.env.INVOICE_SUPPORT_EMAIL || "support@example.com",
    },
  };
}
