import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import AdminAuditLog from "@/lib/models/AdminAuditLog";
import { requireAdmin } from "@/lib/requireAdmin";

const ACTIONS = new Set(["promote", "demote"]);

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
  if (body.action === "demote" && params.id === session.user.id) {
    return NextResponse.json({ error: "You can't remove your own admin access" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
