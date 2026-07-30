import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/layout/TopBar";
import TemplateGalleryGrid from "@/components/templates/TemplateGalleryGrid";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <TopBar backHref="/dashboard" title="Choose a Template" subtitle="Pick a template that fits your style" />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <TemplateGalleryGrid />
      </div>
    </>
  );
}
