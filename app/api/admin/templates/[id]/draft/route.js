import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { requireAdmin } from "@/lib/requireAdmin";
import { regenerateTemplateClassScan } from "@/lib/regenerateTemplateClassScan";

// Mirrors the admin editor's unsaved keystrokes into draftCode/draftFullBleed
// so the exact PDF preview can pick them up (see [id]/pdf's ?draft=1) without
// going through the real Save — no validation, no audit log, no updatedBy:
// this is scratch state, not a real change to the template.
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  await dbConnect();
  const template = await Template.findByIdAndUpdate(
    params.id,
    { draftCode: body.code, draftFullBleed: !!body.fullBleed },
    { new: true, select: "_id" }
  );
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  regenerateTemplateClassScan();

  return NextResponse.json({ success: true });
}
