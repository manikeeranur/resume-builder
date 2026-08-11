import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import { writeTemplateClassScan } from "@/lib/templateClassScan";

// Called after every admin template write (create/update/draft-save/delete
// — see app/api/admin/templates/**) so `next dev`'s Tailwind watcher picks
// up new classes right away. Best-effort: a failure here (e.g. a read-only
// filesystem in some production environments) must never fail the actual
// save — scripts/generateTemplateClassScan.mjs covers production CSS
// instead, via package.json's prebuild.
export async function regenerateTemplateClassScan() {
  try {
    await dbConnect();
    const templates = await Template.find().select("code draftCode");
    const codeStrings = templates.flatMap((t) => [t.code, t.draftCode]);
    await writeTemplateClassScan(codeStrings);
  } catch (err) {
    console.warn("Failed to regenerate template class scan:", err.message);
  }
}
