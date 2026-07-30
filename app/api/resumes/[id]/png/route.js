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

    const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    await forwardCookies(page, req, origin);

    await page.goto(`${origin}/resumes/${params.id}/print`, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    const el = await page.waitForSelector("#resume-content", { timeout: 15000 });

    await page.addStyleTag({
      content: `* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`,
    });

    const pngData = await el.screenshot({ type: "png" });
    const pngBuffer = Buffer.isBuffer(pngData) ? pngData : Buffer.from(pngData);
    const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.png`;

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pngBuffer.length),
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
