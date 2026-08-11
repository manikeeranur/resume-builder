"use client";

import { useEffect, useState } from "react";
import { compileTemplateComponent, TemplateCompileError } from "@/lib/compileTemplateCode";

// Module-level (not per-component) cache: every ResumeDocument instance for
// the same templateId — dashboard cards, the editor's ScaledPreview, the
// print page — shares one fetch+compile instead of each doing its own.
// Keyed separately for draft vs. saved so the admin editor's ?draft=1
// preview (see the `draft` option below) never clobbers the cached compiled
// component real users' resumes are reading for the same templateId.
const cache = new Map();
const listeners = new Map();

const cacheKey = (templateId, draft) => (draft ? `${templateId}:draft` : templateId);

function notify(key) {
  listeners.get(key)?.forEach((fn) => fn());
}

function load(templateId, draft) {
  const key = cacheKey(templateId, draft);
  if (cache.has(key)) return;
  const entry = { status: "loading", Component: null, error: null };
  cache.set(key, entry);

  fetch(`/api/templates/${templateId}/code${draft ? "?draft=1" : ""}`, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("This template is no longer available.");
      return res.json();
    })
    .then(({ code }) => {
      entry.Component = compileTemplateComponent(code);
      entry.status = "ready";
    })
    .catch((err) => {
      entry.status = "error";
      entry.error = err instanceof TemplateCompileError ? err.message : err.message || "Failed to load template";
    })
    .finally(() => notify(key));
}

// Fetches + compiles an admin-created template's JSX by id, on demand, in
// the browser — see lib/compileTemplateCode.js for how the code string
// becomes a component. Pass `null` when the caller already resolved a
// built-in (static) component, so no network request happens for the
// common case. `draft: true` fetches the admin editor's unsaved keystrokes
// (mirrored server-side by app/api/admin/templates/[id]/draft) instead of
// the saved `code` — only meaningful for the admin's own PDF preview page.
export function useDynamicTemplate(templateId, { draft = false } = {}) {
  const [, tick] = useState(0);
  const key = templateId ? cacheKey(templateId, draft) : null;

  useEffect(() => {
    if (!templateId) return;
    load(templateId, draft);
    const fn = () => tick((n) => n + 1);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
  }, [templateId, draft, key]);

  if (!templateId) return { status: "idle", Component: null, error: null };
  return cache.get(key) || { status: "loading", Component: null, error: null };
}
