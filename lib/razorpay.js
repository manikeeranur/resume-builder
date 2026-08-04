import Razorpay from "razorpay";
import crypto from "node:crypto";

let instance = null;

// Lazily constructed (not at module load) so a missing key doesn't crash
// routes that never touch Razorpay, and pages/other server code stay free
// to import from here without needing the secret to be set.
function getClient() {
  if (instance) return instance;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  }
  instance = new Razorpay({ key_id, key_secret });
  return instance;
}

// amountInPaise must already be server-computed (plan.price * 100) — never
// pass through a client-supplied amount.
export async function createRazorpayOrder({ amountInPaise, currency, receipt, notes }) {
  const client = getClient();
  return client.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
}

export async function fetchRazorpayPayment(paymentId) {
  const client = getClient();
  return client.payments.fetch(paymentId);
}

export async function createRazorpayRefund(paymentId, { amount, notes } = {}) {
  const client = getClient();
  return client.payments.refund(paymentId, { ...(amount ? { amount } : {}), notes });
}

// Order+payment+signature triple returned by Checkout after a successful
// charge — HMAC-SHA256("order_id|payment_id", key_secret) per Razorpay's spec.
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) throw new Error("RAZORPAY_KEY_SECRET is not set");
  const expected = crypto
    .createHmac("sha256", key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (!signature || expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Webhook signature is a different HMAC — over the raw request body, keyed
// by the separate webhook secret configured in the Razorpay dashboard.
export function verifyWebhookSignature({ rawBody, signature }) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (!signature || expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
