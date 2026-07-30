import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id });

  return (
    <DashboardShell user={session.user} avatarUrl={profile?.sections?.personalInfo?.photo || null}>
      {children}
    </DashboardShell>
  );
}
