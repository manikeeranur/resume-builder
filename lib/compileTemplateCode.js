import { transform } from "sucrase";
import React from "react";
import { Mail, Phone } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { totalExperienceDuration } from "@/lib/experienceDuration";
import * as helpers from "@/components/templates/helpers";

// Everything a template's code can reference as a bare identifier, beyond
// React itself — the ./helpers exports every built-in imports, plus the
// specific icons/lib functions Template2/3/6 import from lucide-react,
// @tabler/icons-react and lib/experienceDuration. Named (not `import *`) so
// only these few tree-shake into the bundle, not either icon library whole
// — this scope is evaluated for every dynamic template a real user's resume
// renders, not just in the admin editor.
const SCOPE = { ...helpers, Mail, Phone, IconBrandGithub, IconBrandLinkedin, totalExperienceDuration };
const SCOPE_NAMES = Object.keys(SCOPE);

export class TemplateCompileError extends Error {}

// Compiles admin-authored JSX template source into a renderable React
// component. Runs identically in the browser (the admin editor's live
// preview) and in Node (the print page / PDF pipeline) — sucrase's JSX
// transform has no DOM or bundler dependency either way, so a template
// created in the admin panel needs no build step to go live.
//
// Templates can't `import` anything (there's no bundler at this point) —
// any `import ... from "...";` statement (single- or multi-line, e.g. a
// wrapped `import { a, b, c } from "...";`) is stripped so an admin can
// paste an existing Template*.jsx file's body in verbatim. SCOPE above
// covers every name the built-ins actually import, injected instead, so
// template code can reference them as bare identifiers exactly like the
// built-ins do.
//
// Trust boundary: this evaluates the stored code with `new Function`. Only
// admins (server-checked via requireAdmin on every write route) can ever
// get code into the `code` field, so this is equivalent to any other
// admin-only server capability — never wire a non-admin write path to it.
export function compileTemplateComponent(rawCode) {
  if (typeof rawCode !== "string" || !rawCode.trim()) {
    throw new TemplateCompileError("Template code is empty.");
  }

  const withoutImports = rawCode.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*\n/gm, "");

  let transformed;
  try {
    transformed = transform(withoutImports, { transforms: ["jsx"], jsxRuntime: "classic" }).code;
  } catch (err) {
    throw new TemplateCompileError(`Syntax error: ${err.message}`);
  }

  if (!/export\s+default\s+/.test(transformed)) {
    throw new TemplateCompileError('Template code must have an "export default function ...(...) { }" component.');
  }
  const body = transformed.replace(/export\s+default\s+/, "return ");

  let factory;
  try {
    // eslint-disable-next-line no-new-func
    factory = new Function("React", ...SCOPE_NAMES, `"use strict";\n${body}`);
  } catch (err) {
    throw new TemplateCompileError(`Syntax error: ${err.message}`);
  }

  let Component;
  try {
    Component = factory(React, ...SCOPE_NAMES.map((name) => SCOPE[name]));
  } catch (err) {
    throw new TemplateCompileError(`Failed to evaluate template: ${err.message}`);
  }

  if (typeof Component !== "function") {
    throw new TemplateCompileError("Template's default export must be a function component.");
  }

  return Component;
}
