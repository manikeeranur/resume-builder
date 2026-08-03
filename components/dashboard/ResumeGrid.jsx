"use client";

import { useEffect, useMemo, useState } from "react";
import ResumeCard from "@/components/dashboard/ResumeCard";

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Fetches page-1 previews for every resume on the dashboard in one batched
// request (one Chromium launch server-side) instead of each ResumeCard
// hitting the full-PDF download route on its own.
export default function ResumeGrid({ resumes }) {
  // id -> null (still loading) | false (failed) | Uint8Array (ready)
  const [previews, setPreviews] = useState({});

  // Keyed on the actual id set, not the `resumes` array reference — a
  // server re-render (e.g. router.refresh() after a download bumps the
  // "Total Downloads" stat) hands down a brand-new array every time even
  // when the resumes shown haven't changed, and re-fetching every card's
  // preview on every such refresh is exactly the wasted batch call this
  // component exists to avoid.
  const idsKey = useMemo(() => resumes.map((r) => r._id).join(","), [resumes]);

  useEffect(() => {
    let cancelled = false;
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) return;

    fetch("/api/resumes/pdf-previews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => (res.ok ? res.json() : { previews: {} }))
      .then(({ previews: base64Previews = {} }) => {
        if (cancelled) return;
        const resolved = {};
        for (const id of ids) {
          resolved[id] = base64Previews[id] ? base64ToUint8Array(base64Previews[id]) : false;
        }
        setPreviews(resolved);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviews(Object.fromEntries(ids.map((id) => [id, false])));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {resumes.map((r) => (
        <ResumeCard key={r._id} resume={r} pdfData={r._id in previews ? previews[r._id] : null} />
      ))}
    </div>
  );
}
