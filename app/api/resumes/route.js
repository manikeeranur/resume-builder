import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections, defaultThemeConfig } from "@/lib/resumeDefaults";
import { getTemplateMeta } from "@/lib/templatesServer";
import { checkResumeLimit } from "@/lib/subscription/check-resume-limit";
import { checkFeatureAccess } from "@/lib/subscription/check-feature-access";

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

  try {
    const body = await req.json().catch(() => ({}));
    // getTemplateMeta (unlike the static-only getTemplate) also resolves
    // admin-created templates, and returns null instead of silently falling
    // back to template-1 when the id doesn't match anything real.
    const template = await getTemplateMeta(body.templateId);
    if (!template || !template.available) {
      return NextResponse.json({ error: "That template isn't available yet" }, { status: 400 });
    }

    const [resumeLimit, access] = await Promise.all([
      checkResumeLimit(session.user.id),
      checkFeatureAccess(session.user.id),
    ]);
    if (!resumeLimit.allowed) {
      return NextResponse.json(
        { error: `You've reached your plan's limit of ${resumeLimit.limit} resume(s). Upgrade to create more.`, code: "RESUME_LIMIT_REACHED" },
        { status: 403 }
      );
    }
    if (template.premium && !access.canUsePremiumTemplate) {
      return NextResponse.json(
        { error: "That template is only available on a paid plan.", code: "PREMIUM_TEMPLATE_LOCKED" },
        { status: 403 }
      );
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

    const themeDefault = template.defaultColor
      ? { ...defaultThemeConfig, primaryColor: template.defaultColor }
      : defaultThemeConfig;
    let themeConfig = body.themeConfig || themeDefault;

    // A free-tier draft (built anonymously, then promoted after sign-up via
    // DraftPromoter) can carry a custom color/font picked before the plan
    // limit ever applied — clamp back to the template default rather than
    // failing the whole promotion outright.
    if (!access.canUseCustomColors && themeConfig.primaryColor !== themeDefault.primaryColor) {
      themeConfig = { ...themeConfig, primaryColor: themeDefault.primaryColor };
    }
    if (!access.canUseCustomFonts && themeConfig.font !== themeDefault.font) {
      themeConfig = { ...themeConfig, font: themeDefault.font };
    }

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
  } catch (err) {
    console.error("Resume creation error:", err);
    return NextResponse.json({ error: "Failed to create resume" }, { status: 500 });
  }
}
