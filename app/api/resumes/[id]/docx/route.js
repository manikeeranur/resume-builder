import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { buildResumeDocx } from "@/lib/buildDocx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const buffer = await buildResumeDocx(resume.toObject());
    const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("DOCX generation error:", err.message);
    return NextResponse.json({ error: "Failed to generate DOCX", detail: err.message }, { status: 500 });
  }
}
