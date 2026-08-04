import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import DashboardShell from "@/components/layout/DashboardShell";
import DraftPromoter from "@/components/auth/DraftPromoter";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

// Templates and the editor are open to anonymous visitors (see
// TemplateGalleryGrid + lib/localResume.js for the local-draft flow); the
// account-only pages under this group (dashboard, resumes list, profile)
// still redirect to /login themselves, same as before. So this layout no
// longer gates on its own — it just renders session-aware chrome.
export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions);

  let avatarUrl = null;
  let isPremium = false;
  if (session) {
    await dbConnect();
    const [profile, { plan }] = await Promise.all([
      Profile.findOne({ userId: session.user.id }),
      getUserPlan(session.user.id),
    ]);
    avatarUrl = profile?.sections?.personalInfo?.photo || null;
    isPremium = plan.billingType !== "FREE";
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <DashboardShell user={session?.user || null} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled}>
      <DraftPromoter />
      {children}
    </DashboardShell>
  );
}
