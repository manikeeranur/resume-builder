import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { launchBrowser, forwardCookies } from "@/lib/launchBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let browser = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1200 });

    // Prefer the incoming request's own origin — it's always correct,
    // whereas NEXTAUTH_URL is a manually-set env var that can drift out of
    // sync with the actual deployment URL (e.g. still pointing at
    // localhost in production) and would otherwise send Puppeteer to an
    // unreachable host.
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;
    await forwardCookies(page, req, origin);

    await page.goto(`${origin}/resumes/${params.id}/print`, {
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

    // Templates 3 & 4 have full-bleed color backgrounds (a header band, a
    // sidebar) designed to reach the page edge, unlike Templates 1/2 which
    // have no padding of their own and rely on this margin for breathing
    // room — so only the full-bleed templates skip it.
    const FULL_BLEED_TEMPLATES = new Set(["template-3", "template-4"]);
    const margin = FULL_BLEED_TEMPLATES.has(resume.templateId)
      ? { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
      : { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" };

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin,
    });

    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        // Every request must reflect the resume's current saved state (e.g.
        // theme changes) — without this, browsers can serve a stale cached
        // PDF for this same URL from before the latest save.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err.message);
    return NextResponse.json({ error: "Failed to generate PDF", detail: err.message }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}
