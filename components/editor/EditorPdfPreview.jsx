"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Editor's right-hand preview: the real PDF, one page at a time with
// Prev/Next when it runs longer than a page. Re-fetched after each autosave (`version`);
// while a new one is generating the previous PDF stays on screen with a
// small spinner instead of flashing a placeholder.
export default function EditorPdfPreview({ resume, version }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(380);
  const [pdf, setPdf] = useState(null); // { bytes, version }
  const [numPages, setNumPages] = useState(0);
  const [updating, setUpdating] = useState(true);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(1);
  // Fit the whole A4 page in view — never scroll inside the preview: the page
  // is as wide as the column allows, but no taller than the viewport minus
  // the sticky offset, the "Preview" label, the pager and the caption.
  useEffect(() => {
    const measure = () => {
      // The column sizes itself to the page (no side gaps), capped at 40% of the window.
      const byWidth = window.innerWidth * 0.4 - 16;
      // Shell navbar (67) + TopBar + page padding + "Preview" label + caption (+ pager).
      const reserved = numPages > 1 ? 340 : 290;
      const byHeight = (window.innerHeight - reserved) * (210 / 297);
      setWidth(Math.max(200, Math.floor(Math.min(byWidth, byHeight))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [numPages, pdf]);

  useEffect(() => {
    const ctrl = new AbortController();
    setUpdating(true);
    fetch(`/api/resumes/${resume._id}/pdf`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`PDF ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        setPdf({ bytes: new Uint8Array(buf), version });
        setFailed(false);
        setUpdating(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setFailed(true);
        setUpdating(false);
      });
    // A newer save supersedes an in-flight render.
    return () => ctrl.abort();
  }, [resume._id, version]);

  // pdf.js detaches the buffer it's given, so the {data} object must stay
  // stable per fetched PDF (a fresh literal each render would re-transfer it).
  const file = useMemo(() => (pdf ? { data: pdf.bytes.slice() } : null), [pdf]);

  const scroller = "inline-flex justify-center overflow-hidden rounded-lg border border-border bg-bg p-2";

  if (!file) {
    return (
      <div ref={containerRef} className={scroller}>
        <div className="flex items-center justify-center" style={{ width, aspectRatio: "210 / 297" }}>
          {failed ? (
            <span className="px-6 text-center text-xs font-semibold text-text-secondary">Couldn&apos;t load the preview.</span>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {numPages > 1 && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-border bg-white px-2 py-1.5">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(1, c - 1))}
            disabled={current <= 1}
            aria-label="Previous page"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs font-semibold text-text-secondary">
            Page {current} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(numPages, c + 1))}
            disabled={current >= numPages}
            aria-label="Next page"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    <div ref={containerRef} className={`relative ${scroller}`}>
      <Document
        file={file}
        onLoadSuccess={({ numPages: n }) => {
          setNumPages(n);
          setCurrent((c) => Math.min(c, n));
        }}
        loading={<div className="flex items-center justify-center" style={{ width, aspectRatio: "210 / 297" }}><Loading /></div>}
        error={<p className="py-12 text-center text-xs text-text-secondary">Couldn&apos;t load the preview.</p>}
      >
        {numPages > 0 && (
          <div className="overflow-hidden rounded bg-white shadow-md">
            <Page pageNumber={current} width={width} renderAnnotationLayer={false} renderTextLayer={false} />
          </div>
        )}
      </Document>
      {updating && (
        <span className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Updating preview" />
      )}
    </div>
    </div>
  );
}

function Loading() {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-text-secondary shadow-card-lg">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Loading preview…
    </span>
  );
}
