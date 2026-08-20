import mongoose from "mongoose";
import { TEMPLATE_CATEGORIES } from "@/lib/templates";

// Built-in templates (lib/templates.js#TEMPLATE_LIST) ship as static code —
// there's no Template document to edit for them, so every other field on
// them is locked in the admin UI. Category is the one exception: admins can
// re-tag a built-in without a redeploy, and this sparse collection (one row
// per overridden built-in) is where that lives. Absence of a row means "use
// the hardcoded default in TEMPLATE_LIST" — see lib/templatesServer.js and
// app/api/admin/templates/builtin-categories/route.js for how it's merged in.
const templateOverrideSchema = new mongoose.Schema(
  {
    templateId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: { type: String, enum: TEMPLATE_CATEGORIES },
  },
  { timestamps: true }
);

export default mongoose.models.TemplateOverride || mongoose.model("TemplateOverride", templateOverrideSchema);
