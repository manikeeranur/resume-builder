"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Eye } from "lucide-react";
import ExactFirstPagePreview from "@/components/editor/LazyExactFirstPagePreview";
import { getTemplate } from "@/lib/templates";

export default function ResumeCard({ resume }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${resume.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${resume._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch {
      setDeleting(false);
      alert("Failed to delete resume. Please try again.");
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="relative overflow-hidden border-b border-border">
        <ExactFirstPagePreview resume={resume} />
        {deleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-primary">
            Deleting…
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="truncate font-semibold text-text">{resume.title}</p>
          <p className="text-xs text-text-secondary">
            {getTemplate(resume.templateId).name} · Updated {new Date(resume.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/resumes/${resume._id}/edit`}
            title="Edit"
            className="btn-secondary flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs"
          >
            <IconEdit size={15} stroke={2} />
            Edit
          </Link>
          <Link
            href={`/resumes/${resume._id}/preview`}
            title="Preview"
            className="btn-secondary flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs"
          >
            <Eye size={15} strokeWidth={2} />
            Preview
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            aria-label="Delete resume"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border border-border text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconTrash size={16} stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
