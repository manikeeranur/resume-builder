"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy, Moon, Sun, X } from "lucide-react";
import { IconArrowsDiagonal } from "@tabler/icons-react";

// Monaco is the actual editor engine VS Code itself is built on (extracted
// as a standalone library) — not a CodeMirror lookalike. `vs-dark`/`light`
// below are VS Code's own built-in themes, shipped with Monaco verbatim,
// so this is the real VS Code editing experience: same JSX IntelliSense
// (via the embedded TypeScript language service), same minimap, same
// bracket-pair colorization, same keybindings. Dynamically imported with
// ssr:false since Monaco needs the DOM/web workers at load time.
//
// Self-hosting `monaco-editor` (instead of @monaco-editor/react's default
// CDN load) is what lets monacoTailwindSetup register the real Tailwind CSS
// language service — className autocomplete and hover-for-generated-CSS,
// same engine as VS Code's own Tailwind CSS IntelliSense extension — onto
// this exact editor instance. `loader.config({ monaco })` below must run,
// and Tailwind must be wired up, before `@monaco-editor/react`'s `Editor`
// resolves and mounts, or it falls back to fetching a bare Monaco from the
// CDN with no Tailwind support. Chaining it all inside this one dynamic
// import's promise (rather than e.g. a useEffect) guarantees that order.
const MonacoEditor = dynamic(
  async () => {
    const [reactMonaco, { ensureMonacoTailwindConfigured }] = await Promise.all([
      import("@monaco-editor/react"),
      import("./monacoTailwindSetup"),
    ]);
    const monaco = ensureMonacoTailwindConfigured();
    reactMonaco.loader.config({ monaco });
    return reactMonaco;
  },
  { ssr: false }
);

function ExpandModal({ onClose, children }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[70vw] max-w-[70vw]">{children}</div>
    </div>
  );
}

const getHeightValue = (height) => (typeof height === "number" ? `${height}px` : height);

// Templates are plain JSX (no TypeScript), but pointing Monaco's JS
// language service at a jsx-flavored path — plus the compiler options set
// in handleMount below — is what turns on real JSX IntelliSense instead of
// just generic JS highlighting (mirrors how VS Code itself treats .jsx
// files as "javascriptreact", not plain "javascript").
const MONACO_PATH = "template.jsx";

export default function TemplateCodeEditor({
  code,
  isDarkTheme = false,
  isModeChange = true,
  height = "100%",
  editable = true,
  onChange,
}) {
  const [value, setValue] = useState(code);
  const [copied, setCopied] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [useDarkTheme, setUseDarkTheme] = useState(isDarkTheme);
  const monacoRef = useRef(null);

  useEffect(() => {
    setValue(code);
  }, [code]);

  const copyCode = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChange = (nextValue) => {
    const next = nextValue ?? "";
    setValue(next);
    onChange?.(next);
  };

  // Runs once per mounted editor instance (the expanded modal gets its own),
  // enabling JSX IntelliSense — otherwise Monaco's default JS compiler
  // options don't know these .js-language models contain JSX and everything
  // under a JSX tag gets flagged as a syntax error.
  const handleMount = (editor, monaco) => {
    monacoRef.current = monaco;
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  };

  const renderCodeBlock = (modal = false) => {
    const editorHeight = modal ? "75vh" : getHeightValue(height);

    return (
      <div
        className={`relative overflow-hidden rounded-xl border ${
          useDarkTheme ? "border-slate-700 bg-[#1e1e1e]" : "border-slate-200 bg-white"
        }`}
      >
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
          {isModeChange && (
            <button
              type="button"
              onClick={() => setUseDarkTheme((t) => !t)}
              className={`cursor-pointer rounded-md p-1.5 transition ${
                useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-200"
              }`}
              aria-label={useDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
            >
              {useDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => (modal ? setOpenModal(false) : setOpenModal(true))}
            className={`cursor-pointer rounded-md p-1.5 transition ${
              useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-200"
            }`}
          >
            {modal ? <X size={16} /> : <IconArrowsDiagonal size={16} />}
          </button>

          <button
            type="button"
            onClick={() => void copyCode()}
            className={`cursor-pointer rounded-md p-1.5 transition ${
              useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-200"
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <MonacoEditor
          // Distinct path per instance — the base editor stays mounted
          // (just hidden) behind the expand modal, so sharing one path
          // would attach both editors to the same underlying Monaco model
          // and double-fire onChange for a single keystroke.
          path={modal ? `${MONACO_PATH}?modal` : MONACO_PATH}
          defaultLanguage="javascript"
          value={value}
          height={editorHeight}
          theme={useDarkTheme ? "vs-dark" : "light"}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            readOnly: !editable,
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineNumbers: "on",
            minimap: { enabled: !modal },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: "off",
            bracketPairColorization: { enabled: true },
            renderLineHighlight: "line",
            padding: { top: 16, bottom: 16 },
            // Monaco's JS/JSX language defaults to no quick-suggestions
            // inside string literals (most string content isn't code) — but
            // that's exactly where Tailwind className values live, so it's
            // turned back on here to match real VS Code's Tailwind
            // IntelliSense, which suggests classes as you type them.
            quickSuggestions: { other: true, comments: false, strings: true },
          }}
          loading={
            <div className="flex items-center justify-center text-sm text-text-secondary" style={{ height: editorHeight }}>
              Loading editor…
            </div>
          }
        />
      </div>
    );
  };

  return (
    <>
      {renderCodeBlock(false)}
      {openModal && <ExpandModal onClose={() => setOpenModal(false)}>{renderCodeBlock(true)}</ExpandModal>}
    </>
  );
}
