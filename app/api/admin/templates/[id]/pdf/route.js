import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { requireAdmin } from "@/lib/requireAdmin";
import { launchBrowser } from "@/lib/launchBrowser";
import { renderPageToPdf } from "@/lib/renderResumePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Renders the exact same way a real user's download would — Puppeteer
// printing app/admin/templates/preview/[templateId], which runs the saved
// template's code through the same compiler + sample data. Reflects the
// last *saved* version, not unsaved keystrokes in the editor (matching how
// ExactFirstPagePreview/PdfViewer already work for real resumes) — save
// first, then regenerate this preview.
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const template = await Template.findById(params.id).select("templateId fullBleed");
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  let browser = null;
  try {
    browser = await launchBrowser();
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;

    const pdfBuffer = await renderPageToPdf(browser, {
      url: `${origin}/admin/templates/preview/${template.templateId}`,
      origin,
      req,
      fullBleed: template.fullBleed,
    });

    // Puppeteer's page.pdf() can succeed (no throw) yet hand back something
    // that isn't a real PDF — e.g. if #resume-content existed but the page
    // was mid-navigation/erroring — so check the magic bytes rather than
    // trust a 200 alone; otherwise the client only learns something's wrong
    // from pdf.js's opaque "Couldn't render this PDF" parse failure.
    if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      console.error(
        `Template PDF preview produced invalid output for template ${template.templateId}: ${pdfBuffer.length} bytes, starts with ${pdfBuffer.subarray(0, 20).toString("latin1")}`
      );
      throw new Error("Puppeteer did not return a valid PDF — check the server log for the preview page's actual output.");
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Template PDF preview error:", err.message);
    return NextResponse.json({ error: "Failed to generate preview", detail: err.message }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}
