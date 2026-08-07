"use client";

import { useEffect, useState } from "react";
import { compileTemplateComponent, TemplateCompileError } from "@/lib/compileTemplateCode";

// Module-level (not per-component) cache: every ResumeDocument instance for
// the same templateId — dashboard cards, the editor's ScaledPreview, the
// print page — shares one fetch+compile instead of each doing its own.
const cache = new Map();
const listeners = new Map();

function notify(templateId) {
  listeners.get(templateId)?.forEach((fn) => fn());
}

function load(templateId) {
  if (cache.has(templateId)) return;
  const entry = { status: "loading", Component: null, error: null };
  cache.set(templateId, entry);

  fetch(`/api/templates/${templateId}/code`, { cache: "no-store" })
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
    .finally(() => notify(templateId));
}

// Fetches + compiles an admin-created template's JSX by id, on demand, in
// the browser — see lib/compileTemplateCode.js for how the code string
// becomes a component. Pass `null` when the caller already resolved a
// built-in (static) component, so no network request happens for the
// common case.
export function useDynamicTemplate(templateId) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!templateId) return;
    load(templateId);
    const fn = () => tick((n) => n + 1);
    if (!listeners.has(templateId)) listeners.set(templateId, new Set());
    listeners.get(templateId).add(fn);
    return () => listeners.get(templateId)?.delete(fn);
  }, [templateId]);

  if (!templateId) return { status: "idle", Component: null, error: null };
  return cache.get(templateId) || { status: "loading", Component: null, error: null };
}
