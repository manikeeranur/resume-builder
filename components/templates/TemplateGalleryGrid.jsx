"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid, Briefcase, Zap, Palette, AlignLeft, Rocket } from "lucide-react";
import { TEMPLATE_LIST, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { emptyResumeSections, defaultThemeConfig } from "@/lib/resumeDefaults";
import { createLocalDraftId, saveLocalDraft } from "@/lib/localResume";
import TemplateThumb from "./TemplateThumb";
import PremiumBadge from "./PremiumBadge";

// Matches TEMPLATE_CATEGORIES order — purely decorative per-pill icons.
const CATEGORY_ICONS = { Professional: Briefcase, Modern: Zap, Creative: Palette, Minimal: AlignLeft, Executive: Rocket };

export default function TemplateGalleryGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [creatingId, setCreatingId] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("All");
  // Starts with the static 6 built-ins (instant, no flash of empty state),
  // then swaps in the merged catalog — built-ins plus every active
  // admin-created template — once GET /api/templates resolves.
  const [templates, setTemplates] = useState(TEMPLATE_LIST);

  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const visibleTemplates = templates
    .filter((t) => category === "All" || t.category === category)
    .filter((t) => !query || t.name.toLowerCase().includes(query));

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTemplates(data))
      .catch(() => {});
  }, []);

  const handleSelect = async (template) => {
    // status === "loading" is the brief window before the client has
    // resolved whether there's a session at all — wait it out rather than
    // risk treating an actually-logged-in user as anonymous.
    if (!template.available || creatingId || status === "loading") return;
    setError(null);

    // A premium template always needs a paid plan, which in turn always
    // needs an account — so an anonymous visitor picking one goes straight
    // to pricing instead of starting a local draft the server would only
    // reject once they eventually sign up (see check in POST /api/resumes).
    if (template.premium && status === "unauthenticated") {
      router.push("/pricing");
      return;
    }

    setCreatingId(template.id);

    if (status === "unauthenticated") {
      const draft = {
        _id: createLocalDraftId(),
        title: template.name,
        templateId: template.id,
        themeConfig: template.defaultColor
          ? { ...defaultThemeConfig, primaryColor: template.defaultColor }
          : defaultThemeConfig,
        sections: emptyResumeSections,
      };
      saveLocalDraft(draft);
      router.push(`/resumes/${draft._id}/edit`);
      return;
    }

    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, title: template.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create resume", { cause: data.code });
      router.push(`/resumes/${data._id}/edit`);
    } catch (err) {
      setError({ message: err.message, locked: err.cause === "PREMIUM_TEMPLATE_LOCKED" || err.cause === "RESUME_LIMIT_REACHED" });
      setCreatingId(null);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600">
          {error.message}
          {error.locked && (
            <>
              {" "}
              <a href="/pricing" className="font-semibold underline">
                Upgrade
              </a>
            </>
          )}
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("All")}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            category === "All" ? "border-primary bg-primary text-white" : "border-border bg-white text-text-secondary hover:border-primary hover:text-primary"
          }`}
        >
          <LayoutGrid size={14} />
          All Templates
        </button>
        {TEMPLATE_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === c ? "border-primary bg-primary text-white" : "border-border bg-white text-text-secondary hover:border-primary hover:text-primary"
              }`}
            >
              <Icon size={14} />
              {c}
            </button>
          );
        })}
      </div>

      {visibleTemplates.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">
          {query ? (
            <>No templates match &ldquo;{searchParams.get("q")}&rdquo;{category !== "All" ? ` in ${category}` : ""}.</>
          ) : (
            <>No templates in {category} yet.</>
          )}
        </p>
      ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visibleTemplates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t)}
            disabled={creatingId !== null}
            className="card block w-full overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            {/* A4 ratio (210:297 ≈ 0.707), not the old 3:4 (0.75) box — the
                thumbnail images and ScaledThumb's live render are both A4
                pages, so a 3:4 box combined with object-cover/overflow-hidden
                was cropping the bottom of every resume (contact info,
                education, later bullets) to force-fit the wrong ratio. */}
            <div className="relative aspect-[210/297] border-b border-border">
              <TemplateThumb templateId={t.id} thumbnail={t.thumbnail} />
              {t.premium && <PremiumBadge className="absolute right-2 top-2" />}
              {creatingId === t.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-primary">
                  Creating…
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-text">{t.name}</p>
              <p className="text-xs text-text-secondary">{t.premium ? "Premium plan" : "Available"}</p>
            </div>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
