import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notification from "@/lib/models/Notification";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const notification = await Notification.findOne({ _id: params.id, userId: session.user.id });
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });

  notification.read = true;
  await notification.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  await Notification.deleteOne({ _id: params.id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
