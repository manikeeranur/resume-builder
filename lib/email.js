import nodemailer from "nodemailer";

let transporter;

// SMTP is optional — without it, every send below just logs and resolves,
// so the payment/subscription flow never breaks for lack of an email
// provider. Set SMTP_HOST/PORT/USER/PASS/FROM to turn it on.
function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] SMTP not configured, skipping "${subject}" to ${to}`);
    return;
  }
  const fromName = process.env.EMAIL_FROM_NAME || "ResumePro";
  try {
    await t.sendMail({ from: `"${fromName}" <${process.env.SMTP_FROM}>`, to, subject, html });
  } catch (err) {
    // Email is best-effort everywhere it's called from — a delivery
    // failure must never roll back or block the payment/subscription flow.
    console.error(`[email] failed to send "${subject}" to ${to}:`, err.message);
  }
}

const formatAmount = (amountInPaise, currency) => `${currency} ${(amountInPaise / 100).toFixed(2)}`;
const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

export async function sendPaymentSuccessEmail({ to, name, planName, amount, currency, razorpayPaymentId }) {
  await sendMail({
    to,
    subject: "Payment successful",
    html: `<p>Hi ${name},</p><p>We've received your payment of ${formatAmount(amount, currency)} for the ${planName} plan.</p><p>Payment reference: ${razorpayPaymentId}</p>`,
  });
}

export async function sendPaymentFailureEmail({ to, name, planName, reason }) {
  await sendMail({
    to,
    subject: "Payment failed",
    html: `<p>Hi ${name},</p><p>Your payment for the ${planName} plan couldn't be completed${reason ? ` (${reason})` : ""}. No amount was deducted for this attempt. You can retry anytime from the pricing page.</p>`,
  });
}

export async function sendSubscriptionActivatedEmail({ to, name, planName, expiryDate }) {
  await sendMail({
    to,
    subject: "Subscription activated",
    html: `<p>Hi ${name},</p><p>Your ${planName} plan is now active and valid until ${formatDate(expiryDate)}.</p>`,
  });
}

export async function sendSubscriptionExpiryReminderEmail({ to, name, planName, expiryDate }) {
  await sendMail({
    to,
    subject: "Your subscription is expiring soon",
    html: `<p>Hi ${name},</p><p>Your ${planName} plan expires on ${formatDate(expiryDate)}. Renew from your subscription page to keep premium access without interruption.</p>`,
  });
}

export async function sendRefundConfirmationEmail({ to, name, planName, amount, currency }) {
  await sendMail({
    to,
    subject: "Refund confirmed",
    html: `<p>Hi ${name},</p><p>A refund of ${formatAmount(amount, currency)} for your ${planName} plan payment has been processed and will reflect in your original payment method within a few business days.</p>`,
  });
}
