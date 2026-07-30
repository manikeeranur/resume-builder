import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections } from "@/lib/resumeDefaults";
import ProfileEditor from "@/components/profile/ProfileEditor";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id });
  const initialProfile = profile
    ? JSON.parse(JSON.stringify(profile.toObject()))
    : { userId: session.user.id, sections: emptyResumeSections };

  return <ProfileEditor profile={initialProfile} />;
}
