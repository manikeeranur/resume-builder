"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { javascript } from "@codemirror/lang-javascript";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { Check, Copy, Moon, Sun, X } from "lucide-react";
import { IconArrowsDiagonal } from "@tabler/icons-react";

// Ported from platform-fe's components/common/code-editor-display.tsx —
// same CodeMirror setup, copy/expand/theme-toggle chrome — trimmed to JSX
// only (templates are always JSX) and rebuilt without that project's
// CustomModalResponsive (a Radix Dialog wrapper resume-builder doesn't
// depend on); the "expand" modal below is a minimal standalone equivalent.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

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

  useEffect(() => {
    setValue(code);
  }, [code]);

  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  const copyCode = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChange = (nextValue) => {
    setValue(nextValue);
    onChange?.(nextValue);
  };

  const renderCodeBlock = (modal = false) => {
    const editorHeight = modal ? "75vh" : getHeightValue(height);

    return (
      <div
        className={`relative overflow-hidden rounded-xl border ${
          useDarkTheme ? "border-slate-700 bg-[#1e1e1e]" : "border-slate-200 bg-[#fafafa]"
        }`}
      >
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
          {isModeChange && (
            <button
              type="button"
              onClick={() => setUseDarkTheme((t) => !t)}
              className={`cursor-pointer rounded-md p-1.5 transition ${
                useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-[#fafafa] text-slate-500 hover:bg-slate-200"
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
              useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-[#fafafa] text-slate-500 hover:bg-slate-200"
            }`}
          >
            {modal ? <X size={16} /> : <IconArrowsDiagonal size={16} />}
          </button>

          <button
            type="button"
            onClick={() => void copyCode()}
            className={`cursor-pointer rounded-md p-1.5 transition ${
              useDarkTheme ? "bg-[#1e1e1e] text-slate-400 hover:bg-slate-700" : "bg-[#fafafa] text-slate-500 hover:bg-slate-200"
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <CodeMirror
          value={value}
          height={editorHeight}
          theme={useDarkTheme ? githubDark : githubLight}
          extensions={extensions}
          editable={editable}
          readOnly={!editable}
          onChange={handleChange}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, highlightSelectionMatches: false }}
          className="code-mirror-editor small-scrollbar"
        />

        <style jsx global>{`
          .code-mirror-editor {
            font-size: 12px;
          }
          .code-mirror-editor .cm-editor {
            min-height: ${editorHeight};
            background: transparent;
          }
          .code-mirror-editor .cm-focused {
            outline: none;
          }
          .code-mirror-editor .cm-scroller {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            scrollbar-width: thin;
            scrollbar-color: ${useDarkTheme ? "#475569" : "#cbd5e1"} transparent;
          }
          .code-mirror-editor .cm-content {
            padding: 16px 64px 16px 8px;
            line-height: 24px;
          }
          .code-mirror-editor .cm-gutters {
            background: ${useDarkTheme ? "#1e1e1e" : "#fafafa"};
            border-right: 1px solid ${useDarkTheme ? "#334155" : "#e5e7eb"};
          }
          .code-mirror-editor .cm-lineNumbers .cm-gutterElement {
            padding: 0 12px;
            color: ${useDarkTheme ? "#64748b" : "#94a3b8"};
          }
          .code-mirror-editor .cm-scroller::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .code-mirror-editor .cm-scroller::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: ${useDarkTheme ? "#475569" : "#cbd5e1"};
          }
          .code-mirror-editor .cm-scroller::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
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
