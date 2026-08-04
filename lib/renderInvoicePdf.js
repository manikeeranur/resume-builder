import { forwardCookies } from "@/lib/launchBrowser";

// Mirrors renderResumePdf.js — navigates Puppeteer to the same-origin,
// auth-gated invoice print page and captures it, instead of pulling in a
// separate PDF/invoice library.
export async function renderInvoicePdf(browser, { paymentId, origin, req }) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 900, height: 1200 });
    await forwardCookies(page, req, origin);

    await page.goto(`${origin}/invoice/${paymentId}/print`, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await page.waitForSelector("#invoice-content", { timeout: 15000 });

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });

    return Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
  } finally {
    await page.close().catch(() => {});
  }
}
