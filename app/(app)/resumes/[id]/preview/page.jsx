import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import ResumePreviewPage from "@/components/preview/ResumePreviewPage";

export default async function PreviewPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return <ResumePreviewPage resume={JSON.parse(JSON.stringify(resume.toObject()))} />;
}
