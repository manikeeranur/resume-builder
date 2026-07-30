"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ googleEnabled }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
          R
        </span>
        <span className="text-xl font-bold text-text">ResumePro</span>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-text">Welcome back</h1>
      <p className="mb-6 text-sm text-text-secondary">Sign in to continue building your resume</p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
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
          <input
            className="input-field"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary px-4 py-2.5 text-sm">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
