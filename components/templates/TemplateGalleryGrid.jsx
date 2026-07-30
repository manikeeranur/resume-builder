"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_LIST } from "@/lib/templates";
import TemplateThumb from "./TemplateThumb";

export default function TemplateGalleryGrid() {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState(null);
  const [error, setError] = useState("");

  const handleSelect = async (template) => {
    if (!template.available || creatingId) return;
    setCreatingId(template.id);
    setError("");
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, title: `${template.name} Resume` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create resume");
      router.push(`/resumes/${data._id}/edit`);
    } catch (err) {
      setError(err.message);
      setCreatingId(null);
    }
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TEMPLATE_LIST.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t)}
            disabled={creatingId !== null}
            className="card block w-full overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <div className="relative aspect-[3/4] border-b border-border">
              <TemplateThumb templateId={t.id} thumbnail={t.thumbnail} />
              {creatingId === t.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-primary">
                  Creating…
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-text">{t.name}</p>
              <p className="text-xs text-text-secondary">Available</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
