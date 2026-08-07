"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ArrowLeft, Save, RefreshCw, Trash2, Check } from "lucide-react";
import { compileTemplateComponent } from "@/lib/compileTemplateCode";
import { NEW_TEMPLATE_BOILERPLATE } from "@/lib/templateBoilerplate";
import { sampleResume } from "@/lib/sampleResume";
import { defaultThemeConfig } from "@/lib/resumeDefaults";
import { PAGE_MARGIN_PX } from "@/components/templates/helpers";
import TemplateErrorBoundary from "@/components/templates/TemplateErrorBoundary";
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

const BASE_WIDTH = 850;

// Instant, in-browser render of the current (possibly unsaved) code against
// sample data — recompiled ~400ms after the admin stops typing. This is
// separate from the exact PDF preview below: fast feedback here, pixel-exact
// output there (same Puppeteer pipeline real users' downloads go through).
function LivePreviewPane({ code, defaultColor }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);
  const [compiled, setCompiled] = useState({ Component: null, error: null });

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setCompiled({ Component: compileTemplateComponent(code), error: null });
      } catch (err) {
        setCompiled({ Component: null, error: err.message });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current || !contentRef.current) return;
      const nextScale = containerRef.current.offsetWidth / BASE_WIDTH;
      setScale(nextScale);
      setHeight(contentRef.current.scrollHeight * nextScale);
    };
    const t = setTimeout(recalc, 60);
    window.addEventListener("resize", recalc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", recalc);
    };
  }, [compiled.Component]);

  const previewResume = useMemo(
    () => ({
      ...sampleResume,
      templateId: "admin-preview",
      themeConfig: defaultColor ? { ...defaultThemeConfig, primaryColor: defaultColor } : defaultThemeConfig,
    }),
    [defaultColor]
  );

  if (compiled.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        <p className="font-semibold">Compile error</p>
        <p className="mt-1 whitespace-pre-wrap font-mono">{compiled.error}</p>
      </div>
    );
  }

  const Comp = compiled.Component;

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-border bg-white" style={{ height: height || undefined }}>
      {Comp && (
        <div
          ref={contentRef}
          style={{ width: BASE_WIDTH, paddingTop: PAGE_MARGIN_PX, paddingBottom: PAGE_MARGIN_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <TemplateErrorBoundary key={code}>
            <Comp resume={previewResume} />
          </TemplateErrorBoundary>
        </div>
      )}
    </div>
  );
}

// The real thing: asks the server to Puppeteer-print the last *saved*
// version of this template (app/api/admin/templates/[id]/pdf, which points
// at app/admin/templates/preview/[templateId] — the exact same rendering
// path a real user's download goes through). Reflects saved state only, so
// it needs an explicit refresh after each save, same as the rest of the app
// (see ExactFirstPagePreview's own note on this).
function PdfPreviewPane({ templateDocId }) {
  const [state, setState] = useState({ status: "idle", data: null, error: null, numPages: null });

  // react-pdf's <Document file={...}> reloads from scratch whenever it gets
  // a *new object reference*, even if the bytes inside are identical — so
  // `file={{ data: state.data }}` written inline would mint a fresh object
  // every render, and onLoadSuccess below (which sets numPages) itself
  // triggers a re-render, creating a reload loop that aborts the in-flight
  // parse and shows as "Couldn't render this PDF" instead of ever settling.
  // Memoizing on state.data keeps the same object across those re-renders.
  const file = useMemo(() => (state.data ? { data: state.data } : null), [state.data]);

  const generate = async () => {
    setState({ status: "loading", data: null, error: null, numPages: null });
    try {
      const res = await fetch(`/api/admin/templates/${templateDocId}/pdf`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate PDF preview");
      }
      const buf = await res.arrayBuffer();
      setState({ status: "ready", data: new Uint8Array(buf), error: null, numPages: null });
    } catch (err) {
      setState({ status: "error", data: null, error: err.message, numPages: null });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={generate}
        disabled={state.status === "loading"}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
      >
        <RefreshCw size={15} className={state.status === "loading" ? "animate-spin" : ""} />
        {state.status === "loading" ? "Rendering PDF…" : "Generate PDF preview"}
      </button>
      <p className="mt-1.5 text-xs text-text-secondary">Renders the last saved version. Save first, then generate.</p>

      {state.status === "error" && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      {state.status === "ready" && (
        <div className="mt-4 max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-bg p-4">
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setState((s) => (s.numPages === numPages ? s : { ...s, numPages }))}
            loading={<p className="p-6 text-center text-sm text-text-secondary">Loading PDF…</p>}
            error={<p className="p-6 text-center text-sm text-red-500">Couldn't render this PDF.</p>}
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: state.numPages || 1 }, (_, i) => (
                <div key={i} className="bg-white shadow-lg">
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
    fetch(`/api/admin/templates/${templateDocId}`)
      .then((r) => r.json())
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

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
      const res = await fetch(`/api/admin/templates/${templateDocId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push("/admin/templates");
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-text-secondary">Loading template…</p>;

  return (
    <div>
      <Link href="/admin/templates" className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft size={13} /> Back to templates
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text">{isNew ? "New template" : `Edit: ${form.name || form.templateId}`}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={15} />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name || !form.templateId}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}
      {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}
      {savedAt && (
        <p className="mb-4 flex items-center gap-1 text-xs font-semibold text-success">
          <Check size={13} /> Saved
        </p>
      )}

      <div className="card mb-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <label className="block text-xs font-semibold text-text-secondary">Default color</label>
          <input type="color" className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border" value={form.defaultColor || "#6d5ce8"} onChange={(e) => setField("defaultColor", e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary">Thumbnail URL (optional)</label>
          <input className="input-field mt-1" value={form.thumbnail} onChange={(e) => setField("thumbnail", e.target.value)} placeholder="/templates/my-template.png" />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2 lg:col-span-2">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Code</p>
          <TemplateCodeEditor code={form.code} height={640} onChange={(code) => setField("code", code)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Live preview</p>
          <LivePreviewPane code={form.code} defaultColor={form.defaultColor} />
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Exact PDF preview</p>
        {savedDoc ? (
          <PdfPreviewPane templateDocId={savedDoc._id} />
        ) : (
          <p className="text-sm text-text-secondary">Save the template first to generate a PDF preview.</p>
        )}
      </div>
    </div>
  );
}
