import { forwardCookies } from "@/lib/launchBrowser";
import { isFullBleedTemplate } from "@/lib/templatesServer";

// Renders whatever ends up at `#resume-content` on `url` to PDF bytes, on an
// existing browser instance (a new tab per call, not a new browser) so
// callers that render many pages — e.g. a dashboard's preview batch, or the
// admin template-preview route — can reuse a single Chromium process
// instead of launching one per page.
export async function renderPageToPdf(browser, { url, origin, req, fullBleed = false, pageRanges }) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1024, height: 1200 });
    await forwardCookies(page, req, origin);

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await page.waitForSelector("#resume-content", { timeout: 15000 });

    // Fonts load async over the network (see globals.css @import) and
    // Puppeteer starts with a cold cache every request, so networkidle0
    // alone doesn't guarantee the real webfont has swapped in yet. Without
    // this, the PDF can render with fallback-font metrics that wrap text
    // differently than the (font-cached) browser preview, shifting page
    // breaks by a few lines.
    await page.evaluate(() => document.fonts.ready);

    await page.addStyleTag({
      content: `
        html, body { background: #fff !important; overflow: visible !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `,
    });

    // Templates with full-bleed backgrounds (a header band, a sidebar, a
    // decorative page image) are designed to reach the page edge, unlike
    // templates with no padding of their own that rely on this margin for
    // breathing room — so only full-bleed templates skip it.
    const margin = fullBleed
      ? { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
      : { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" };

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin,
      ...(pageRanges ? { pageRanges } : {}),
    });

    return Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderResumePdf(browser, { resumeId, templateId, origin, req, pageRanges }) {
  const fullBleed = await isFullBleedTemplate(templateId);
  return renderPageToPdf(browser, {
    url: `${origin}/resumes/${resumeId}/print`,
    origin,
    req,
    fullBleed,
    pageRanges,
  });
}
