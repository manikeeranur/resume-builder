import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { getBrowser, resolveOrigin } from "@/lib/launchBrowser";
import { renderResumePdf } from "@/lib/renderResumePdf";
import { isServerRenderable, renderResumeHtml } from "@/lib/renderResumeHtml";
import Resume from "@/lib/models/Resume";
import { checkDownloadLimit, recordPdfDownload } from "@/lib/subscription/check-download-limit";
import { checkFeatureAccess } from "@/lib/subscription/check-feature-access";

// Rendered PDFs, reused while the resume is unchanged. Keyed by everything
// the output depends on: the resume's last save (updatedAt — content, theme
// and template all bump it), the page range, and the viewer's watermark.
// A short TTL bounds staleness for things that don't bump updatedAt (an
// admin editing a dynamic template's code). Per server process, in memory.
const PDF_CACHE_TTL_MS = 10 * 60 * 1000;
const PDF_CACHE_MAX = 50;
const pdfCache = globalThis.__resumePdfCache ?? (globalThis.__resumePdfCache = new Map());
function cacheGet(key) {
  const hit = pdfCache.get(key);
  if (!hit || Date.now() - hit.at > PDF_CACHE_TTL_MS) return null;
  return hit.buf;
}
function cacheSet(key, buf) {
  pdfCache.delete(key);
  pdfCache.set(key, { at: Date.now(), buf });
  while (pdfCache.size > PDF_CACHE_MAX) pdfCache.delete(pdfCache.keys().next().value);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ?pages=1 → first page only: the editor/theme-modal previews only ever
  // show page 1, so rendering the rest was wasted work on every autosave.
  const firstPageOnly = new URL(req.url).searchParams.get("pages") === "1";
  try {
    const access = await checkFeatureAccess(session.user.id);
    const cacheKey = [params.id, new Date(resume.updatedAt || 0).getTime(), firstPageOnly ? "p1" : "all", access.shouldWatermark ? "wm" : "clean"].join("|");
    let pdfBuffer = cacheGet(cacheKey);

    if (!pdfBuffer) {
      const browser = await getBrowser();
      // See resolveOrigin() for why this isn't just `new URL(req.url).origin`.
      const origin = resolveOrigin(req);
      // Built-in templates: render HTML on the server and hand it to Chromium
      // directly (fast path). Admin-created templates still load /print.
      const html = isServerRenderable(resume.templateId)
        ? await renderResumeHtml(resume.toObject(), {
            watermark: access.shouldWatermark,
            watermarkText: process.env.WATERMARK_TEXT || "ResumePro",
          })
        : undefined;
      pdfBuffer = await renderResumePdf(browser, {
        html,
        resumeId: params.id,
        templateId: resume.templateId,
        origin,
        req,
        ...(firstPageOnly ? { pageRanges: "1" } : {}),
      });
      cacheSet(cacheKey, pdfBuffer);
    }
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
  }
  // The shared browser stays open for the next request; renderPageToPdf
  // closes its own tab.
}

// Called by the explicit "Download" button (not the in-page PDF viewer,
// which only GETs this route to display it) so "Total Downloads" reflects
// actual downloads rather than every preview render. This is also the only
// place the plan's PDF-download limit is enforced — GET is shared with the
// live preview/theme-modal/dashboard-card viewers, which must keep working
// even once a free user is at their limit; only a real, completed download
// (this POST) counts against it.
//
// The client sends the exact bytes it already got back from its own GET
// call as the request body — reusing them here instead of re-rendering the
// PDF a second time, purely so this row can keep a permanent snapshot (see
// PdfDownloadLog.pdfSnapshot) admin can pull up later even after the user
// deletes the resume itself. The body is optional: if it's missing (an
// older client, or a non-PDF/oversized payload) the download and its count
// still go through, just without a re-downloadable snapshot for this row.
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

    let pdfBuffer;
    if (req.headers.get("content-type") === "application/pdf") {
      const bytes = await req.arrayBuffer();
      // Sanity-check it's actually a PDF and not, say, an empty/aborted
      // body — a snapshot is a nice-to-have, never worth failing the
      // download or its count over.
      if (bytes.byteLength > 0 && bytes.byteLength < 20 * 1024 * 1024) {
        pdfBuffer = Buffer.from(bytes);
      }
    }

    await recordPdfDownload(session.user.id, params.id, {
      resumeTitle: resume.title,
      templateId: resume.templateId,
      pdfBuffer,
    });
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
