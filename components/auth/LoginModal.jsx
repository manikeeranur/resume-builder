"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";

// Handles both sign-in and account creation — a mode toggle in place of
// separate /login and /signup pages, so the whole flow can happen without
// leaving whatever screen triggered it (Preview on an anonymous local
// draft, the sidebar's UserMenu, the topbar's AvatarMenu). Both modes
// resolve in place (redirect: false) and call onSuccess; the actual
// "promote a local draft" work happens elsewhere (DraftPromoter), reacting
// to the session change this produces. Google sign-in is the exception —
// it's a full-page redirect, so the caller must have already persisted
// anything it needs (setPendingPromotion) before rendering this modal.
//
// Portaled straight to <body> so it's always centered on the true
// viewport, not whichever backdrop-blur/sticky ancestor it was opened
// from.
export default function LoginModal({ onClose, onSuccess, googleEnabled, defaultMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleLogin = async () => {
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (res?.error === "EmailNotVerified") {
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
      onClose();
      return false;
    }
    if (res?.error) {
      setError("Invalid email or password");
      return false;
    }
    return true;
  };

  // A fresh credentials account can't sign in yet — emailVerified is false
  // until the code just emailed to them is entered (see lib/auth.js) — so
  // this doesn't attempt the old immediate-sign-in-after-signup anymore;
  // that would only ever fail now. Sends them to /verify-email instead,
  // same as the standalone signup page. Their local draft is still in
  // localStorage and will be picked up by DraftPromoter the moment they
  // come back signed in — nothing here is lost, just deferred one step.
  const handleSignup = async () => {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return false;
    }
    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    onClose();
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = mode === "login" ? await handleLogin() : await handleSignup();
    setLoading(false);
    if (ok) {
      // signIn() only updates the client-side session; the sidebar/topbar
      // user info comes from a Server Component (the (app) layout) that
      // otherwise wouldn't re-fetch it until the next real navigation —
      // without this, the chrome would keep showing "Sign in" until the
      // user manually refreshed the page.
      router.refresh();
      onSuccess?.();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-text">
            {mode === "login" ? "Sign in to continue" : "Create your account"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-5 text-sm text-text-secondary">
            {mode === "login"
              ? "Your resume is saved locally in this browser — sign in to save it to your account so you can preview and download it."
              : "Create an account to save your resume and download it as a PDF."}
          </p>

          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={() => signIn("google")}
                className="btn-secondary mb-4 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
              >
                Continue with Google
              </button>
              <div className="mb-4 flex items-center gap-3 text-xs text-text-secondary">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Full name</label>
                <input
                  className="input-field"
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Email</label>
              <input
                className="input-field"
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Password</label>
              <PasswordInput
                name="password"
                required
                minLength={mode === "signup" ? 6 : undefined}
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary px-4 py-2.5 text-sm">
              {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-primary">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-primary">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
