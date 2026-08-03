import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import { launchBrowser } from "@/lib/launchBrowser";
import { renderResumePdf } from "@/lib/renderResumePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// How many of the *stale* resumes render at once, as separate tabs on one
// shared browser (see cache check below — most requests render zero).
const CONCURRENCY = 3;

async function renderStale(browser, resumes, origin, req) {
  const rendered = {};
  let next = 0;
  async function worker() {
    while (next < resumes.length) {
      const resume = resumes[next++];
      try {
        const pdfBuffer = await renderResumePdf(browser, {
          resumeId: resume._id.toString(),
          templateId: resume.templateId,
          origin,
          req,
          pageRanges: "1",
        });
        rendered[resume._id.toString()] = pdfBuffer;
      } catch (err) {
        console.error(`Preview generation failed for resume ${resume._id}:`, err.message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, resumes.length) }, worker));
  return rendered;
}

// Dashboard-only batch endpoint. Serves each resume's cached page-1 PDF
// (previewPdf) so a dashboard visit is normally just a DB read — Puppeteer
// only runs for resumes whose content changed since their preview was last
// generated (previewGeneratedAt < updatedAt), and even then on one shared
// browser instance instead of one per card.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No resume ids provided" }, { status: 400 });
  }

  await dbConnect();
  const resumes = await Resume.find({ _id: { $in: ids }, userId: session.user.id }).select(
    "+previewPdf +previewGeneratedAt"
  );

  const previews = {};
  const stale = [];
  for (const resume of resumes) {
    const isFresh = resume.previewPdf && resume.previewGeneratedAt && resume.previewGeneratedAt >= resume.updatedAt;
    if (isFresh) {
      previews[resume._id.toString()] = resume.previewPdf.toString("base64");
    } else {
      stale.push(resume);
    }
  }

  if (stale.length > 0) {
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;
    let browser = null;
    try {
      browser = await launchBrowser();
      const rendered = await renderStale(browser, stale, origin, req);
      await Promise.all(
        Object.entries(rendered).map(([id, buffer]) =>
          // timestamps: false is load-bearing here: without it, mongoose's
          // auto-bumped updatedAt races previewGeneratedAt (two separate
          // `new Date()` calls, and updatedAt is set slightly later at query
          // execution), so previewGeneratedAt >= updatedAt below can come out
          // false immediately — the cache never sticks and every dashboard
          // visit re-renders through Puppeteer again regardless.
          Resume.updateOne({ _id: id }, { previewPdf: buffer, previewGeneratedAt: new Date() }, { timestamps: false })
        )
      );
      for (const [id, buffer] of Object.entries(rendered)) {
        previews[id] = buffer.toString("base64");
      }
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  return NextResponse.json({ previews }, { headers: { "Cache-Control": "no-store" } });
}
