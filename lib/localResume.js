// Anonymous (not-logged-in) users can browse templates and edit a resume
// entirely client-side, with no DB row created yet. The draft lives in
// localStorage under a "local-" id until the user logs in, at which point
// DraftPromoter (components/auth/DraftPromoter.jsx) POSTs it to
// /api/resumes to create the real, account-owned resume.
//
// Every accessor here is safe to import from server components too (e.g.
// the edit/preview page.jsx files, to check isLocalDraftId before hitting
// the DB) — the localStorage-touching functions just no-op when `window`
// isn't available instead of throwing.

const DRAFT_PREFIX = "resume-builder:draft:";
const PENDING_PROMOTION_KEY = "resume-builder:pending-promotion";

export function createLocalDraftId() {
  return `local-${crypto.randomUUID()}`;
}

export function isLocalDraftId(id) {
  return typeof id === "string" && id.startsWith("local-");
}

export function saveLocalDraft(resume) {
  if (typeof window === "undefined" || !resume?._id) return;
  localStorage.setItem(`${DRAFT_PREFIX}${resume._id}`, JSON.stringify(resume));
}

export function loadLocalDraft(id) {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${DRAFT_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteLocalDraft(id) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_PREFIX}${id}`);
}

// Set right before sending an anonymous user into the login flow, so that
// whichever sign-in path they take (credentials, in-modal; Google, a full
// page redirect) DraftPromoter can find its way back to "log in, save this
// draft for real, then go to `redirectTo`" once a session exists.
export function setPendingPromotion(draftId, redirectTo) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PROMOTION_KEY, JSON.stringify({ draftId, redirectTo }));
}

export function getPendingPromotion() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PROMOTION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingPromotion() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PROMOTION_KEY);
}
