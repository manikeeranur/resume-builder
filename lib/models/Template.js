import mongoose from "mongoose";

// Admin-authored resume templates that ship as JSX source instead of a
// compiled file — see lib/compileTemplateCode.js for how `code` turns into
// a renderable component at runtime, on both the server (PDF/print) and the
// client (editor live preview), with no redeploy needed to go live.
const templateSchema = new mongoose.Schema(
  {
    // Used everywhere the built-in templates use their "template-N" string
    // (Resume.templateId, TEMPLATE_COMPONENTS lookup fallback, etc).
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    name: { type: String, required: true, trim: true },
    // JSX source for `export default function Template({ resume }) { ... }`,
    // compiled on demand — see lib/compileTemplateCode.js.
    code: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    premium: { type: Boolean, default: false },
    defaultColor: { type: String, default: "" },
    // Mirrors the hardcoded FULL_BLEED_TEMPLATES set in renderResumePdf.js
    // for built-ins — full-bleed templates print without the standard 8mm
    // page margin. See lib/templates.js#isFullBleedTemplate.
    fullBleed: { type: Boolean, default: false },
    // Selectable by real users when true; false keeps it a draft only
    // reachable from the admin panel.
    active: { type: Boolean, default: false },
    // Scratch copy of `code`/`fullBleed` mirroring the admin editor's
    // unsaved keystrokes, so the exact PDF preview (Puppeteer, which can
    // only read from the DB — see app/api/admin/templates/[id]/pdf) can
    // reflect them without a real Save. Written by
    // app/api/admin/templates/[id]/draft, read only via the ?draft=1 path
    // in app/api/templates/[templateId]/code — never touched by the normal
    // save flow and never what a real user's resume renders.
    draftCode: { type: String },
    draftFullBleed: { type: Boolean },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Template || mongoose.model("Template", templateSchema);
