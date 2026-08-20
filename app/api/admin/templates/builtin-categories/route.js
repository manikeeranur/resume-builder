import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TemplateOverride from "@/lib/models/TemplateOverride";
import { requireAdmin } from "@/lib/requireAdmin";

// { templateId: category } for every built-in that's been re-tagged — the
// admin templates table merges this into TEMPLATE_LIST's hardcoded defaults
// so an override shows up immediately without a redeploy.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const overrides = await TemplateOverride.find();
  const map = Object.fromEntries(overrides.map((o) => [o.templateId, o.category || null]));
  return NextResponse.json(map);
}
