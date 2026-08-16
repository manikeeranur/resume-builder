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
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

export async function sendSignupOtpEmail({ to, name, otp, ttlMinutes }) {
  await sendMail({
    to,
    subject: `${otp} is your ResumePro verification code`,
    html: `<p>Hi ${name},</p><p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p><p>It expires in ${ttlMinutes} minutes. If you didn't create a ResumePro account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetOtpEmail({ to, name, otp, ttlMinutes }) {
  await sendMail({
    to,
    subject: `${otp} is your ResumePro password reset code`,
    html: `<p>Hi ${name},</p><p>Your password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p><p>It expires in ${ttlMinutes} minutes. If you didn't request a password reset, you can ignore this email — your password won't change.</p>`,
  });
}

export async function sendWelcomeEmail({ to, name }) {
  await sendMail({
    to,
    subject: "Welcome to ResumePro",
    html: `<p>Hi ${name},</p><p>Your account is ready. Build your resume, pick a template, and download it whenever you like — your free plan covers the essentials, and you can upgrade any time from the pricing page.</p>`,
  });
}

// Admin-authored, one-off notification to a single user — subject/message
// come from the admin (see app/api/admin/users/[id]/email), not a fixed
// template like every other function in this file. `message` is plain text
// from a <textarea>, so newlines are turned into <br> for it to read as
// paragraphs instead of one run-on line; nothing else about it is escaped
// beyond the browser's own textarea handling, since this is admin-authored
// content going to one address, not user-submitted content rendered back
// to other users.
export async function sendAdminCustomEmail({ to, name, subject, message }) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  await sendMail({
    to,
    subject,
    html: `<p>Hi ${escapeHtml(name)},</p>${paragraphs}`,
  });
}
