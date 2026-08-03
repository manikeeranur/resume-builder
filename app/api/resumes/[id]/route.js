import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(resume);
}

const ALLOWED_FIELDS = ["title", "templateId", "themeConfig", "sections"];

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      if (field === "themeConfig" || field === "sections") {
        resume[field] = { ...resume[field]?.toObject?.() ?? resume[field], ...body[field] };
      } else {
        resume[field] = body[field];
      }
    }
  }
  resume.lastEditedAt = new Date();
  await resume.save();

  revalidatePath("/dashboard");
  revalidatePath("/resumes");

  return NextResponse.json(resume);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await getOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await resume.deleteOne();

  revalidatePath("/dashboard");
  revalidatePath("/resumes");

  return NextResponse.json({ success: true });
}
