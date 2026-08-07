import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedResume } from "@/lib/getOwnedResume";
import { getTemplateMeta } from "@/lib/templatesServer";
import { checkFeatureAccess } from "@/lib/subscription/check-feature-access";

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

  try {
    const body = await req.json().catch(() => ({}));

    if (body.templateId && body.templateId !== resume.templateId) {
      // getTemplateMeta (unlike the static-only getTemplate) also resolves
      // admin-created templates — using the static-only lookup here would
      // silently fall back to template-1 (never premium) for a dynamic
      // template id, bypassing the premium gate below entirely.
      const template = await getTemplateMeta(body.templateId);
      if (!template) {
        return NextResponse.json({ error: "That template isn't available yet" }, { status: 400 });
      }
      if (template.premium) {
        const access = await checkFeatureAccess(session.user.id);
        if (!access.canUsePremiumTemplate) {
          return NextResponse.json(
            { error: "That template is only available on a paid plan.", code: "PREMIUM_TEMPLATE_LOCKED" },
            { status: 403 }
          );
        }
      }
    }

    if (body.themeConfig) {
      const currentTheme = resume.themeConfig?.toObject?.() ?? resume.themeConfig ?? {};
      const changingColor = body.themeConfig.primaryColor !== undefined && body.themeConfig.primaryColor !== currentTheme.primaryColor;
      const changingFont = body.themeConfig.font !== undefined && body.themeConfig.font !== currentTheme.font;
      if (changingColor || changingFont) {
        const access = await checkFeatureAccess(session.user.id);
        if (changingColor && !access.canUseCustomColors) {
          return NextResponse.json(
            { error: "Custom colors are only available on a paid plan.", code: "CUSTOM_COLOR_LOCKED" },
            { status: 403 }
          );
        }
        if (changingFont && !access.canUseCustomFonts) {
          return NextResponse.json(
            { error: "Custom fonts are only available on a paid plan.", code: "CUSTOM_FONT_LOCKED" },
            { status: 403 }
          );
        }
      }
    }

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
  } catch (err) {
    console.error("Resume update error:", err);
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
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
