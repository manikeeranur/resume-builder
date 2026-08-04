import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInvoiceData } from "@/lib/invoice";

function formatAmount(amountInPaise, currency) {
  return `${currency === "INR" ? "₹" : currency + " "}${(amountInPaise / 100).toFixed(2)}`;
}
function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

// Captured by Puppeteer (lib/renderInvoicePdf.js), same pattern as
// app/resumes/[id]/print — a plain, print-friendly HTML page rather than a
// separate PDF/invoice library.
export default async function InvoicePrintPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const data = await getInvoiceData(params.paymentId, {
    userId: session.user.id,
    isAdmin: session.user.role === "admin",
  });
  if (!data) notFound();

  return (
    <div
      id="invoice-content"
      style={{ background: "#fff", color: "#1e1b2e", minHeight: "100vh", padding: "32px", fontFamily: "Inter, sans-serif" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e1b2e", paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{data.company.name}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#77738a" }}>{data.company.supportEmail}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>INVOICE</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#77738a" }}>{data.invoiceNumber}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#77738a" }}>{formatDate(data.payment.paidAt)}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#77738a", fontWeight: 700 }}>Billed to</p>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600 }}>{data.user.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#77738a" }}>{data.user.email}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#77738a", fontWeight: 700 }}>Reference</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, fontFamily: "monospace" }}>Order: {data.payment.razorpayOrderId}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontFamily: "monospace" }}>Payment: {data.payment.razorpayPaymentId}</p>
        </div>
      </div>

      <table style={{ width: "100%", marginTop: 32, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ebe9f5", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#77738a" }}>
            <th style={{ padding: "8px 0" }}>Description</th>
            <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #ebe9f5" }}>
            <td style={{ padding: "12px 0", fontSize: 14 }}>{data.plan.name} plan ({data.plan.billingType.toLowerCase()})</td>
            <td style={{ padding: "12px 0", fontSize: 14, textAlign: "right" }}>{formatAmount(data.payment.amount, data.payment.currency)}</td>
          </tr>
        </tbody>
      </table>

      {/* This is a payment receipt, not a GST-compliant tax invoice — no
          separate tax line is fabricated since the app doesn't collect
          business tax-registration details. */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <table style={{ minWidth: 220 }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", fontSize: 13, color: "#77738a" }}>Subtotal</td>
              <td style={{ padding: "6px 0", fontSize: 13, textAlign: "right" }}>{formatAmount(data.payment.amount, data.payment.currency)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontSize: 13, color: "#77738a" }}>Tax</td>
              <td style={{ padding: "6px 0", fontSize: 13, textAlign: "right" }}>Included</td>
            </tr>
            <tr style={{ borderTop: "1px solid #1e1b2e" }}>
              <td style={{ padding: "8px 0 0", fontSize: 15, fontWeight: 800 }}>Total</td>
              <td style={{ padding: "8px 0 0", fontSize: 15, fontWeight: 800, textAlign: "right" }}>
                {formatAmount(data.payment.amount, data.payment.currency)}
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
