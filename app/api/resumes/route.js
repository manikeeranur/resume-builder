import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

  // A DraftPromoter call (turning an anonymous local draft into a real,
  // account-owned resume post-login) already has real sections/theme data
  // to hand over — use it as-is instead of reseeding from the profile or
  // template default.
  let sections = body.sections;
  if (!sections) {
    const profile = await Profile.findOne({ userId: session.user.id });
    sections = profile ? JSON.parse(JSON.stringify(profile.sections)) : emptyResumeSections;
  }

  const themeConfig =
    body.themeConfig ||
    (template.defaultColor ? { ...defaultThemeConfig, primaryColor: template.defaultColor } : defaultThemeConfig);

  const resume = await Resume.create({
    userId: session.user.id,
    title: body.title || "Untitled Resume",
    templateId: template.id,
    themeConfig,
    sections,
  });

  // Next.js's client-side router cache would otherwise keep serving the
  // pre-creation dashboard/resumes list after router.push() navigates away
  // from here, since that's a client-side transition, not a fresh request.
  revalidatePath("/dashboard");
  revalidatePath("/resumes");

  return NextResponse.json(resume, { status: 201 });
}
