import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { requireAdmin } from "@/lib/requireAdmin";
import { generateTailwindPreviewCss } from "@/lib/generateTailwindPreviewCss";

// postcss + tailwindcss (via generateTailwindPreviewCss) need the Node runtime.
export const runtime = "nodejs";

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
//
// The response also carries `css`: the utility CSS for this template's
// exact class names, compiled on demand (see lib/generateTailwindPreviewCss).
// The app's built-once stylesheet only has rules for classes that existed
// at the last `next build`, so a class an admin adds to a template after a
// deploy would otherwise render unstyled for real users until the next
// deploy. ResumeDocument injects this `css` alongside the template so an
// edit goes live immediately, no redeploy. Memoised per exact source
// string so the Tailwind compile runs once per template version, not once
// per request.
const cssCache = new Map();
const CSS_CACHE_MAX = 64;

function sourceKey(code) {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = (h * 33) ^ code.charCodeAt(i);
  return `${code.length}:${h >>> 0}`;
}

async function cssForSource(code) {
  if (!code) return "";
  const key = sourceKey(code);
  if (cssCache.has(key)) return cssCache.get(key);

  let css = "";
  try {
    css = await generateTailwindPreviewCss(code);
  } catch (err) {
    // A compile failure here must not take down the code response — the
    // template still renders against the built-once stylesheet, same as
    // before this field existed.
    console.warn("Template CSS compile failed:", err.message);
  }

  if (cssCache.size >= CSS_CACHE_MAX) cssCache.clear();
  cssCache.set(key, css);
  return css;
}

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
  const css = await cssForSource(code);
  return NextResponse.json({ code, css }, { headers: { "Cache-Control": "no-store" } });
}
