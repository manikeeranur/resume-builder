// Bridges the password across the redirect to /verify-email so a user who
// just typed it — at signup, or at a login attempt that got rejected with
// EmailNotVerified — doesn't have to type it a second time right after
// proving they own the inbox. sessionStorage only (never localStorage): it's
// gone the moment the tab closes, never leaves the browser, and every
// caller clears it immediately after a single read regardless of outcome —
// see VerifyEmailForm's consumePendingPassword call.
//
// Wrapped in try/catch since sessionStorage can throw in some contexts
// (Safari private browsing, disabled storage) — a failure here just means
// no auto-login shortcut, not a broken flow; VerifyEmailForm's normal
// "verified — please sign in" path still works either way.
const KEY_EMAIL = "rp_pending_email";
const KEY_PASSWORD = "rp_pending_password";

export function stashPendingPassword(email, password) {
  try {
    sessionStorage.setItem(KEY_EMAIL, email);
    sessionStorage.setItem(KEY_PASSWORD, password);
  } catch {
    // Ignore — see file header.
  }
}

// Returns the stashed password only if it was stashed for this exact email,
// and always removes it from storage before returning — a stash is good
// for one read, whether or not the caller ends up using the result.
export function consumePendingPassword(email) {
  try {
    const storedEmail = sessionStorage.getItem(KEY_EMAIL);
    const storedPassword = sessionStorage.getItem(KEY_PASSWORD);
    sessionStorage.removeItem(KEY_EMAIL);
    sessionStorage.removeItem(KEY_PASSWORD);
    return storedEmail === email ? storedPassword : null;
  } catch {
    return null;
  }
}
