"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

// See the matching comment in LoginForm.jsx.
const PILL = { borderRadius: "9999px" };
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // "email" | "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef(null);

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

  // Always succeeds from the caller's point of view — see the API route for
  // why (avoids confirming which emails have accounts).
  const requestCode = async () => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    return data.message || "If an account exists for this email, a reset code has been sent.";
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const message = await requestCode();
      setNotice(message);
      setStep("reset");
      startCooldown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const message = await requestCode();
      setNotice(message);
      startCooldown();
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't reset password");
      router.push("/login?reset=1");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        {/* Same mark as the app/admin sidebars (DashboardShell, AdminSidebar) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ResumePro" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
        <span className="text-xl font-bold text-text">ResumePro</span>
      </div>

      <h1 className="mb-1 text-center text-2xl font-bold text-text">Reset your password</h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        {step === "email"
          ? "Enter your account email and we'll send you a reset code."
          : `Enter the code we sent to ${email} and choose a new password.`}
      </p>

      {notice && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-success">{notice}</p>
      )}

      {step === "email" ? (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} style={PILL} className="btn-primary px-4 py-3 text-sm">
            {loading ? "Sending…" : "Send Reset Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <input
            style={PILL}
            className="input-field px-5 py-3 text-center text-lg tracking-[0.5em]"
            type="text"
            inputMode="numeric"
            placeholder="······"
            aria-label="Reset code"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <PasswordInput
            style={PILL}
            className="px-5 py-3"
            placeholder="New Password"
            aria-label="New password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            style={PILL}
            className="px-5 py-3"
            placeholder="Confirm New Password"
            aria-label="Confirm new password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={PILL}
            className="btn-primary px-4 py-3 text-sm"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>

          <p className="text-center text-sm text-text-secondary">
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
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="font-semibold text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
