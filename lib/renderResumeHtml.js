import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createElement, Fragment } from "react";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import baseConfig from "../tailwind.config.js";
import Template1 from "@/components/templates/Template1";
import Template2 from "@/components/templates/Template2";
import Template3 from "@/components/templates/Template3";
import Template4 from "@/components/templates/Template4";
import Template5 from "@/components/templates/Template5";
import Template6 from "@/components/templates/Template6";
import Watermark from "@/components/templates/Watermark";

// Server-side resume HTML for PDF/PNG export — the same idea as a
// Jinja + WeasyPrint pipeline: render the template to an HTML string on the
// server, inline exactly the CSS it needs, and hand that string straight to
// Chromium (page.setContent). Previously Chromium navigated back into the
// app's own /resumes/[id]/print page over HTTP, which re-ran auth + DB
// lookups, downloaded and hydrated the whole client bundle, and waited on
// 23 Google Font families. Built-in templates only: admin-created templates
// are compiled in the browser (lib/useDynamicTemplate.js) and keep using the
// /print page.

// Next forbids importing react-dom/server into the server (RSC) graph, so it
// is loaded with Node's own require, outside the bundle. Safe here because
// the built-in templates are plain components (no hooks/context): the
// elements they produce are ordinary React elements any renderer accepts.
const nodeRequire = eval("require");
const renderToStaticMarkup = (el) => nodeRequire("react-dom/server").renderToStaticMarkup(el);

const TEMPLATES = {
  "template-1": Template1,
  "template-2": Template2,
  "template-3": Template3,
  "template-4": Template4,
  "template-5": Template5,
  "template-6": Template6,
};

export const isServerRenderable = (templateId) => templateId in TEMPLATES;

const GLOBALS_PATH = path.join(process.cwd(), "app", "globals.css");
const g = globalThis;

// globals.css split into: the Google Fonts @import (families resolved per
// resume below) and the rest (tailwind directives, :root vars, components).
async function loadGlobals() {
  if (g.__resumeGlobals) return g.__resumeGlobals;
  const src = await readFile(GLOBALS_PATH, "utf8");
  const m = src.match(/@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com\/css2\?[^"')]+)["']?\);?/);
  const fontUrl = m ? m[1] : null;
  const families = fontUrl
    ? new URL(fontUrl).searchParams.getAll("family").map((spec) => ({ spec, name: spec.split(":")[0].replace(/\+/g, " ") }))
    : [];
  g.__resumeGlobals = { css: m ? src.replace(m[0], "") : src, families };
  return g.__resumeGlobals;
}

// Tailwind compiled for just the classes in this HTML. A template's class set
// rarely changes between renders (only the text does), so the result is
// cached by the set of class names.
const cssCache = g.__resumeCssCache ?? (g.__resumeCssCache = new Map());
async function compileCss(html, globalsCss) {
  const classes = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c);
  const key = createHash("sha1").update([...classes].sort().join(" ")).digest("hex");
  const hit = cssCache.get(key);
  if (hit) return hit;
  const config = { ...baseConfig, content: [{ raw: html, extension: "html" }] };
  const result = await postcss([tailwindcss(config)]).process(globalsCss, { from: GLOBALS_PATH });
  if (cssCache.size > 100) cssCache.clear();
  cssCache.set(key, result.css);
  return result.css;
}

// Only the font families this resume actually uses (by name, in its markup
// or compiled CSS) instead of all 23.
function fontLink(families, haystack) {
  const used = families.filter((f) => haystack.includes(f.name));
  if (!used.length) return "";
  const qs = used.map((f) => `family=${f.spec}`).join("&");
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${qs}&display=block">`;
}

export async function renderResumeHtml(resume, { watermark = false, watermarkText = "ResumePro" } = {}) {
  const Template = TEMPLATES[resume.templateId];
  if (!Template) throw new Error(`Template ${resume.templateId} is not server-renderable`);
  const markup = renderToStaticMarkup(
    createElement(Fragment, null, createElement(Template, { resume }), watermark ? createElement(Watermark, { text: watermarkText }) : null)
  );
  const { css: globalsCss, families } = await loadGlobals();
  const css = await compileCss(markup, globalsCss);
  // Same wrapper as app/resumes/[id]/print/page.jsx.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${fontLink(families, markup + css)}<style>${css}</style></head><body><div style="background:#fff;min-height:100vh">${markup}</div></body></html>`;
}
