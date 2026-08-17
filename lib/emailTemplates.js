// Table-based layout + inline styles throughout, no data: URIs — email
// clients (Outlook especially) don't support flexbox/grid and many strip or
// block data: image URIs outright, unlike a browser-rendered page (compare
// lib/invoiceHtml.js, which can use data: URIs since Puppeteer renders it,
// not a mail client). The logo is referenced by its real hosted URL instead.

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function logoUrl() {
  const origin = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${origin}/logo.png`;
}

// One key/value row inside the summary/details card.
function detailRow({ label, value, valueHtml, last }) {
  return `
    <tr>
      <td style="padding:10px 0;${last ? "" : "border-bottom:1px solid #e5e7eb;"}font-size:13px;color:#6b7280;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;${last ? "" : "border-bottom:1px solid #e5e7eb;"}font-size:13px;color:#111827;font-weight:600;text-align:right;">${
        valueHtml ?? escapeHtml(value)
      }</td>
    </tr>`;
}

// Shared card wrapper: logo header, centered icon badge, heading, caller's
// own body HTML, optional CTA button, then the common "need help" +
// sign-off + social row every template in the reference design shares.
function emailShell({ eyebrow, iconEmoji, iconBg, heading, bodyHtml, ctaLabel, ctaHref, footNote, companyName, supportEmail }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(companyName)}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${logoUrl()}" width="28" height="28" alt="" style="display:block;border-radius:8px;" />
                        </td>
                        <td style="vertical-align:middle;padding-left:8px;">
                          <span style="font-size:16px;font-weight:800;color:#111827;">${escapeHtml(companyName)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align:right;vertical-align:middle;font-size:12px;color:#6b7280;">${escapeHtml(eyebrow)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 28px 28px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>
                  <td
                    width="64"
                    height="64"
                    style="width:64px;height:64px;border-radius:50%;background:${iconBg};text-align:center;vertical-align:middle;font-size:28px;line-height:64px;"
                  >
                    ${iconEmoji}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:800;color:#111827;">${heading}</h1>

              <div style="text-align:left;">
                ${bodyHtml}
              </div>

              ${
                ctaLabel
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td align="center">
                    <a
                      href="${ctaHref}"
                      style="display:inline-block;width:100%;box-sizing:border-box;padding:13px 24px;border-radius:10px;background:#6d5ce8;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;"
                    >${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              ${footNote ? `<p style="margin:14px 0 0;font-size:12px;color:#6b7280;text-align:center;">${footNote}</p>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:18px;">
                <tr>
                  <td style="font-size:13px;color:#374151;">
                    <strong>Need help?</strong><br />
                    <span style="color:#6b7280;">Just reply to this email, we're here to help.</span>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
                Thank you,<br />
                <span style="color:#6d5ce8;font-weight:700;">${escapeHtml(companyName)} Team</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderPaymentReceivedEmail({ name, planName, amount, currency, razorpayPaymentId, paidAt, accountUrl, companyName, supportEmail }) {
  const total = formatAmount(amount, currency);
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      We've received your payment of <strong>${currency} ${(amount / 100).toFixed(2)}</strong> for the <strong>${escapeHtml(
        planName
      )} plan</strong>. Your subscription is being processed.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:4px 16px;">
      <tr><td colspan="2" style="padding-top:10px;font-size:11px;font-weight:700;text-transform:uppercase;color:#6d5ce8;">Payment Summary</td></tr>
      ${detailRow({ label: "Plan", value: `${planName} Plan` })}
      ${detailRow({ label: "Amount", value: total })}
      ${detailRow({
        label: "Status",
        valueHtml: `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#15803d;font-size:12px;font-weight:700;">Paid</span>`,
      })}
      ${detailRow({ label: "Payment reference", value: razorpayPaymentId })}
      ${detailRow({ label: "Date", value: formatDate(paidAt), last: true })}
    </table>`;

  return emailShell({
    eyebrow: "Payment Received",
    iconEmoji: "🧾",
    iconBg: "#e5edff",
    heading: "Payment received!",
    bodyHtml,
    ctaLabel: "View your account",
    ctaHref: accountUrl,
    footNote: "You'll receive another email once your plan is active.",
    companyName,
    supportEmail,
  });
}

export function renderPlanActiveEmail({ name, planName, expiryDate, dashboardUrl, companyName, supportEmail }) {
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      Great news! Your <strong>${escapeHtml(planName)} plan</strong> is now active and valid until <strong>${formatDate(
        expiryDate
      )}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:4px 16px;">
      <tr><td colspan="2" style="padding-top:10px;font-size:11px;font-weight:700;text-transform:uppercase;color:#16a34a;">Subscription Details</td></tr>
      ${detailRow({ label: "Plan", value: `${planName} Plan` })}
      ${detailRow({
        label: "Status",
        valueHtml: `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#dcfce7;color:#15803d;font-size:12px;font-weight:700;">Active</span>`,
      })}
      ${detailRow({ label: "Valid until", value: formatDate(expiryDate), last: true })}
    </table>`;

  return emailShell({
    eyebrow: "Plan Activated",
    iconEmoji: "🎉",
    iconBg: "#dcfce7",
    heading: `Your ${escapeHtml(planName)} plan is now active!`,
    bodyHtml,
    ctaLabel: "Start building your resume",
    ctaHref: dashboardUrl,
    footNote: "Thanks for choosing ResumePro. We're excited to help you create your next great resume!",
    companyName,
    supportEmail,
  });
}

export function renderWelcomeEmail({ name, createResumeUrl, upgradeUrl, companyName, supportEmail }) {
  const step = (num, title, desc) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#f9fafb;border-radius:10px;">
      <tr>
        <td style="padding:12px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="30" height="30" style="width:30px;height:30px;border-radius:50%;background:#ede9fe;color:#6d5ce8;font-size:12px;font-weight:800;text-align:center;vertical-align:middle;">${num}</td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0;font-size:13px;font-weight:700;color:#111827;">${escapeHtml(title)}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${escapeHtml(desc)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      Hi ${escapeHtml(name)},
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;text-align:center;">
      Your account is ready. Build your resume, pick a template, and download it whenever you like.
    </p>
    ${step("01", "Build", "Add your experience, education, skills, and projects.")}
    ${step("02", "Customize", "Choose from professional templates that fit your style.")}
    ${step("03", "Download", "Export your resume in high quality whenever you're ready.")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#eef2ff;border-radius:10px;">
      <tr>
        <td style="padding:12px 14px;font-size:12px;color:#3730a3;">
          You're currently on the <strong>Free Plan</strong>. <a href="${upgradeUrl}" style="color:#6d5ce8;font-weight:700;text-decoration:none;">Upgrade</a> anytime to unlock more powerful features.
        </td>
      </tr>
    </table>`;

  return emailShell({
    eyebrow: "Welcome Aboard",
    iconEmoji: "👋",
    iconBg: "#ede9fe",
    heading: `Welcome to <span style="color:#6d5ce8;">${escapeHtml(companyName)}</span>!`,
    bodyHtml,
    ctaLabel: "Create my resume",
    ctaHref: createResumeUrl,
    companyName,
    supportEmail,
  });
}
