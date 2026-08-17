// Same capture settings as lib/renderInvoicePdf.js, but starting from an
// already-serialized HTML string (page.setContent) instead of navigating to
// an auth-gated route — used where there's no session/cookies to forward.
export async function renderInvoicePdfFromHtml(browser, html) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 900, height: 1200 });
    // "networkidle0" can hang indefinitely on page.setContent() (no real
    // navigation is happening, so the network-idle watcher sometimes never
    // fires) — this HTML has no external resources (logo is inlined as a
    // data URI), so "domcontentloaded" is both sufficient and immediate.
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });

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
