"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IconFileTypePdf, IconFileTypeDoc, IconPhoto } from "@tabler/icons-react";

// pdf.js touches browser-only APIs (e.g. DOMMatrix) that don't exist during
// Next.js's server render, so this must never be rendered on the server.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <p className="py-12 text-center text-sm text-text-secondary">Loading preview…</p>,
});

async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ResumePreviewPage({ resume }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const filename = `${(resume.title || "Resume").replace(/[^a-z0-9]+/gi, "_")}.${format}`;
      await downloadFile(`/api/resumes/${resume._id}/${format}`, filename);
    } catch (err) {
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/resumes/${resume._id}/edit`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-text sm:text-base">Resume Preview</h1>
              <p className="hidden text-xs text-text-secondary sm:block">Review your resume or save a copy</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              disabled={downloading !== null}
              className="btn-primary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconFileTypePdf size={16} stroke={1.75} />
              {downloading === "pdf" ? "…" : (
                <>
                  <span className="hidden sm:inline">Download </span>PDF
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("docx")}
              disabled={downloading !== null}
              className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconFileTypeDoc size={16} stroke={1.75} />
              {downloading === "docx" ? "…" : "DOCX"}
            </button>
            <button
              type="button"
              onClick={() => handleDownload("png")}
              disabled={downloading !== null}
              className="btn-secondary flex items-center gap-1.5 px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
            >
              <IconPhoto size={16} stroke={1.75} />
              {downloading === "png" ? "…" : "PNG"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PdfViewer resumeId={resume._id} />
      </div>
    </div>
  );
}
