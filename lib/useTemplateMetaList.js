"use client";

import { useEffect, useState } from "react";
import { TEMPLATE_LIST, getTemplate } from "./templates";

// Client-side counterpart to lib/templatesServer.js's getTemplateMeta —
// resolves a templateId against the full catalog (built-ins + admin-created
// templates), not just the 6 static built-ins getTemplate() alone knows
// about. Starts from the static list (instant, no network, no flash of
// empty state) and swaps in the merged one from GET /api/templates once it
// resolves, same pattern TemplateGalleryGrid already uses for the gallery.
export function useTemplateMetaList() {
  const [templates, setTemplates] = useState(TEMPLATE_LIST);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTemplates(data))
      .catch(() => {});
  }, []);

  return templates;
}

// Looks up one id in a resolved list. Falls back to getTemplate()'s
// built-ins-only behavior only if the id isn't in that list either — e.g.
// the merged fetch hasn't resolved yet, or genuinely failed.
export function resolveTemplateMeta(templates, id) {
  return templates.find((t) => t.id === id) || getTemplate(id);
}
