import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PdfDownloadLog from "@/lib/models/PdfDownloadLog";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

// Serves the exact PDF a user downloaded, straight from the permanent
// snapshot captured at download time (see PdfDownloadLog.pdfSnapshot) —
// works even after the source resume has since been deleted, since nothing
// here needs to regenerate it.
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const log = await PdfDownloadLog.findById(params.id).select("+pdfSnapshot resumeTitle");
  if (!log || !log.pdfSnapshot) {
    return NextResponse.json({ error: "No PDF snapshot saved for this download" }, { status: 404 });
  }

  const filename = `${(log.resumeTitle || "Resume").replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  return new NextResponse(log.pdfSnapshot, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(log.pdfSnapshot.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
