import { db } from "~/server/db";
import {
  DEFAULT_PLAN_ID,
  effectivePlanId,
  type PlanId,
} from "~/lib/pricing";
import { getBalance } from "~/lib/credits";
import { getEffectivePlan } from "~/lib/billingRuntime";

/**
 * Resolve the plan a user is *actually* entitled to right now. Honors
 * subscription expiry — a lapsed paid plan falls back to Free.
 */
export async function resolveUserPlan(userId: string): Promise<PlanId> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      planId: true,
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
    },
  });
  if (!user) return DEFAULT_PLAN_ID;
  return effectivePlanId(user);
}

export type ProjectLimitResult = {
  allowed: boolean;
  limit: number | null;
  used: number;
  planId: PlanId;
};

/** Concurrent project/workspace cap (a structural plan limit, not metered). */
export async function checkProjectLimit(
  userId: string,
  increment = 1,
): Promise<ProjectLimitResult> {
  const planId = await resolveUserPlan(userId);
  const limit = (await getEffectivePlan(planId)).limits.projects;
  const used = await db.project.count({ where: { userId } });
  return {
    allowed: limit === null || used + increment <= limit,
    limit,
    used,
    planId,
  };
}

export type LayerAccessResult = {
  allowed: boolean;
  planId: PlanId;
  maxLayer: number | null;
};

/** Feature gate: which AI pipeline layers this plan can run. */
export async function canAccessLayer(
  userId: string,
  layerNumber: number,
): Promise<LayerAccessResult> {
  const planId = await resolveUserPlan(userId);
  const maxLayer = (await getEffectivePlan(planId)).limits.aiLayers;
  return {
    allowed: maxLayer === null || layerNumber <= maxLayer,
    planId,
    maxLayer,
  };
}

export type AccountUsage = {
  planId: PlanId;
  rawPlanId: PlanId;
  creditBalance: number;
  projects: { used: number; limit: number | null };
  monthlyCredits: number;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: Date | null;
};

/** Everything the dashboard / billing portal needs in one read. */
export async function getAccountUsage(userId: string): Promise<AccountUsage> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      planId: true,
      creditBalance: true,
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
    },
  });

  const rawPlanId: PlanId =
    user && (["free", "starter", "pro", "agency"] as const).includes(user.planId as PlanId)
      ? (user.planId as PlanId)
      : DEFAULT_PLAN_ID;
  const planId = user ? effectivePlanId(user) : DEFAULT_PLAN_ID;
  const plan = await getEffectivePlan(planId);

  const projectsUsed = await db.project.count({ where: { userId } });
  const creditBalance = user?.creditBalance ?? (await getBalance(userId));

  return {
    planId,
    rawPlanId,
    creditBalance,
    projects: { used: projectsUsed, limit: plan.limits.projects },
    monthlyCredits: plan.limits.monthlyCredits,
    subscriptionStatus: user?.subscriptionStatus ?? null,
    subscriptionPeriodEnd: user?.subscriptionPeriodEnd ?? null,
  };
}
