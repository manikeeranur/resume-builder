"use client";

import { useState } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";

// Deliberately credentials-only and separate from /login — this is the
// gate for /admin/*, so a successful sign-in that turns out not to belong
// to an admin account is treated as a rejection, not quietly handed off to
// the regular dashboard.
export default function AdminLoginForm() {
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

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // signIn's own result doesn't carry role — it's populated onto the
    // session by lib/auth.js's jwt/session callbacks, so it has to be
    // re-read after the sign-in completes.
    const session = await getSession();
    if (session?.user?.role !== "admin") {
      await signOut({ redirect: false });
      setError("This account doesn't have admin access.");
      setLoading(false);
      return;
    }

    router.push("/admin/payments");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
          <ShieldCheck size={20} />
        </span>
        <span className="text-xl font-bold text-text">Admin Login</span>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-text">Admin sign in</h1>
      <p className="mb-6 text-sm text-text-secondary">Restricted to accounts with admin access.</p>

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
          <PasswordInput name="password" required value={form.password} onChange={handleChange} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary px-4 py-2.5 text-sm">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
