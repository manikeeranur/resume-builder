import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

// React cache(): within one server render, the layout and the page share a
// single session decode and a single plan lookup instead of each repeating
// them (previously ~2× getServerSession + 2× getUserPlan per page view).
export const getSession = cache(() => getServerSession(authOptions));
export const getUserPlanCached = cache((userId) => getUserPlan(userId));
