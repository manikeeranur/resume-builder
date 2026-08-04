"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { getTemplate } from "@/lib/templates";

// Loaded from CDN (matching the bundled pdfjs-dist version) since pdf.js
// needs its parsing/rendering work to run off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Shows page 1 of the real generated PDF (same file the download button
// produces), so it's pixel-exact to the actual first page instead of an
// approximated live DOM render. Reflects the currently-saved resume only —
// it won't update on every keystroke/setting change, since generating a real
// PDF that often would be too slow. Callers should remount it (e.g. via a
// changing `key`) once they know new data has actually been saved.
//
// `pdfData` lets a parent that already fetched bytes for several resumes at
// once (e.g. the dashboard's batch preview call) hand them down instead of
// every card making its own request. Its states: `undefined` (prop omitted
// entirely) means "no batch parent — fetch `/pdf` directly" (editor, theme
// modal); `null` means a batch parent is still loading it; `false` means
// that batch load failed; a Uint8Array means it's ready to render.
export default function ExactFirstPagePreview({ resume, pdfData }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(280);

  useEffect(() => {
    const measure = () => {
      // Rounded to a whole pixel: react-pdf renders a canvas at exactly
      // this width, and a fractional canvas width (offsetWidth can be
      // subpixel in modern browsers) has caused visible rendering seams
      // for some PDFs.
      if (containerRef.current) setWidth(Math.floor(containerRef.current.offsetWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const loading = (
    <div className="relative flex aspect-[210/297] items-center justify-center overflow-hidden bg-bg">
      {/* Static template preview image (same one used in the template
          gallery), so the wait shows an approximate layout instead of
          a blank box — cheaper than live-rendering the real content. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getTemplate(resume.templateId).thumbnail}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top opacity-25"
      />
      <span className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-text-secondary shadow-card-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Generating preview…
      </span>
    </div>
  );
  // Falls back to the template's own static preview image rather than an
  // error message — the exact rendered PDF failed to load, but the card
  // should still look like a resume, not show a broken-state notice.
  const error = (
    <div className="aspect-[210/297] overflow-hidden bg-bg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getTemplate(resume.templateId).thumbnail}
        alt=""
        className="h-full w-full object-cover object-top"
      />
    </div>
  );

  if (pdfData === null) return <div ref={containerRef} className="w-full overflow-hidden rounded-lg">{loading}</div>;
  if (pdfData === false) return <div ref={containerRef} className="w-full overflow-hidden rounded-lg">{error}</div>;

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg">
      <Document
        file={pdfData ? { data: pdfData } : `/api/resumes/${resume._id}/pdf`}
        loading={loading}
        error={error}
      >
        <Page pageNumber={1} width={width} />
      </Document>
    </div>
  );
}
