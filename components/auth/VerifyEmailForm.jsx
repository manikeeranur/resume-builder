"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// See the matching comment in LoginForm.jsx.
const PILL = { borderRadius: "9999px" };
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  // Read from window.location instead of useSearchParams — see the matching
  // comment in LoginForm.jsx for why (keeps this page statically renderable).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
  }, []);

  useEffect(() => () => clearInterval(cooldownTimer.current), []);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      router.push("/login?verified=1");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't resend code");
      setNotice("A new code is on its way — check your inbox.");
      startCooldown();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
          R
        </span>
        <span className="text-xl font-bold text-text">ResumePro</span>
      </div>

      <h1 className="mb-1 text-center text-2xl font-bold text-text">Verify your email</h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        {email ? (
          <>
            We sent a 6-digit code to <span className="font-semibold text-text">{email}</span>.
          </>
        ) : (
          "Enter your email and the code we sent you."
        )}
      </p>

      {notice && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-success">{notice}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          style={PILL}
          className="input-field px-5 py-3"
          type="email"
          placeholder="Email Address"
          aria-label="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={PILL}
          className="input-field px-5 py-3 text-center text-lg tracking-[0.5em]"
          type="text"
          inputMode="numeric"
          placeholder="······"
          aria-label="Verification code"
          required
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading || otp.length !== 6} style={PILL} className="btn-primary px-4 py-3 text-sm">
          {loading ? "Verifying…" : "Verify Email"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-semibold text-primary underline underline-offset-2 disabled:cursor-not-allowed disabled:text-text-secondary disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </p>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="font-semibold text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
