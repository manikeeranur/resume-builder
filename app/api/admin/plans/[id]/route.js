import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";

// code/billingType aren't editable — they're the plan's structural identity
// (seed data, feature-check branches key off billingType). Everything an
// admin should reasonably tune is here.
const ALLOWED_FIELDS = [
  "name",
  "description",
  "price",
  "durationDays",
  "resumeLimit",
  "pdfDownloadLimit",
  "premiumTemplateAccess",
  "watermarkEnabled",
  "customColors",
  "customFonts",
  "active",
];

// Editing a plan only changes what future purchases see — Payment.amount is
// captured at checkout time and never re-derived from the live Plan, so
// historical payment records are unaffected by this.
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const plan = await Plan.findById(params.id);
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const previousValue = {};
  const newValue = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      previousValue[field] = plan[field];
      plan[field] = body[field];
      newValue[field] = body[field];
    }
  }

  if (Object.keys(newValue).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  await plan.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "plan.update",
    targetType: "Plan",
    targetId: plan._id,
    previousValue,
    newValue,
  });

  return NextResponse.json(plan);
}
