import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { launchBrowser, forwardCookies } from "@/lib/launchBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Render at 3× the CSS-pixel resolution so the exported PNG stays sharp
// when zoomed or printed — this is the "HD" the download label promises.
// At the templates' 850px render width that lands around a 2550px-wide
// image.
const DEVICE_SCALE = 3;

// A4 portrait aspect (210 × 297 mm). The /print page can run several A4
// pages long; this export is deliberately the first page only, so the
// screenshot is clipped to this ratio of the resume's rendered width.
const A4_RATIO = 297 / 210;

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let browser = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1400, deviceScaleFactor: DEVICE_SCALE });

    // Prefer the incoming request's own origin — see pdf/route.js for why.
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;
    await forwardCookies(page, req, origin);

    await page.goto(`${origin}/resumes/${params.id}/print`, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await page.waitForSelector("#resume-content", { timeout: 30000 });

    // See renderResumePdf.js for why both waits are needed — without them
    // the screenshot can capture fallback-font metrics or a still-decoding
    // profile photo.
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              })
          )
      )
    );

    await page.addStyleTag({
      content: `
        html, body { background: #fff !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `,
    });

    const box = await page.evaluate((ratio) => {
      const el = document.querySelector("#resume-content");
      const r = el.getBoundingClientRect();
      return {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        width: r.width,
        fullHeight: r.height,
        pageHeight: r.width * ratio,
      };
    }, A4_RATIO);

    const pngData = await page.screenshot({
      type: "png",
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: box.width,
        // First A4 page only, but never taller than the content itself so a
        // short one-page resume doesn't get a strip of trailing whitespace.
        height: Math.min(box.pageHeight, box.fullHeight),
      },
    });
    const pngBuffer = Buffer.isBuffer(pngData) ? pngData : Buffer.from(pngData);
    const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.png`;

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pngBuffer.length),
        // Mirror the resume's current saved state on every request — see
        // pdf/route.js.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PNG generation error:", err.message);
    return NextResponse.json({ error: "Failed to generate PNG", detail: err.message }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}
