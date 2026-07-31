"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Loaded from CDN (matching the bundled pdfjs-dist version) since pdf.js
// needs its parsing/rendering work to run off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MAX_PAGE_WIDTH_PX = 820;
const THUMB_WIDTH_PX = 92;

export default function PdfViewer({ resumeId }) {
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH_PX);
  const [activePage, setActivePage] = useState(0);
  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setPageWidth(Math.min(MAX_PAGE_WIDTH_PX, containerRef.current.offsetWidth - 32));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Keep the thumbnail rail in sync when the user scrolls the main view by
  // hand, not just when they click a thumbnail: whichever page's top has
  // scrolled past the container's top edge (with a little headroom) is
  // treated as the active one.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !numPages || numPages < 2) return;
    let ticking = false;
    const updateActivePage = () => {
      ticking = false;
      const containerTop = container.getBoundingClientRect().top;
      let current = 0;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        if (el.getBoundingClientRect().top - containerTop <= 120) {
          current = i;
        }
      }
      setActivePage(current);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActivePage);
    };
    updateActivePage();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [numPages]);

  const jumpToPage = (i) => {
    setActivePage(i);
    pageRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    // Renders the exact same PDF the download button produces, drawn onto
    // our own canvases instead of the browser's native (and
    // theme-following) PDF viewer, so the surrounding chrome always stays
    // light regardless of system dark mode. Both the thumbnail rail and the
    // main pages below read from this single <Document>, so react-pdf
    // parses/loads the PDF only once and reuses it for every <Page>.
    <Document
      key={resumeId}
      file={`/api/resumes/${resumeId}/pdf`}
      onLoadSuccess={({ numPages: n }) => setNumPages(n)}
      loading={<p className="py-12 text-center text-sm text-text-secondary">Generating preview…</p>}
      error={<p className="py-12 text-center text-sm text-red-500">Couldn't load the PDF preview.</p>}
      className="flex h-full items-stretch"
    >
      {numPages > 1 && (
        <div className="hidden h-full w-28 shrink-0 overflow-y-auto border-r border-border bg-white px-3 py-4 lg:block">
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => (
              <button key={i} type="button" onClick={() => jumpToPage(i)} className="flex flex-col items-center gap-1.5">
                <div
                  className={`overflow-hidden rounded shadow transition-all ${
                    activePage === i ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50"
                  }`}
                >
                  <Page
                    pageNumber={i + 1}
                    width={THUMB_WIDTH_PX}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold ${activePage === i ? "text-primary" : "text-text-secondary"}`}
                >
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={containerRef} className="min-w-0 flex-1 overflow-y-auto bg-bg">
        <div className="flex flex-col items-center gap-6 py-6">
          {numPages &&
            Array.from({ length: numPages }, (_, i) => (
              <div key={i} ref={(el) => (pageRefs.current[i] = el)} className="flex flex-col items-center gap-1.5">
                <div className="bg-white shadow-lg">
                  <Page pageNumber={i + 1} width={pageWidth} />
                </div>
                <span className="text-[11px] font-medium text-text-secondary">
                  Page {i + 1} of {numPages}
                </span>
              </div>
            ))}
        </div>
      </div>
    </Document>
  );
}
