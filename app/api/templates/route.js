import { NextResponse } from "next/server";
import { getMergedTemplateList } from "@/lib/templatesServer";

// force-dynamic: this has no cookies/headers, so Next would otherwise treat
// it as static and bake the template list in at build time — meaning a
// template created from the admin panel after deploy would never show up
// without a rebuild, defeating the entire point of it being DB-backed.
export const dynamic = "force-dynamic";

// Public catalog (metadata only, no `code`) — the built-in templates plus
// every active admin-created one. Backs the template gallery; the editor's
// live compiler fetches a single dynamic template's code separately via
// GET /api/templates/[templateId]/code, only when a resume actually uses it.
export async function GET() {
  const templates = await getMergedTemplateList();
  return NextResponse.json(templates);
}
