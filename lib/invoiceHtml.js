import { getInvoiceLogoDataUri } from "@/lib/invoiceLogo";

// Plain string template — deliberately NOT sharing components/invoice/
// InvoiceDocument.jsx (which uses JSX/React for the print page). Next's app
// router refuses to bundle a component-derived module alongside
// react-dom/server inside a Route Handler's module graph ("You're importing
// a component that imports react-dom/server"), so the internal,
// no-session invoice render used for the payment-success email attachment
// (lib/invoicePdfAttachment.js) builds its own HTML string instead — same
// pattern lib/email.js already uses for its templates. Keep this in sync
// with InvoiceDocument.jsx if the invoice layout changes.

function escapeHtml(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

function formatShortDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export function renderInvoiceHtml(data) {
  const period = data.subscription
    ? `${formatShortDate(data.subscription.startDate)} - ${formatShortDate(data.subscription.expiryDate)}`
    : "—";
  const total = formatAmount(data.payment.amount, data.payment.currency);
  const logo = getInvoiceLogoDataUri();
  const sectionLabel = "margin:0;font-size:11px;text-transform:uppercase;color:#77738a;font-weight:700;";
  const name = "margin:6px 0 0;font-size:14px;font-weight:600;";
  const muted = "margin:2px 0 0;font-size:13px;color:#77738a;";
  const mono = "margin:2px 0 0;font-size:13px;font-family:monospace;";
  const section = "border-bottom:1px solid #ebe9f5;padding:16px 0;";

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;">
<div id="invoice-content" style="background:#fff;color:#1e1b2e;min-height:100vh;padding:32px;font-family:Inter, sans-serif;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e1b2e;padding-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logo ? `<img src="${logo}" alt="" width="40" height="40" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" />` : ""}
      <div>
        <h1 style="margin:0;font-size:22px;font-weight:800;">${escapeHtml(data.company.name)}</h1>
        <p style="${muted}">${escapeHtml(data.company.supportEmail)}</p>
      </div>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0;font-size:16px;font-weight:700;">INVOICE</h2>
      <p style="${muted}">${escapeHtml(data.invoiceNumber)}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#77738a;">${formatDate(data.payment.paidAt)}</p>
    </div>
  </div>

  <div style="${section}">
    <p style="${sectionLabel}">Billed to</p>
    <p style="${name}">${escapeHtml(data.user.name)}</p>
    <p style="${muted}">${escapeHtml(data.user.email)}</p>
  </div>

  <div style="${section}display:flex;justify-content:space-between;">
    <div>
      <p style="${sectionLabel}">Seller</p>
      <p style="${name}">${escapeHtml(data.seller.name)}</p>
      <p style="${muted}">${escapeHtml(data.seller.email)}</p>
    </div>
    <div style="text-align:right;">
      <p style="${sectionLabel}">GSTIN</p>
      <p style="${name}">${escapeHtml(data.seller.gstin)}</p>
    </div>
  </div>

  <div style="${section}">
    <p style="${sectionLabel}">Reference</p>
    <p style="${mono}">Order &nbsp;&nbsp;${escapeHtml(data.payment.razorpayOrderId)}</p>
    <p style="${mono}">Payment ${escapeHtml(data.payment.razorpayPaymentId)}</p>
  </div>

  <div style="${section}">
    <p style="${sectionLabel}">Subscription &amp; payment</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;row-gap:16px;margin-top:12px;">
      <div>
        <p style="${sectionLabel}">Subscription period</p>
        <p style="${name}">${period}</p>
      </div>
      <div>
        <p style="${sectionLabel}">Payment status</p>
        <p style="margin:6px 0 0;font-size:14px;font-weight:800;color:#1c7c3f;">PAID</p>
      </div>
      <div>
        <p style="${sectionLabel}">Payment method</p>
        <p style="${name}">${escapeHtml(data.payment.method)}</p>
      </div>
      <div>
        <p style="${sectionLabel}">Currency</p>
        <p style="${name}">${escapeHtml(data.payment.currency)}</p>
      </div>
    </div>
  </div>

  <table style="width:100%;margin-top:24px;border-collapse:collapse;">
    <thead>
      <tr style="border-bottom:1px solid #ebe9f5;text-align:left;font-size:11px;text-transform:uppercase;color:#77738a;">
        <th style="padding:8px 0;">Description</th>
        <th style="padding:8px 0;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #ebe9f5;">
        <td style="padding:12px 0;">
          <p style="margin:0;font-size:14px;font-weight:600;">${escapeHtml(data.company.name)} ${escapeHtml(data.plan.name)} Plan</p>
          <p style="margin:2px 0 0;font-size:12px;color:#77738a;">${escapeHtml(data.plan.name)} subscription - ${period}</p>
        </td>
        <td style="padding:12px 0;font-size:14px;text-align:right;vertical-align:top;">${total}</td>
      </tr>
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-top:8px;">
    <table style="min-width:260px;">
      <tbody>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#77738a;">Subtotal</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;">${total}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#77738a;">Tax</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;">Included</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#77738a;">Tax rate / GST details</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;">${escapeHtml(data.taxDetails)}</td>
        </tr>
        <tr style="border-top:1px solid #1e1b2e;">
          <td style="padding:8px 0 0;font-size:15px;font-weight:800;">Total</td>
          <td style="padding:8px 0 0;font-size:15px;font-weight:800;text-align:right;">${total} ${escapeHtml(data.payment.currency)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p style="margin-top:48px;font-size:11px;color:#77738a;text-align:center;">
    Questions about this invoice? Contact ${escapeHtml(data.company.supportEmail)}
  </p>
</div>
</body>
</html>`;
}
