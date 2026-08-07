import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/requireAdmin";
import ResumeDocument from "@/components/templates/ResumeDocument";
import { sampleResume } from "@/lib/sampleResume";

// Deliberately outside the app/admin/(protected) route group — that layout
// wraps pages in the admin sidebar/chrome, which must NOT show up here: the
// admin PDF-preview route (app/api/admin/templates/[id]/pdf) points
// Puppeteer straight at this page and screenshots whatever's under
// #resume-content, exactly like app/resumes/[id]/print does for real users.
export default async function TemplatePreviewPage({ params }) {
  const session = await requireAdmin();
  if (!session) notFound();

  const resume = { ...sampleResume, templateId: params.templateId };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ResumeDocument resume={resume} />
    </div>
  );
}
