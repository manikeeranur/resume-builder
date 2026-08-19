"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { getTemplate } from "@/lib/templates";

// Loaded from CDN (matching the bundled pdfjs-dist version) since pdf.js
// needs its parsing/rendering work to run off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MAX_PAGE_WIDTH_PX = 820;
const PAGE_GAP_PX = 24;
const PAGINATION_BAR_HEIGHT_PX = 56;
// Every resume PDF is rendered at a fixed A4 size (see lib/renderResumePdf.js),
// so this ratio is known ahead of time and can be used to fit a page to the
// available height without waiting on pdf.js to report real page dimensions.
const PAGE_ASPECT_RATIO = 210 / 297;
const LARGE_SCREEN_QUERY = "(min-width: 1024px)";
// react-pdf renders its canvas at `width * devicePixelRatio` physical
// pixels, so on a standard (non-Retina) display — devicePixelRatio 1 — it
// only ever renders exactly as many pixels as the page is shown at,
// leaving no headroom and reading soft/blurry, especially for small body
// text. Flooring this at 2 forces that headroom everywhere, not just on
// high-DPI screens.
const MIN_RENDER_SCALE = 2;

// Shown in place of the real PDF while it's still generating: a small,
// centered box with the static template preview image faintly showing
// through (same image + style used everywhere else in the app the exact
// PDF is loading — dashboard cards, editor Live Preview, Theme modal).
function GhostPreview({ resume }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg">
      <div className="relative aspect-[210/297] w-56 overflow-hidden rounded-lg shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getTemplate(resume.templateId).thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-25"
        />
      </div>
      <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-text-secondary shadow-card-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Generating preview…
      </span>
    </div>
  );
}

export default function PdfViewer({ resume }) {
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH_PX);
  const [windowStart, setWindowStart] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [containerNode, setContainerNode] = useState(null);

  useEffect(() => {
    const mql = window.matchMedia(LARGE_SCREEN_QUERY);
    setIsLargeScreen(mql.matches);
    const onChange = (e) => setIsLargeScreen(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Large screens have room to show two pages side by side; small screens
  // only ever show one. Either way, once there's more page content than
  // fits in that window, it becomes a sliding window moved one page at a
  // time by the Prev/Next bar below — otherwise everything's already on
  // screen, so no controls are needed.
  const windowSize = isLargeScreen && numPages >= 2 ? 2 : 1;
  const paginated = numPages > windowSize;
  const maxWindowStart = Math.max(0, (numPages || 0) - windowSize);

  // The scrollable container only mounts once the PDF finishes loading
  // (GhostPreview stands in for it until then), so a plain mount-time
  // measurement would run against a still-null ref. Watching the node
  // itself with ResizeObserver (state, not just a ref, so this effect
  // re-runs once it actually appears) catches both that first paint and
  // any later resize.
  useEffect(() => {
    if (!containerNode) return;
    const measure = () => {
      // Rounded to a whole pixel: react-pdf renders a canvas at exactly
      // this width, and a fractional canvas width (offsetWidth can be
      // subpixel in modern browsers) has caused visible rendering seams
      // for some PDFs.
      const availableWidth = containerNode.offsetWidth - 32;
      let width = Math.min(MAX_PAGE_WIDTH_PX, availableWidth);
      // Large screens: also fit the page(s) within the visible height so
      // they read without scrolling, instead of only capping width. A
      // two-page spread additionally has to fit side by side, so each page
      // gets at most half the available width. The Prev/Next bar (when
      // shown) is sticky *inside* this same scroll container, so its
      // height has to come out of the same budget rather than being able
      // to shrink this container automatically via flexbox. Small screens
      // keep the page at natural height (no height-fit), scrolling within
      // it if it's taller than the viewport.
      if (isLargeScreen) {
        const chrome = 48 + (paginated ? PAGINATION_BAR_HEIGHT_PX : 0);
        const heightFitWidth = (containerNode.offsetHeight - chrome) * PAGE_ASPECT_RATIO;
        const widthBudget = windowSize === 2 ? (availableWidth - PAGE_GAP_PX) / 2 : availableWidth;
        width = Math.min(MAX_PAGE_WIDTH_PX, widthBudget, heightFitWidth);
      }
      setPageWidth(Math.floor(Math.max(width, 0)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerNode);
    return () => observer.disconnect();
  }, [containerNode, isLargeScreen, windowSize, paginated]);

  // Page count changing under a stale windowStart (e.g. switching between
  // a wide and narrow screen mid-session changes windowSize) could leave
  // it past the new max; clamp whenever the bound itself moves.
  useEffect(() => {
    setWindowStart((w) => Math.min(w, maxWindowStart));
  }, [maxWindowStart]);

  const goToPrevPage = () => setWindowStart((w) => Math.max(0, w - 1));
  const goToNextPage = () => setWindowStart((w) => Math.min(maxWindowStart, w + 1));

  const visiblePageNumbers =
    windowSize === 2 ? [windowStart + 1, windowStart + 2] : [windowStart + 1];
  const renderScale =
    typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, MIN_RENDER_SCALE) : MIN_RENDER_SCALE;

  return (
    // Renders the exact same PDF the download button produces, drawn onto
    // our own canvases instead of the browser's native (and
    // theme-following) PDF viewer, so the surrounding chrome always stays
    // light regardless of system dark mode.
    <Document
      key={resume._id}
      file={`/api/resumes/${resume._id}/pdf`}
      onLoadSuccess={({ numPages: n }) => setNumPages(n)}
      loading={<GhostPreview resume={resume} />}
      error={<p className="py-12 text-center text-sm text-red-500">Couldn't load the PDF preview.</p>}
      className="flex h-full items-stretch justify-center"
    >
      <div ref={setContainerNode} className="min-h-0 flex-1 overflow-y-auto bg-bg">
        <div className={isLargeScreen ? "flex h-full flex-col" : "flex flex-col"}>
          <div
            className={
              isLargeScreen
                ? "flex flex-1 items-center justify-center gap-6 py-6"
                : "flex flex-col items-center gap-6 py-6"
            }
          >
            {numPages &&
              visiblePageNumbers.map((pageNum) => (
                <div key={pageNum} className="bg-white shadow-lg">
                  <Page pageNumber={pageNum} width={pageWidth} devicePixelRatio={renderScale} />
                </div>
              ))}
          </div>

          {/* Sticky *inside* the scroll container (not a flex sibling of
              it) so it stays reachable even if this container's own
              height ever falls short of the page(s) above it — it sticks
              to the bottom of whatever's actually visible on screen. */}
          {paginated && (
            <div className="sticky bottom-0 flex shrink-0 items-center justify-center gap-4 border-t border-border bg-white py-3">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={windowStart === 0}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-text-secondary">
                {windowSize === 2
                  ? `Page ${windowStart + 1}–${windowStart + 2} of ${numPages}`
                  : `Page ${windowStart + 1} of ${numPages}`}
              </span>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={windowStart === maxWindowStart}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Document>
  );
}
