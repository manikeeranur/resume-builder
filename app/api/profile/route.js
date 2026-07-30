import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections } from "@/lib/resumeDefaults";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id });
  if (!profile) {
    return NextResponse.json({ userId: session.user.id, sections: emptyResumeSections });
  }
  return NextResponse.json(profile);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.sections) return NextResponse.json({ error: "sections is required" }, { status: 400 });

  await dbConnect();
  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { sections: body.sections } },
    { new: true, upsert: true }
  );

  return NextResponse.json(profile);
}
