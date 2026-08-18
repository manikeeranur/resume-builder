import postcss from "postcss";
import tailwindcss from "tailwindcss";
import baseConfig from "../tailwind.config.js";

// Tailwind's real CSS (imported once via app/layout.js's globals.css) is
// generated a single time, at `next build` — see lib/templateClassScan.js
// for the full explanation. That's fine for classes already present when
// the app was last deployed, but an admin typing a *new* Tailwind class into
// the template code editor won't see it until the next deploy: production
// has no dev-server watcher to notice and recompile, and the scan file's
// runtime regeneration (regenerateTemplateClassScan) silently no-ops on
// Vercel's read-only filesystem outside /tmp.
//
// This compiles just the utility CSS for one template's exact source,
// on demand, at request time — reusing the app's real theme (CSS
// var-backed colors, fonts, etc. from tailwind.config.js) so the output
// matches what a full rebuild would eventually produce for the same class
// names. Only ever needs `@tailwind utilities` — base/components are
// already covered by the app's built-once stylesheet.
export async function generateTailwindPreviewCss(source) {
  if (!source) return "";

  const config = {
    ...baseConfig,
    content: [{ raw: source, extension: "jsx" }],
  };

  const result = await postcss([tailwindcss(config)]).process("@tailwind utilities;", { from: undefined });
  return result.css;
}
