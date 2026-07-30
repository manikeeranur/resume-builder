import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import ResumeEditor from "@/components/editor/ResumeEditor";

export default async function EditResumePage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return <ResumeEditor resume={JSON.parse(JSON.stringify(resume.toObject()))} />;
}
