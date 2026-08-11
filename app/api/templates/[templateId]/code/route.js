import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { requireAdmin } from "@/lib/requireAdmin";

// Public: the client-side dynamic-template hook (lib/useDynamicTemplate.js)
// fetches this once per templateId to compile a component in the browser.
// A template still in draft (not yet published from the admin panel) is
// only served here to an admin — that's what lets the admin's own preview
// page (which renders through this same hook) show unpublished work, while
// a real user's resume can never end up pointing at draft code.
//
// ?draft=1 serves draftCode (the admin editor's unsaved keystrokes, written
// by app/api/admin/templates/[id]/draft) instead of the saved `code`,
// always gated on an admin session regardless of `active` — this is only
// ever hit by the admin's own PDF preview pipeline, never a real resume.
export async function GET(req, { params }) {
  const wantsDraft = new URL(req.url).searchParams.get("draft") === "1";

  await dbConnect();
  const doc = await Template.findOne({ templateId: params.templateId }).select("code draftCode active");
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wantsDraft || !doc.active) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const code = wantsDraft && doc.draftCode ? doc.draftCode : doc.code;
  return NextResponse.json({ code }, { headers: { "Cache-Control": "no-store" } });
}
