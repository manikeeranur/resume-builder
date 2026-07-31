"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Loaded from CDN (matching the bundled pdfjs-dist version) since pdf.js
// needs its parsing/rendering work to run off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MAX_PAGE_WIDTH_PX = 820;

export default function PdfViewer({ resumeId }) {
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH_PX);
  const containerRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setPageWidth(Math.min(MAX_PAGE_WIDTH_PX, containerRef.current.offsetWidth - 32));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-bg">
      <div className="flex flex-col items-center gap-6 py-6">
        {/* Renders the exact same PDF the download button produces, drawn
            onto our own canvases instead of the browser's native (and
            theme-following) PDF viewer, so the surrounding chrome always
            stays light regardless of system dark mode. */}
        <Document
          key={resumeId}
          file={`/api/resumes/${resumeId}/pdf`}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={<p className="py-12 text-sm text-text-secondary">Generating preview…</p>}
          error={<p className="py-12 text-sm text-red-500">Couldn't load the PDF preview.</p>}
        >
          {numPages &&
            Array.from({ length: numPages }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="bg-white shadow-lg">
                  <Page pageNumber={i + 1} width={pageWidth} />
                </div>
                <span className="text-[11px] font-medium text-text-secondary">
                  Page {i + 1} of {numPages}
                </span>
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
