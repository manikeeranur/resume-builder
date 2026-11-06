"use client";

import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import Template4 from "./Template4";
import Template5 from "./Template5";
import Template6 from "./Template6";
import TemplateErrorBoundary from "./TemplateErrorBoundary";
import Watermark from "./Watermark";
import { useDynamicTemplate } from "@/lib/useDynamicTemplate";

const TEMPLATE_COMPONENTS = {
  "template-1": Template1,
  "template-2": Template2,
  "template-3": Template3,
  "template-4": Template4,
  "template-5": Template5,
  "template-6": Template6,
};

// `watermark` is resolved server-side (see app/resumes/[id]/print/page.jsx)
// from the viewer's own plan — never trust a client-passed flag for this.
//
// A "use client" component (unlike the rest of this file's server-rendered
// pages) so it can render admin-created (DB-backed) templates: those have
// no static import to reach for, so their code is fetched and compiled in
// the browser on demand — see lib/useDynamicTemplate.js. Puppeteer, which
// renders app/resumes/[id]/print for PDF/PNG export, runs real Chromium and
// waits for #resume-content, so this client-side fetch+compile completes
// before the page is captured exactly like a static template would.
export default function ResumeDocument({ resume, watermark = false, watermarkText = "ResumePro", draft = false }) {
  const staticComponent = TEMPLATE_COMPONENTS[resume.templateId];
  const dynamicTemplate = useDynamicTemplate(staticComponent ? null : resume.templateId, { draft });

  const Component = staticComponent || dynamicTemplate.Component;

  if (!Component) {
    // Deliberately has no id="resume-content" while a dynamic template's
    // code is still being fetched/compiled (or failed to) — Puppeteer's
    // waitForSelector("#resume-content") must keep waiting through this
    // state, not resolve against a placeholder, or a generated PDF/PNG
    // could capture this instead of the real template.
    return (
      <div className="mx-auto w-[850px] p-10 text-sm text-text-secondary">
        {dynamicTemplate.status === "error" ? dynamicTemplate.error : "Loading template…"}
      </div>
    );
  }

  return (
    <TemplateErrorBoundary>
      {/* Per-template utility CSS compiled on demand (see
          app/api/templates/[templateId]/code). Lets a class an admin adds
          to a dynamic template go live immediately — the app's built-once
          stylesheet only has rules for classes that existed at deploy time,
          so without this a post-deploy edit renders unstyled until the next
          deploy. Empty for built-in templates. */}
      {dynamicTemplate.css ? <style dangerouslySetInnerHTML={{ __html: dynamicTemplate.css }} /> : null}
      <Component resume={resume} />
      {watermark && <Watermark text={watermarkText} />}
    </TemplateErrorBoundary>
  );
}
