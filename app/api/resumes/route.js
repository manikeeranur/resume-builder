import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections, defaultThemeConfig } from "@/lib/resumeDefaults";
import { getTemplate } from "@/lib/templates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const resumes = await Resume.find({ userId: session.user.id }).sort({ updatedAt: -1 });
  return NextResponse.json(resumes);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const template = getTemplate(body.templateId);
  if (!template.available) {
    return NextResponse.json({ error: "That template isn't available yet" }, { status: 400 });
  }

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id });
  const sections = profile ? JSON.parse(JSON.stringify(profile.sections)) : emptyResumeSections;

  const themeConfig = template.defaultColor
    ? { ...defaultThemeConfig, primaryColor: template.defaultColor }
    : defaultThemeConfig;

  const resume = await Resume.create({
    userId: session.user.id,
    title: body.title || "Untitled Resume",
    templateId: template.id,
    themeConfig,
    sections,
  });

  return NextResponse.json(resume, { status: 201 });
}
