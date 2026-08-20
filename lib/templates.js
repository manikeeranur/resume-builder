// Client-safe: only the static built-in list and constants. Nothing here
// may import lib/db or lib/models/Template (directly or transitively) —
// this file is imported from client components (TemplateGalleryGrid,
// TemplateThumb, ...), and mongoose pulls in Node built-ins (net, tls,
// fs/promises) that don't exist in the browser and fail the webpack build.
// The DB-backed (dynamic template) lookups live in lib/templatesServer.js,
// a server-only sibling — see that file's header comment.
// Shared with lib/models/Template.js (the `category` enum) and the gallery's
// filter pills — kept here, not duplicated, since this file is already the
// client-safe source of truth for template metadata.
export const TEMPLATE_CATEGORIES = ["Professional", "Modern", "Creative", "Minimal", "Executive"];

// Shared <Select> options list (value/label pairs) for every category picker
// in the admin UI — the table's inline dropdowns and the full editor form.
export const TEMPLATE_CATEGORY_OPTIONS = [
  { value: "", label: "No category" },
  ...TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export const TEMPLATE_LIST = [
  { id: "template-1", name: "Template 1", available: true, premium: false, thumbnail: "/templates/template-1.png", category: "Modern" },
  { id: "template-2", name: "Template 2", available: true, premium: false, thumbnail: "/templates/template-2.png", category: "Professional" },
  // defaultColor seeds a new resume's theme so it starts out matching the
  // template's own reference design instead of the app-wide black default.
  { id: "template-3", name: "Template 3", available: true, premium: true, thumbnail: "/templates/template-3.png", defaultColor: "#1696bf", category: "Minimal" },
  { id: "template-4", name: "Template 4", available: true, premium: true, thumbnail: "/templates/template-4.png", defaultColor: "#1a5f4f", category: "Executive" },
  { id: "template-5", name: "Template 5", available: true, premium: true, thumbnail: "/templates/template-5.png", defaultColor: "#4a7097", category: "Creative" },
  { id: "template-6", name: "Template 6", available: true, premium: true, thumbnail: "/templates/template-6.png", defaultColor: "#1696bf", category: "Professional" },
];

// Same set lib/templatesServer.js's isFullBleedTemplate uses for built-ins.
export const FULL_BLEED_TEMPLATE_IDS = new Set(["template-3", "template-4", "template-5", "template-6"]);

export function getTemplate(id) {
  return TEMPLATE_LIST.find((t) => t.id === id) || TEMPLATE_LIST[0];
}
