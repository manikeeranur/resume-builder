import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Resume from "@/lib/models/Resume";
import Subscription from "@/lib/models/Subscription";
import Profile from "@/lib/models/Profile";
import PdfDownloadLog from "@/lib/models/PdfDownloadLog";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";
// Not used directly — importing it registers the schema with Mongoose,
// which populate("planId") below requires. See the same note in
// app/api/admin/users/route.js.
import "@/lib/models/Plan";

const ACTIONS = new Set(["promote", "demote", "block", "unblock"]);

export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const user = await User.findById(params.id).select("name email phone image provider role isBlocked createdAt");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [resumeCount, subscription, profile] = await Promise.all([
    Resume.countDocuments({ userId: user._id }),
    Subscription.findOne({ userId: user._id, status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .populate("planId", "name code billingType price currency durationDays"),
    Profile.findOne({ userId: user._id }).select("sections.personalInfo.photo sections.personalInfo.phone"),
  ]);

  return NextResponse.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: profile?.sections?.personalInfo?.phone || user.phone || null,
    photo: profile?.sections?.personalInfo?.photo || user.image || null,
    provider: user.provider,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    resumeCount,
    subscription,
  });
}

export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // An admin can't remove their own access here — that could lock every
  // admin out of /admin/* at once with no in-app way back in (the only
  // recovery would be scripts/promoteAdmin.mjs from the server).
  if ((body.action === "demote" || body.action === "block") && params.id === session.user.id) {
    return NextResponse.json({ error: "You can't remove your own access" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (body.action === "promote" || body.action === "demote") {
    const previousRole = user.role;
    user.role = body.action === "promote" ? "admin" : "user";
    await user.save();

    await AdminAuditLog.create({
      adminId: session.user.id,
      action: `user.${body.action}`,
      targetType: "User",
      targetId: user._id,
      previousValue: { role: previousRole },
      newValue: { role: user.role },
    });

    return NextResponse.json({ _id: user._id, role: user.role });
  }

  const previousBlocked = user.isBlocked;
  user.isBlocked = body.action === "block";
  await user.save();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: `user.${body.action}`,
    targetType: "User",
    targetId: user._id,
    previousValue: { isBlocked: previousBlocked },
    newValue: { isBlocked: user.isBlocked },
  });

  return NextResponse.json({ _id: user._id, isBlocked: user.isBlocked });
}

// Cascades to the user's own working data (resumes, subscriptions, profile,
// download logs). Payment and AdminAuditLog rows are deliberately kept —
// financial and audit records shouldn't disappear just because the account
// that generated them did; Payment.userId is left pointing at the now-gone
// user, same as any ledger keeps a dangling reference after account deletion.
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Same lockout concern as demote/block — an admin deleting themselves
  // could leave /admin/* with no admin at all.
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const snapshot = { name: user.name, email: user.email, role: user.role };

  await Promise.all([
    Resume.deleteMany({ userId: user._id }),
    Subscription.deleteMany({ userId: user._id }),
    Profile.deleteOne({ userId: user._id }),
    PdfDownloadLog.deleteMany({ userId: user._id }),
  ]);
  await user.deleteOne();

  await AdminAuditLog.create({
    adminId: session.user.id,
    action: "user.delete",
    targetType: "User",
    targetId: user._id,
    previousValue: snapshot,
    newValue: null,
  });

  return NextResponse.json({ _id: user._id });
}
