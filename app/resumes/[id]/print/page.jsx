import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import ResumeDocument from "@/components/templates/ResumeDocument";
import { checkFeatureAccess } from "@/lib/subscription/check-feature-access";

export default async function PrintPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) notFound();

  // Resolved from the viewer's own plan, not anything the caller of this
  // page (Puppeteer, forwarding the real user's session cookie) can override.
  const access = await checkFeatureAccess(session.user.id);

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <ResumeDocument
        resume={resume.toObject()}
        watermark={access.shouldWatermark}
        watermarkText={process.env.WATERMARK_TEXT || "ResumePro"}
      />
    </div>
  );
}
