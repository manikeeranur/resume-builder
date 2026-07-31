"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Loaded from CDN (matching the bundled pdfjs-dist version) since pdf.js
// needs its parsing/rendering work to run off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Shows page 1 of the real generated PDF (same file the download button
// produces), so it's pixel-exact to the actual first page instead of an
// approximated live DOM render. Reflects the currently-saved resume only —
// it won't update on every keystroke/setting change, since generating a real
// PDF that often would be too slow. Callers should remount it (e.g. via a
// changing `key`) once they know new data has actually been saved.
export default function ExactFirstPagePreview({ resumeId }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(280);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-lg border border-border shadow-sm">
      <Document
        file={`/api/resumes/${resumeId}/pdf`}
        loading={
          <div className="flex aspect-[210/297] items-center justify-center bg-bg">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-text-secondary shadow-card-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Generating preview…
            </span>
          </div>
        }
        error={<div className="flex aspect-[210/297] items-center justify-center bg-bg text-xs text-red-500">Couldn't load preview.</div>}
      >
        <Page pageNumber={1} width={width} />
      </Document>
    </div>
  );
}
