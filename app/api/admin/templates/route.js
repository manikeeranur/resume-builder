import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/lib/models/Template";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
import { compileTemplateComponent, TemplateCompileError } from "@/lib/compileTemplateCode";
import { TEMPLATE_LIST } from "@/lib/templates";
import { NEW_TEMPLATE_BOILERPLATE } from "@/lib/templateBoilerplate";
import { regenerateTemplateClassScan } from "@/lib/regenerateTemplateClassScan";

const TEMPLATE_ID_RE = /^[a-z0-9-]+$/;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const templates = await Template.find().sort({ createdAt: -1 });
  return NextResponse.json(templates);
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const templateId = (body.templateId || "").trim().toLowerCase();
  const code = typeof body.code === "string" && body.code.trim() ? body.code : NEW_TEMPLATE_BOILERPLATE;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!templateId || !TEMPLATE_ID_RE.test(templateId)) {
    return NextResponse.json({ error: "Template ID must be lowercase letters, numbers and hyphens only" }, { status: 400 });
  }
  if (TEMPLATE_LIST.some((t) => t.id === templateId)) {
    return NextResponse.json({ error: `"${templateId}" is a built-in template id` }, { status: 409 });
  }

  try {
    compileTemplateComponent(code);
  } catch (err) {
    if (err instanceof TemplateCompileError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  await dbConnect();
  if (await Template.exists({ templateId })) {
    return NextResponse.json({ error: `Template id "${templateId}" already exists` }, { status: 409 });
  }

  const template = await Template.create({
    name,
    templateId,
    code,
    thumbnail: body.thumbnail || "",
    premium: Boolean(body.premium),
    defaultColor: body.defaultColor || "",
    fullBleed: Boolean(body.fullBleed),
    active: Boolean(body.active),
    createdBy: session.user.id,
    updatedBy: session.user.id,
  });

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "template.create",
    targetType: "Template",
    targetId: template._id,
    previousValue: null,
    newValue: { templateId, name },
  });

  regenerateTemplateClassScan();

  return NextResponse.json(template, { status: 201 });
}
