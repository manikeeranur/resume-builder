"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBrandGoogle } from "@tabler/icons-react";
import PasswordInput from "@/components/ui/PasswordInput";
import { stashPendingPassword } from "@/lib/pendingAuthPassword";

// See the matching comment in LoginForm.jsx.
const PILL = { borderRadius: "9999px" };

export default function SignupForm({ googleEnabled }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      // The account can't sign in yet — emailVerified is false until the
      // code just emailed to them is entered — so this sends them straight
      // to that step instead of attempting a sign-in that would only fail.
      // Stashing the password lets VerifyEmailForm sign them in right after
      // verifying, instead of making them type it again immediately.
      stashPendingPassword(form.email, form.password);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Network error. Please try again.");
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

      <h1 className="mb-1 text-center text-2xl font-bold text-text">Create your account</h1>
      <p className="mb-8 text-center text-sm text-text-secondary">Build your perfect resume in minutes</p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={PILL}
            className="btn-secondary mb-4 flex w-full items-center justify-center gap-2.5 px-4 py-3 text-sm"
          >
            <IconBrandGoogle size={18} />
            Continue with Google
          </button>
          <div className="mb-4 flex items-center gap-3 text-xs font-bold tracking-wide text-text-secondary">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          style={PILL}
          className="input-field px-5 py-3"
          type="text"
          name="name"
          placeholder="Full Name"
          aria-label="Full Name"
          required
          value={form.name}
          onChange={handleChange}
        />
        <input
          style={PILL}
          className="input-field px-5 py-3"
          type="email"
          name="email"
          placeholder="Email Address"
          aria-label="Email Address"
          required
          value={form.email}
          onChange={handleChange}
        />
        <div>
          <PasswordInput
            style={PILL}
            className="px-5 py-3"
            name="password"
            placeholder="Password"
            aria-label="Password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
          />
          <p className="mt-1.5 px-1 text-xs text-text-secondary">Password should be at least 6 characters.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} style={PILL} className="btn-primary px-4 py-3 text-sm">
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-text-secondary">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline hover:text-primary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
