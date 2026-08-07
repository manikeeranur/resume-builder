// Server-only: resolves admin-created (DB-backed) templates in addition to
// the static built-ins. NEVER import this from a "use client" file or a
// component that a client component renders directly — it pulls in
// mongoose, which fails the webpack client build (Node built-ins like
// net/tls/fs don't exist in the browser). Client code that needs template
// *metadata* fetches GET /api/templates instead; client code that needs
// template *code* fetches GET /api/templates/[templateId]/code (see
// lib/useDynamicTemplate.js) — neither needs to import this file.
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { TEMPLATE_LIST, FULL_BLEED_TEMPLATE_IDS } from "@/lib/templates";

function dynamicTemplateToMeta(doc) {
  return {
    id: doc.templateId,
    name: doc.name,
    available: true,
    premium: doc.premium,
    // Left empty (not defaulted to a built-in's image) when the admin
    // hasn't set one — TemplateThumb then falls through to live-rendering
    // this template via ScaledThumb instead of showing a wrong screenshot.
    thumbnail: doc.thumbnail || "",
    ...(doc.defaultColor ? { defaultColor: doc.defaultColor } : {}),
    dynamic: true,
  };
}

// Counterpart to getTemplate() that also resolves admin-created templates —
// used wherever a templateId needs validating against something a real user
// could have picked (premium-gate checks, full-bleed margin lookup), not
// just the 6 built-ins. Returns null if the id matches neither a built-in
// nor an active dynamic template.
export async function getTemplateMeta(id) {
  const builtin = TEMPLATE_LIST.find((t) => t.id === id);
  if (builtin) return builtin;

  await dbConnect();
  const doc = await Template.findOne({ templateId: id, active: true });
  return doc ? dynamicTemplateToMeta(doc) : null;
}

// The built-ins plus every active admin-created template, metadata only (no
// `code` — this is what powers the public template gallery, not the
// editor's compiler).
export async function getMergedTemplateList() {
  await dbConnect();
  const dynamicDocs = await Template.find({ active: true }).sort({ createdAt: 1 });
  return [...TEMPLATE_LIST, ...dynamicDocs.map(dynamicTemplateToMeta)];
}

// Resolves the print-margin rule for any templateId, built-in or dynamic —
// see FULL_BLEED_TEMPLATE_IDS / Template.fullBleed.
export async function isFullBleedTemplate(templateId) {
  if (FULL_BLEED_TEMPLATE_IDS.has(templateId)) return true;
  if (TEMPLATE_LIST.some((t) => t.id === templateId)) return false;

  await dbConnect();
  const doc = await Template.findOne({ templateId }).select("fullBleed");
  return Boolean(doc?.fullBleed);
}
