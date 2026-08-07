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
export async function GET(req, { params }) {
  await dbConnect();
  const doc = await Template.findOne({ templateId: params.templateId }).select("code active");
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!doc.active) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ code: doc.code }, { headers: { "Cache-Control": "no-store" } });
}
