import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { isLocalDraftId } from "@/lib/localResume";
import ResumeEditor from "@/components/editor/ResumeEditor";

export default async function EditResumePage({ params }) {
  // Anonymous, browser-local draft — nothing to fetch from the DB, and no
  // session required. ResumeEditor loads the actual draft from
  // localStorage client-side once it mounts.
  if (isLocalDraftId(params.id)) {
    const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    return <ResumeEditor resume={null} localId={params.id} googleEnabled={googleEnabled} />;
  }

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return <ResumeEditor resume={JSON.parse(JSON.stringify(resume.toObject()))} />;
}
