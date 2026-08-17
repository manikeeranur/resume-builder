import { getInvoiceLogoDataUri } from "@/lib/invoiceLogo";

// Plain, inline-styled markup — no external stylesheet — used by the
// authenticated print page (app/invoice/[paymentId]/print), captured by
// Puppeteer via lib/renderInvoicePdf.js. The payment-success email attaches
// an independent plain-string re-implementation of this same layout instead
// of importing this component — see lib/invoiceHtml.js for why.

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

function formatShortDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

const styles = {
  page: { background: "#fff", color: "#1e1b2e", minHeight: "100vh", padding: "32px", fontFamily: "Inter, sans-serif" },
  sectionLabel: { margin: 0, fontSize: 11, textTransform: "uppercase", color: "#77738a", fontWeight: 700 },
  section: { borderBottom: "1px solid #ebe9f5", padding: "16px 0" },
  name: { margin: "6px 0 0", fontSize: 14, fontWeight: 600 },
  muted: { margin: "2px 0 0", fontSize: 13, color: "#77738a" },
  mono: { margin: "2px 0 0", fontSize: 13, fontFamily: "monospace" },
};

export default function InvoiceDocument({ data }) {
  const period = data.subscription
    ? `${formatShortDate(data.subscription.startDate)} - ${formatShortDate(data.subscription.expiryDate)}`
    : "—";
  const total = formatAmount(data.payment.amount, data.payment.currency);
  const logo = getInvoiceLogoDataUri();

  return (
    <div id="invoice-content" style={styles.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #1e1b2e",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logo && (
            <img
              src={logo}
              alt=""
              width={40}
              height={40}
              style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
            />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{data.company.name}</h1>
            <p style={styles.muted}>{data.company.supportEmail}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>INVOICE</h2>
          <p style={styles.muted}>{data.invoiceNumber}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#77738a" }}>{formatDate(data.payment.paidAt)}</p>
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionLabel}>Billed to</p>
        <p style={styles.name}>{data.user.name}</p>
        <p style={styles.muted}>{data.user.email}</p>
      </div>

      <div style={{ ...styles.section, display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={styles.sectionLabel}>Seller</p>
          <p style={styles.name}>{data.seller.name}</p>
          <p style={styles.muted}>{data.seller.email}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={styles.sectionLabel}>GSTIN</p>
          <p style={styles.name}>{data.seller.gstin}</p>
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionLabel}>Reference</p>
        <p style={styles.mono}>Order &nbsp;&nbsp;{data.payment.razorpayOrderId}</p>
        <p style={styles.mono}>Payment {data.payment.razorpayPaymentId}</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionLabel}>Subscription &amp; payment</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 16, marginTop: 12 }}>
          <div>
            <p style={styles.sectionLabel}>Subscription period</p>
            <p style={styles.name}>{period}</p>
          </div>
          <div>
            <p style={styles.sectionLabel}>Payment status</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 800, color: "#1c7c3f" }}>PAID</p>
          </div>
          <div>
            <p style={styles.sectionLabel}>Payment method</p>
            <p style={styles.name}>{data.payment.method}</p>
          </div>
          <div>
            <p style={styles.sectionLabel}>Currency</p>
            <p style={styles.name}>{data.payment.currency}</p>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #ebe9f5",
              textAlign: "left",
              fontSize: 11,
              textTransform: "uppercase",
              color: "#77738a",
            }}
          >
            <th style={{ padding: "8px 0" }}>Description</th>
            <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #ebe9f5" }}>
            <td style={{ padding: "12px 0" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {data.company.name} {data.plan.name} Plan
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#77738a" }}>
                {data.plan.name} subscription - {period}
              </p>
            </td>
            <td style={{ padding: "12px 0", fontSize: 14, textAlign: "right", verticalAlign: "top" }}>{total}</td>
          </tr>
        </tbody>
      </table>

      {/* This is a payment receipt, not a GST-compliant tax invoice — no
          separate tax line is fabricated since the app doesn't collect
          business tax-registration details. */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <table style={{ minWidth: 260 }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", fontSize: 13, color: "#77738a" }}>Subtotal</td>
              <td style={{ padding: "6px 0", fontSize: 13, textAlign: "right" }}>{total}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontSize: 13, color: "#77738a" }}>Tax</td>
              <td style={{ padding: "6px 0", fontSize: 13, textAlign: "right" }}>Included</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontSize: 13, color: "#77738a" }}>Tax rate / GST details</td>
              <td style={{ padding: "6px 0", fontSize: 13, textAlign: "right" }}>{data.taxDetails}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #1e1b2e" }}>
              <td style={{ padding: "8px 0 0", fontSize: 15, fontWeight: 800 }}>Total</td>
              <td style={{ padding: "8px 0 0", fontSize: 15, fontWeight: 800, textAlign: "right" }}>
                {total} {data.payment.currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 48, fontSize: 11, color: "#77738a", textAlign: "center" }}>
        Questions about this invoice? Contact {data.company.supportEmail}
      </p>
    </div>
  );
}
