import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import Resume from "@/lib/models/Resume";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { compileTemplateComponent, TemplateCompileError } from "@/lib/compileTemplateCode";
import { regenerateTemplateClassScan } from "@/lib/regenerateTemplateClassScan";

// templateId isn't editable once created — it's embedded in every Resume
// that already picked this template (Resume.templateId), same reasoning as
// Plan.code/billingType being immutable.
const ALLOWED_FIELDS = ["name", "code", "thumbnail", "premium", "defaultColor", "fullBleed", "active"];

export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const template = await Template.findById(params.id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const template = await Template.findById(params.id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (body.code !== undefined) {
    try {
      compileTemplateComponent(body.code);
    } catch (err) {
      if (err instanceof TemplateCompileError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const previousValue = {};
  const newValue = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      previousValue[field] = template[field];
      template[field] = body[field];
      newValue[field] = body[field];
    }
  }

  if (Object.keys(newValue).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  template.updatedBy = session.user.id;
  await template.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "template.update",
    targetType: "Template",
    targetId: template._id,
    previousValue,
    // Omit code bodies from the audit trail diff — they're large and the
    // compiled-ness is already verified above; just note that it changed.
    newValue: { ...newValue, ...(newValue.code !== undefined ? { code: "(updated)" } : {}) },
  });

  if (newValue.code !== undefined) regenerateTemplateClassScan();

  return NextResponse.json(template);
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const template = await Template.findById(params.id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // A resume already using this template would break (no component to
  // render it with) if the row just disappeared — point the admin at
  // deactivating instead, which keeps it rendering for existing resumes
  // while hiding it from the gallery for new ones.
  const inUse = await Resume.exists({ templateId: template.templateId });
  if (inUse) {
    return NextResponse.json(
      { error: "This template is used by existing resumes. Deactivate it instead of deleting." },
      { status: 409 }
    );
  }

  await template.deleteOne();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "template.delete",
    targetType: "Template",
    targetId: template._id,
    previousValue: { templateId: template.templateId, name: template.name },
    newValue: null,
  });

  regenerateTemplateClassScan();

  return NextResponse.json({ success: true });
}
