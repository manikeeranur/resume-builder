import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Resume from "@/lib/models/Resume";
import Subscription from "@/lib/models/Subscription";
import Profile from "@/lib/models/Profile";
import PdfDownloadLog from "@/lib/models/PdfDownloadLog";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import Payment from "@/lib/models/Payment";
import EmailOtp from "@/lib/models/EmailOtp";
import Template from "@/lib/models/Template";
import { TEMPLATE_LIST } from "@/lib/templates";
import { getAdminContactInfo } from "@/lib/adminAvatars";
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

  const [subscription, profile, resumes, downloadLogs, downloadCount, dynamicTemplates] = await Promise.all([
    Subscription.findOne({ userId: user._id, status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .populate("planId", "name code billingType price currency durationDays"),
    Profile.findOne({ userId: user._id }),
    Resume.find({ userId: user._id })
      .select("title templateId downloadCount createdAt updatedAt")
      .sort({ updatedAt: -1 }),
    // Every download this user has ever confirmed, newest first — capped at
    // 200 so a heavy downloader's history stays a reasonable payload; the
    // running total below still reflects their true lifetime count.
    PdfDownloadLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("resumeId", "title templateId"),
    PdfDownloadLog.countDocuments({ userId: user._id }),
    // All templates (not just `active` ones) so a resume built on a template
    // an admin has since deactivated or drafted still resolves to a real
    // name here instead of falling back to its raw id.
    Template.find({}).select("templateId name"),
  ]);

  const templateNameById = new Map(TEMPLATE_LIST.map((t) => [t.id, t.name]));
  dynamicTemplates.forEach((t) => templateNameById.set(t.templateId, t.name));
  const templateName = (templateId) => templateNameById.get(templateId) || templateId;

  // Most real users only ever fill in personal details while building a
  // resume and never visit /profile itself to save a master Profile doc —
  // without this fallback the Profile tab (and avatar/phone above) would
  // come up empty for the majority of users even though they clearly have
  // real data on their resume(s). See lib/adminAvatars for the same
  // precedence applied to every other admin table.
  let profileSections = profile?.sections || null;
  let profileSource = profile ? "profile" : null;
  if (!profileSections && resumes.length) {
    const latestResume = await Resume.findById(resumes[0]._id).select("sections");
    profileSections = latestResume?.sections || null;
    profileSource = profileSections ? "resume" : null;
  }
  const contact = (await getAdminContactInfo([user._id])).get(user._id.toString()) || {};

  return NextResponse.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: contact.phone || user.phone || null,
    photo: contact.photo || user.image || null,
    provider: user.provider,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    resumeCount: resumes.length,
    subscription,
    // The exact same shape ProfileShowcase (app/(app)/profile) renders for
    // the user themselves — null only when they have neither a saved
    // Profile nor a single resume to fall back to. `source: "resume"` lets
    // the UI note that this is derived, not a value the user explicitly saved.
    profile: profileSections ? { sections: profileSections, source: profileSource } : null,
    resumes: resumes.map((r) => ({
      _id: r._id,
      title: r.title,
      templateId: r.templateId,
      templateName: templateName(r.templateId),
      downloadCount: r.downloadCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    downloads: {
      total: downloadCount,
      recent: downloadLogs.map((d) => ({
        _id: d._id,
        createdAt: d.createdAt,
        resumeId: d.resumeId?._id || null,
        resumeTitle: d.resumeId?.title || "(deleted resume)",
        templateName: d.resumeId ? templateName(d.resumeId.templateId) : null,
      })),
    },
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

// Cascades to every place this user's data lives — resumes, subscriptions,
// profile, download logs, payments, and any outstanding OTP for their
// email. AdminAuditLog is the one deliberate exception: it's kept (with a
// now-dangling adminId/targetId) the same way any audit trail outlives the
// account it's about — deleting it would erase the record of what admin
// actions were taken and why, which defeats the point of an audit log.
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
    Payment.deleteMany({ userId: user._id }),
    EmailOtp.deleteMany({ email: user.email }),
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
