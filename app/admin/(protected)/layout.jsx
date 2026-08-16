import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopNavbar from "@/components/admin/AdminTopNavbar";

// role is populated on every request from the live User document (see
// lib/auth.js jwt callback) — a role change by another admin takes effect
// on this user's very next request, no re-login required.
//
// There's no separate /admin/login anymore — an admin signs in through the
// same /login every other user uses (see lib/auth.js's pages.signIn), and
// lands here afterward the same way any protected route would send them
// back to where they were headed.
export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  // Same avatar source as the regular-user shell (app/(app)/layout.jsx):
  // the master Profile's own photo, not session.user.image — the latter
  // only ever gets set for a Google-OAuth sign-in, so a credentials-login
  // admin who's uploaded a photo to their own resume profile would
  // otherwise never see it in the admin chrome.
  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  const avatarUrl = profile?.sections?.personalInfo?.photo || null;

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar user={session.user} avatarUrl={avatarUrl} />
      <main className="min-w-0 md:ml-20">
        <AdminTopNavbar user={session.user} avatarUrl={avatarUrl} />
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
