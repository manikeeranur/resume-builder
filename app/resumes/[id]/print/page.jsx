import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import ResumeDocument from "@/components/templates/ResumeDocument";

export default async function PrintPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ResumeDocument resume={resume.toObject()} />
    </div>
  );
}
