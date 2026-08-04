import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { isLocalDraftId } from "@/lib/localResume";
import ResumePreviewPage from "@/components/preview/ResumePreviewPage";

export default async function PreviewPage({ params }) {
  // A local draft has no real PDF to preview yet — send it back to the
  // editor, where the Preview action prompts for login and promotes it.
  if (isLocalDraftId(params.id)) redirect(`/resumes/${params.id}/edit`);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return <ResumePreviewPage resume={JSON.parse(JSON.stringify(resume.toObject()))} />;
}
