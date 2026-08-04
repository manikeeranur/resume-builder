import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { launchBrowser } from "@/lib/launchBrowser";
import { renderResumePdf } from "@/lib/renderResumePdf";
import Resume from "@/lib/models/Resume";
import { checkDownloadLimit, recordPdfDownload } from "@/lib/subscription/check-download-limit";

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

    // Prefer the incoming request's own origin — it's always correct,
    // whereas NEXTAUTH_URL is a manually-set env var that can drift out of
    // sync with the actual deployment URL (e.g. still pointing at
    // localhost in production) and would otherwise send Puppeteer to an
    // unreachable host.
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;

    const pdfBuffer = await renderResumePdf(browser, {
      resumeId: params.id,
      templateId: resume.templateId,
      origin,
      req,
    });
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

// Called by the explicit "Download" button (not the in-page PDF viewer,
// which only GETs this route to display it) so "Total Downloads" reflects
// actual downloads rather than every preview render. This is also the only
// place the plan's PDF-download limit is enforced — GET is shared with the
// live preview/theme-modal/dashboard-card viewers, which must keep working
// even once a free user is at their limit; only a real, completed download
// (this POST) counts against it.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const downloadLimit = await checkDownloadLimit(session.user.id);
    if (!downloadLimit.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your plan's limit of ${downloadLimit.limit} PDF download(s) this period. Upgrade for more.`,
          code: "DOWNLOAD_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    await recordPdfDownload(session.user.id, params.id);
    // timestamps: false — a download doesn't change the resume's content, so
    // it shouldn't bump updatedAt and invalidate the cached preview PDF.
    await Resume.updateOne({ _id: params.id }, { $inc: { downloadCount: 1 } }, { timestamps: false });
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Download-count error:", err);
    return NextResponse.json({ error: "Failed to record download" }, { status: 500 });
  }
}
