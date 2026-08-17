"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Eye } from "lucide-react";
import ExactFirstPagePreview from "@/components/editor/LazyExactFirstPagePreview";
import { getTemplate } from "@/lib/templates";
import { useToast } from "@/components/providers/ToastProvider";

export default function ResumeCard({ resume, pdfData }) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // pdfData is null only while a batch parent (ResumeGrid) is still loading
  // this card's preview — see ExactFirstPagePreview for the full contract.
  const previewLoading = pdfData === null;

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${resume._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch {
      setDeleting(false);
      toast("Failed to delete resume. Please try again.", { type: "error" });
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="relative overflow-hidden border-b border-border">
        <ExactFirstPagePreview resume={resume} pdfData={pdfData} />
        {deleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-primary">
            Deleting…
          </div>
        )}
        {confirmOpen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 p-4 text-center">
            <p className="text-sm font-semibold text-text">Delete this resume?</p>
            <p className="text-xs text-text-secondary">This can&apos;t be undone.</p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="truncate font-semibold text-text">{resume.title}</p>
          <p className="text-xs text-text-secondary">
            {getTemplate(resume.templateId).name} · Created{" "}
            {new Date(resume.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            {new Date(resume.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/resumes/${resume._id}/edit`}
            title="Edit"
            aria-disabled={previewLoading}
            tabIndex={previewLoading ? -1 : undefined}
            onClick={(e) => previewLoading && e.preventDefault()}
            className={`btn-secondary flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs ${
              previewLoading ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <IconEdit size={15} stroke={2} />
            Edit
          </Link>
          <Link
            href={`/resumes/${resume._id}/preview`}
            title="Preview"
            aria-disabled={previewLoading}
            tabIndex={previewLoading ? -1 : undefined}
            onClick={(e) => previewLoading && e.preventDefault()}
            className={`btn-secondary flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs ${
              previewLoading ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <Eye size={15} strokeWidth={2} />
            Preview
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || previewLoading}
            title="Delete"
            aria-label="Delete resume"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border border-border text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconTrash size={16} stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
