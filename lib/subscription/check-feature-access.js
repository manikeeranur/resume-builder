import { getUserPlan } from "@/lib/subscription/get-user-plan";

// Central feature-flag resolver — template pages, the resume API, and the
// print route all call this instead of re-deriving access from a plan doc
// themselves, so a new feature flag only has to be added in one place.
export async function checkFeatureAccess(userId) {
  const { plan, subscription } = await getUserPlan(userId);
  return {
    plan,
    subscription,
    canUsePremiumTemplate: Boolean(plan.premiumTemplateAccess),
    shouldWatermark: Boolean(plan.watermarkEnabled),
    canUseCustomColors: Boolean(plan.customColors),
    canUseCustomFonts: Boolean(plan.customFonts),
  };
}
