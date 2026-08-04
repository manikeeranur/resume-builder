"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getPendingPromotion,
  clearPendingPromotion,
  loadLocalDraft,
  deleteLocalDraft,
} from "@/lib/localResume";

// Mounted once, inside the (app) layout, for every page. Handles both ways
// an anonymous user can end up logged in after LoginModal sets a "pending
// promotion": credentials sign-in (no page reload — this effect re-runs
// once `status` flips to "authenticated") and Google sign-in (a full-page
// redirect back into the app, where this component simply mounts fresh and
// finds the same pending flag waiting in sessionStorage).
export default function DraftPromoter() {
  const { status } = useSession();
  const router = useRouter();
  const promoting = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || promoting.current) return;
    const pending = getPendingPromotion();
    if (!pending) return;

    const draft = loadLocalDraft(pending.draftId);
    if (!draft) {
      clearPendingPromotion();
      return;
    }

    promoting.current = true;
    (async () => {
      try {
        const res = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: draft.templateId,
            title: draft.title,
            sections: draft.sections,
            themeConfig: draft.themeConfig,
          }),
        });
        const data = await res.json();
        clearPendingPromotion();
        deleteLocalDraft(pending.draftId);
        if (res.ok) {
          router.replace(`/resumes/${data._id}/${pending.redirectTo}`);
        }
      } finally {
        promoting.current = false;
      }
    })();
  }, [status, router]);

  return null;
}
