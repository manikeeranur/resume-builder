"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ArrowLeft, Save, RefreshCw, Trash2, Check, Sparkles, FileCode2, Palette, Image as ImageIcon } from "lucide-react";
import { compileTemplateComponent } from "@/lib/compileTemplateCode";
import { fetchJson } from "@/lib/fetchJson";
import { NEW_TEMPLATE_BOILERPLATE } from "@/lib/templateBoilerplate";
import TemplateCodeEditor from "./TemplateCodeEditor";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const EMPTY_FORM = {
  name: "",
  templateId: "",
  code: NEW_TEMPLATE_BOILERPLATE,
  thumbnail: "",
  premium: false,
  defaultColor: "",
  fullBleed: false,
  active: false,
};

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// The real thing: asks the server to Puppeteer-print this template
// (app/api/admin/templates/[id]/pdf, which points at
// app/admin/templates/preview/[templateId] — the exact same rendering path
// a real user's download goes through). Auto-regenerates ~1.2s after the
// admin stops typing — a Puppeteer launch is much heavier than an in-browser
// recompile, so this debounce is longer than the code editor's own — and
// serialized: a render already in flight is left to finish, and at most one
// more (with the latest code) is queued behind it, rather than piling up
// concurrent Chromium launches while the admin keeps typing. Renders
// against ?draft=1 (mirrored into draftCode/draftFullBleed by [id]/draft)
// so it never needs an explicit Save first.
function AutoPdfPreviewPane({ templateDocId, code, fullBleed }) {
  const [state, setState] = useState({ status: "idle", data: null, error: null, numPages: null });
  const runningRef = useRef(false);
  const pendingRef = useRef(null);

  // react-pdf's <Document file={...}> reloads from scratch whenever it gets
  // a *new object reference*, even if the bytes inside are identical — so
  // `file={{ data: state.data }}` written inline would mint a fresh object
  // every render, and onLoadSuccess below (which sets numPages) itself
  // triggers a re-render, creating a reload loop that aborts the in-flight
  // parse and shows as "Couldn't render this PDF" instead of ever settling.
  // Memoizing on state.data keeps the same object across those re-renders.
  const file = useMemo(() => (state.data ? { data: state.data } : null), [state.data]);

  useEffect(() => {
    const run = async (payload) => {
      try {
        compileTemplateComponent(payload.code);
      } catch (err) {
        setState({ status: "error", data: null, error: err.message, numPages: null });
        return;
      }

      runningRef.current = true;
      setState((s) => ({ ...s, status: "loading", error: null }));
      try {
        await fetch(`/api/admin/templates/${templateDocId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const res = await fetch(`/api/admin/templates/${templateDocId}/pdf?draft=1`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          let message;
          try {
            message = JSON.parse(text).error;
          } catch {
            message = text.slice(0, 300);
          }
          throw new Error(message || `Failed to generate PDF preview (HTTP ${res.status} ${res.statusText})`);
        }
        const buf = await res.arrayBuffer();
        setState({ status: "ready", data: new Uint8Array(buf), error: null, numPages: null });
      } catch (err) {
        setState({ status: "error", data: null, error: err.message, numPages: null });
      } finally {
        runningRef.current = false;
        if (pendingRef.current) {
          const next = pendingRef.current;
          pendingRef.current = null;
          run(next);
        }
      }
    };

    const payload = { code, fullBleed };
    const t = setTimeout(() => {
      if (runningRef.current) pendingRef.current = payload;
      else run(payload);
    }, 1200);

    return () => clearTimeout(t);
  }, [templateDocId, code, fullBleed]);

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <RefreshCw size={13} className={state.status === "loading" ? "animate-spin text-primary" : ""} />
        {state.status === "loading" ? "Rendering PDF…" : "Auto-updates a moment after you stop editing."}
      </p>

      {state.status === "error" && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      {state.status === "ready" && (
        <div className="mt-4 max-h-[80vh] overflow-auto">
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setState((s) => (s.numPages === numPages ? s : { ...s, numPages }))}
            loading={<p className="p-6 text-center text-sm text-text-secondary">Loading PDF…</p>}
            error={<p className="p-6 text-center text-sm text-red-500">Couldn't render this PDF.</p>}
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: state.numPages || 1 }, (_, i) => (
                <div key={i} className="shadow-lg">
                  <Page pageNumber={i + 1} width={480} />
                </div>
              ))}
            </div>
          </Document>
        </div>
      )}
    </div>
  );
}

export default function TemplateEditorForm({ templateDocId }) {
  const router = useRouter();
  const isNew = templateDocId === "new";

  const [form, setForm] = useState(EMPTY_FORM);
  const [savedDoc, setSavedDoc] = useState(null);
  const [templateIdTouched, setTemplateIdTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetchJson(`/api/admin/templates/${templateDocId}`)
      .then((data) => {
        setForm({
          name: data.name,
          templateId: data.templateId,
          code: data.code,
          thumbnail: data.thumbnail || "",
          premium: data.premium,
          defaultColor: data.defaultColor || "",
          fullBleed: data.fullBleed,
          active: data.active,
        });
        setSavedDoc(data);
      })
      .catch((err) => setSaveError(err.message))
      .finally(() => setLoading(false));
  }, [isNew, templateDocId]);

  const setField = (key, value) => {
    setSavedAt(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleNameChange = (name) => {
    setSavedAt(null);
    setForm((f) => ({ ...f, name, ...(isNew && !templateIdTouched ? { templateId: slugify(name) } : {}) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const url = isNew ? "/api/admin/templates" : `/api/admin/templates/${templateDocId}`;
      const method = isNew ? "POST" : "PATCH";
      const payload = isNew
        ? form
        : {
            name: form.name,
            code: form.code,
            thumbnail: form.thumbnail,
            premium: form.premium,
            defaultColor: form.defaultColor,
            fullBleed: form.fullBleed,
            active: form.active,
          };

      const data = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSavedDoc(data);
      setSavedAt(Date.now());
      if (isNew) router.replace(`/admin/templates/${data._id}`);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/templates/${templateDocId}`, { method: "DELETE" });
      router.push("/admin/templates");
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <RefreshCw size={15} className="animate-spin" />
        Loading template…
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/templates" className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft size={13} /> Back to templates
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#8a7cf0] text-white shadow-[0_8px_20px_rgba(109,92,232,0.28)]">
            <FileCode2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-text">{isNew ? "New template" : form.name || form.templateId}</h1>
            {!isNew && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    form.active ? "bg-primary-light text-primary" : "bg-bg text-text-secondary"
                  }`}
                >
                  {form.active ? "Active" : "Draft"}
                </span>
                {form.premium && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">Premium</span>}
                <span className="font-mono text-[11px] text-text-secondary">{form.templateId}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={15} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name || !form.templateId}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>}
      {deleteError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}
      {savedAt && (
        <p className="mb-4 flex w-fit items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
          <Check size={13} /> Saved
        </p>
      )}

      <div className="card mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-bg/60 px-5 py-3">
          <Sparkles size={14} className="text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Template details</p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary">Name</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Minimal Two-Column" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary">Template ID</label>
            <input
              className="input-field mt-1 font-mono disabled:bg-bg disabled:text-text-secondary"
              value={form.templateId}
              disabled={!isNew}
              onChange={(e) => {
                setTemplateIdTouched(true);
                setField("templateId", slugify(e.target.value));
              }}
              placeholder="e.g. minimal-two-column"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
              <Palette size={12} /> Default color
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border p-1.5">
              <input
                type="color"
                className="h-7 w-9 cursor-pointer rounded-md border-0"
                value={form.defaultColor || "#6d5ce8"}
                onChange={(e) => setField("defaultColor", e.target.value)}
              />
              <span className="font-mono text-xs text-text-secondary">{form.defaultColor || "#6d5ce8"}</span>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
              <ImageIcon size={12} /> Thumbnail URL (optional)
            </label>
            <input className="input-field mt-1" value={form.thumbnail} onChange={(e) => setField("thumbnail", e.target.value)} placeholder="/templates/my-template.png" />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-2">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={form.premium} onChange={(e) => setField("premium", e.target.checked)} />
              Premium
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={form.fullBleed} onChange={(e) => setField("fullBleed", e.target.checked)} />
              Full-bleed (no print margin)
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={form.active} onChange={(e) => setField("active", e.target.checked)} />
              Active (visible to users)
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <FileCode2 size={14} className="text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Code</p>
          </div>
          <TemplateCodeEditor code={form.code} height={760} isDarkTheme onChange={(code) => setField("code", code)} />
        </div>

        <div className="lg:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Exact PDF preview</p>
          {savedDoc ? (
            <AutoPdfPreviewPane templateDocId={savedDoc._id} code={form.code} fullBleed={form.fullBleed} />
          ) : (
            <p className="text-sm text-text-secondary">Save once to enable the PDF preview — it auto-updates from there.</p>
          )}
        </div>
      </div>
    </div>
  );
}
