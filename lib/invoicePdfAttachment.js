import { getInvoiceData } from "@/lib/invoice";
import { renderInvoiceHtml } from "@/lib/invoiceHtml";
import { renderInvoicePdfFromHtml } from "@/lib/renderInvoicePdfFromHtml";
import { launchBrowser } from "@/lib/launchBrowser";

// Best-effort helper used right after a payment succeeds (webhook + verify
// route) to attach the invoice PDF to the payment-success email. Callers
// already know paymentId/userId belong together (they just finalized this
// exact payment), so this skips the ownership re-check getInvoiceData does
// for user-facing requests.
export async function buildInvoicePdfAttachment(paymentId, userId) {
  const data = await getInvoiceData(paymentId, { userId, isAdmin: true });
  if (!data) return null;

  let browser = null;
  try {
    browser = await launchBrowser();
    const html = renderInvoiceHtml(data);
    const buffer = await renderInvoicePdfFromHtml(browser, html);
    return { filename: `${data.invoiceNumber}.pdf`, content: buffer, contentType: "application/pdf" };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
