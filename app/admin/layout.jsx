import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

// role is populated on every request from the live User document (see
// lib/auth.js jwt callback) — a role change by another admin takes effect
// on this user's very next request, no re-login required.
export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg">
      <AdminNav />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
