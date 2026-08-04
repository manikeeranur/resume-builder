import dbConnect from "@/lib/db";
import Resume from "@/lib/models/Resume";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

// null resumeLimit means unlimited.
export async function checkResumeLimit(userId) {
  await dbConnect();
  const { plan } = await getUserPlan(userId);
  if (plan.resumeLimit == null) {
    return { allowed: true, limit: null, used: null, plan };
  }
  const used = await Resume.countDocuments({ userId });
  return { allowed: used < plan.resumeLimit, limit: plan.resumeLimit, used, plan };
}
