import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import TopBar from "@/components/layout/TopBar";
import ThemeCustomizer from "@/components/editor/ThemeCustomizer";

export default async function ThemePage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  return (
    <>
      <TopBar backHref={`/resumes/${params.id}/edit`} title="Theme Customization" subtitle={resume.title} />
      <ThemeCustomizer resume={JSON.parse(JSON.stringify(resume.toObject()))} />
    </>
  );
}
