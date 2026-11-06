import { getSession, getUserPlanCached } from "@/lib/requestCache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections } from "@/lib/resumeDefaults";
import ProfileEditor from "@/components/profile/ProfileEditor";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/templates");

  await dbConnect();
  const [profile, { plan }] = await Promise.all([
    Profile.findOne({ userId: session.user.id }),
    getUserPlanCached(session.user.id),
  ]);
  const initialProfile = profile
    ? JSON.parse(JSON.stringify(profile.toObject()))
    : { userId: session.user.id, sections: emptyResumeSections };

  return <ProfileEditor profile={initialProfile} isPremium={plan.billingType !== "FREE"} />;
}
