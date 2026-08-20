import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TemplateOverride from "@/lib/models/TemplateOverride";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { TEMPLATE_LIST, TEMPLATE_CATEGORIES } from "@/lib/templates";

// Category is the only field an admin can change on a built-in template —
// everything else (code, thumbnail, premium, ...) ships hardcoded in
// TEMPLATE_LIST and has no document to edit. See TemplateOverride's header
// comment for how this sparse override is merged back in on read.
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { templateId } = params;
  if (!TEMPLATE_LIST.some((t) => t.id === templateId)) {
    return NextResponse.json({ error: "Not a built-in template" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const category = body.category || "";
  if (category && !TEMPLATE_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  await dbConnect();
  const previous = await TemplateOverride.findOne({ templateId }).select("category");
  const doc = await TemplateOverride.findOneAndUpdate(
    { templateId },
    category ? { $set: { category } } : { $unset: { category: "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await AdminAuditLog.create({
    adminId: session.user.id,
    // targetId is an ObjectId elsewhere in this log (it points at a real
    // Template document); built-ins have no such document, so this points
    // at the override row instead — templateId is carried in the values
    // below so the entry is still traceable back to which built-in changed.
    action: "template.builtinCategory.update",
    targetType: "TemplateOverride",
    targetId: doc._id,
    previousValue: { templateId, category: previous?.category || null },
    newValue: { templateId, category: doc.category || null },
  });

  return NextResponse.json({ templateId, category: doc.category || null });
}
