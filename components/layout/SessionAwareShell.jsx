import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import { getUserPlan } from "@/lib/subscription/get-user-plan";
import DashboardShell from "@/components/layout/DashboardShell";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

// For the handful of pages reachable both as a public visitor and as a
// logged-in user (currently /templates, /pricing — see their page.jsx,
// deliberately placed outside both the (marketing) and (app) route groups
// so neither one's layout.jsx forces a single shell on them): an anonymous
// visitor gets the plain public header/footer, exactly like every other
// marketing page; a logged-in user instead gets the same dashboard sidebar
// shell as /dashboard and /resumes.
export default async function SessionAwareShell({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-bg">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  await dbConnect();
  const [profile, { plan }] = await Promise.all([
    Profile.findOne({ userId: session.user.id }),
    getUserPlan(session.user.id),
  ]);
  const avatarUrl = profile?.sections?.personalInfo?.photo || null;
  const isPremium = plan.billingType !== "FREE";
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <DashboardShell user={session.user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled}>
      {children}
    </DashboardShell>
  );
}
