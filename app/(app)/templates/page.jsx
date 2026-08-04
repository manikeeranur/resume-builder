import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TopBar from "@/components/layout/TopBar";
import TemplateGalleryGrid from "@/components/templates/TemplateGalleryGrid";

// Open to anonymous visitors — see TemplateGalleryGrid for the local-draft
// flow used when there's no session. There's no back destination that
// makes sense for a logged-out visitor (every other page redirects to
// /login), so the back button only shows once there's a dashboard to
// return to.
export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <TopBar
        backHref={session ? "/dashboard" : undefined}
        title="Choose a Template"
        subtitle="Pick a template that fits your style"
      />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <TemplateGalleryGrid />
      </div>
    </>
  );
}
