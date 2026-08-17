import fs from "node:fs";
import path from "node:path";

// Inlined as a data URI (not `/logo.png`) so the header logo renders
// identically whether the invoice is captured via Puppeteer navigating the
// authenticated print page (which has an origin to fetch from) or via
// page.setContent() for the payment-success email attachment (which
// doesn't — see lib/invoiceHtml.js).
let cached;
export function getInvoiceLogoDataUri() {
  if (cached !== undefined) return cached;
  try {
    const buffer = fs.readFileSync(path.join(process.cwd(), "public", "logo-invoice.png"));
    cached = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    cached = null;
  }
  return cached;
}
