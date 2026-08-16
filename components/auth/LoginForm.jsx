"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBrandGoogle } from "@tabler/icons-react";
import PasswordInput from "@/components/ui/PasswordInput";

// Fully-rounded pill shape for inputs/buttons on this page only — applied
// as inline style rather than a `rounded-full` class because .input-field/
// .btn-primary/.btn-secondary (app/globals.css) are plain CSS rules that
// come after Tailwind's utility layer in the compiled stylesheet, so a
// `rounded-full` utility class loses the cascade to their own border-radius
// at equal specificity. Inline style always wins, no fighting the cascade.
const PILL = { borderRadius: "9999px" };

export default function LoginForm({ googleEnabled }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Reads the one-shot ?verified=1 / ?reset=1 flags from the redirect after
  // email verification or a password reset. Read from window.location
  // instead of useSearchParams so this page can stay statically rendered —
  // useSearchParams would force it into a Suspense boundary / dynamic
  // rendering for what's just a one-time success banner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") setNotice("Email verified — you can sign in now.");
    else if (params.get("reset") === "1") setNotice("Password reset — sign in with your new password.");
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error === "EmailNotVerified" ? "EmailNotVerified" : "Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
          R
        </span>
        <span className="text-xl font-bold text-text">ResumePro</span>
      </div>

      <h1 className="mb-8 text-center text-2xl font-bold text-text">Welcome back! Please sign in.</h1>

      {notice && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-success">{notice}</p>
      )}

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
          type="email"
          name="email"
          placeholder="Email Address"
          aria-label="Email Address"
          required
          value={form.email}
          onChange={handleChange}
        />
        <PasswordInput
          style={PILL}
          className="px-5 py-3"
          name="password"
          placeholder="Password"
          aria-label="Password"
          required
          value={form.password}
          onChange={handleChange}
        />

        <div className="-mt-2">
          <Link href="/forgot-password" className="text-sm font-bold text-primary underline underline-offset-2">
            Forgot your password?
          </Link>
        </div>

        {error === "EmailNotVerified" ? (
          <p className="text-sm text-red-600">
            Please verify your email first.{" "}
            <Link href={`/verify-email?email=${encodeURIComponent(form.email)}`} className="font-semibold underline">
              Verify now
            </Link>
          </p>
        ) : (
          error && <p className="text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={loading} style={PILL} className="btn-primary px-4 py-3 text-sm">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-text-secondary">
        By signing in you agree to our{" "}
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
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
