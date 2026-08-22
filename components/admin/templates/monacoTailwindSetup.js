// Wires the real Tailwind CSS language service (the same engine the official
// VS Code "Tailwind CSS IntelliSense" extension uses) into a self-hosted
// Monaco instance: className autocomplete, hover previews showing the
// generated CSS, and color swatches. Only ever imported from inside the
// ssr:false dynamic import in TemplateCodeEditor.jsx, so everything here is
// browser-only. Pinned to monaco-editor 0.52.2 (see package.json) — newer
// 0.5x releases restructured monaco.contribution.js to no longer populate
// the classic `monaco.languages.css`/`.typescript` namespace that both
// configureMonacoTailwindcss and this file's own setup rely on, and that
// monaco-tailwindcss itself (last published against the older API) expects.
import * as monaco from "monaco-editor";
// monaco-editor's ESM entry point is the bare editor core — each language's
// features (here, `monaco.languages.css`/`.typescript`) only exist once that
// language's own contribution module has been imported for side effects,
// same as the classic AMD editor.main.js bundle did by requiring every
// language upfront.
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import { configureMonacoTailwindcss, tailwindcssData } from "monaco-tailwindcss";
import tailwindConfig from "../../../tailwind.config.js";
// Self-hosting monaco-editor (rather than @monaco-editor/react's default CDN
// load): most widgets' CSS is already pulled in by their own ESM modules,
// but the codicon icon font (@font-face + glyph classes, used by the
// suggestion/hover widgets) isn't, so it's imported explicitly here.
import "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css";

let configured = false;

// Mirrors the Webpack 5 worker registration from monaco-tailwindcss's own
// docs: each language gets its own worker script, loaded as a real module
// worker via `new URL(..., import.meta.url)` so Next's bundler emits it as
// a separate chunk instead of trying to run it on the main thread.
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    switch (label) {
      case "editorWorkerService":
        return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url));
      case "css":
      case "less":
      case "scss":
        return new Worker(new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url));
      case "javascript":
      case "typescript":
        return new Worker(new URL("monaco-editor/esm/vs/language/typescript/ts.worker", import.meta.url));
      case "tailwindcss":
        return new Worker(new URL("monaco-tailwindcss/tailwindcss.worker", import.meta.url));
      default:
        throw new Error(`Unknown Monaco worker label: ${label}`);
    }
  },
};

// tailwind.config.js only contains plain strings/arrays/objects (no plugin
// functions), so it's safe to hand straight to the Tailwind worker as-is —
// same color/spacing/radius scale the app itself renders with, right down
// to the CSS-variable-backed brand colors.
export function ensureMonacoTailwindConfigured() {
  if (configured) return monaco;
  configured = true;

  monaco.languages.css.cssDefaults.setOptions({
    data: { dataProviders: { tailwindcssData } },
  });

  configureMonacoTailwindcss(monaco, {
    languageSelector: ["javascript", "typescript"],
    tailwindConfig,
  });

  return monaco;
}

export { monaco };
