import { db } from "~/server/db";
import { DEFAULT_PLAN_ID, planById, isPlanId, type PlanId } from "~/lib/pricing";

export type QuotaResource = "campaigns" | "images" | "projects";

export type QuotaResult = {
  allowed: boolean;
  limit: number | null;
  used: number;
  planId: PlanId;
  /** Remaining one-time credit pack images (bonus on top of monthly quota). */
  bonusCredits?: number;
};

function currentMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizePlanId(value?: string | null): PlanId {
  return isPlanId(value) ? value : DEFAULT_PLAN_ID;
}

function monthlyLimitForResource(
  planId: PlanId,
  resource: QuotaResource,
): number | null {
  const plan = planById(planId).limits;
  if (resource === "campaigns") return plan.campaignsPerMonth;
  if (resource === "images") return plan.aiImagesPerMonth;
  return plan.projects;
}

export async function checkQuota(
  userId: string,
  resource: QuotaResource,
  increment = 1,
): Promise<QuotaResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { planId: true, bonusImageCredits: true },
  });

  const planId = normalizePlanId(user?.planId);
  const bonusCredits = user?.bonusImageCredits ?? 0;

  // Projects limit is a lifetime/concurrent count (not per-month).
  if (resource === "projects") {
    const limit = planById(planId).limits.projects;
    const used = await db.project.count({ where: { userId } });
    return {
      allowed: limit === null || used + increment <= limit,
      limit,
      used,
      planId,
    };
  }

  // Free plan uses lifetime image cap, not monthly.
  if (resource === "images" && planId === "free") {
    const limit = planById(planId).limits.aiImagesLifetime;
    const agg = await db.usageRecord.aggregate({
      where: { userId },
      _sum: { images: true },
    });
    const used = agg._sum.images ?? 0;
    const monthlyQuotaOK = limit === null || used + increment <= limit;
    const allowed = monthlyQuotaOK || increment <= bonusCredits;
    return { allowed, limit, used, planId, bonusCredits };
  }

  const limit = monthlyLimitForResource(planId, resource);
  const monthKey = currentMonthKey();

  const usage = await db.usageRecord.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    create: { userId, monthKey },
    update: {},
  });

  const used = usage[resource];
  const monthlyOk = limit === null || used + increment <= limit;

  // Image top-up credits can make otherwise-denied requests pass.
  if (resource === "images" && !monthlyOk) {
    return {
      allowed: increment <= bonusCredits,
      limit,
      used,
      planId,
      bonusCredits,
    };
  }

  return {
    allowed: monthlyOk,
    limit,
    used,
    planId,
    ...(resource === "images" ? { bonusCredits } : {}),
  };
}

export async function incrementUsage(
  userId: string,
  resource: QuotaResource,
  amount = 1,
): Promise<void> {
  // For images, consume bonus credits first if the user has any — this means
  // paid top-ups drain before free monthly quota (reverse is also defensible,
  // but this is simplest and matches user expectation: "I bought extras,
  // they shouldn't expire at month end").
  if (resource === "images" && amount > 0) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { planId: true, bonusImageCredits: true },
    });
    const planId = normalizePlanId(user?.planId);
    const bonus = user?.bonusImageCredits ?? 0;

    // For free plan: always consume lifetime counter first (tracked in UsageRecord),
    // then drain bonus if needed.
    if (planId === "free") {
      const monthKey = currentMonthKey();
      await db.usageRecord.upsert({
        where: { userId_monthKey: { userId, monthKey } },
        create: { userId, monthKey, images: amount },
        update: { images: { increment: amount } },
      });
      return;
    }

    const limit = planById(planId).limits.aiImagesPerMonth;
    const monthKey = currentMonthKey();
    const current = await db.usageRecord.upsert({
      where: { userId_monthKey: { userId, monthKey } },
      create: { userId, monthKey },
      update: {},
    });

    const remainingMonthly =
      limit === null ? Number.POSITIVE_INFINITY : Math.max(0, limit - current.images);
    const fromMonthly = Math.min(remainingMonthly, amount);
    const fromBonus = Math.max(0, amount - fromMonthly);
    const bonusDrain = Math.min(bonus, fromBonus);

    if (fromMonthly > 0) {
      await db.usageRecord.update({
        where: { userId_monthKey: { userId, monthKey } },
        data: { images: { increment: fromMonthly } },
      });
    }
    if (bonusDrain > 0) {
      await db.user.update({
        where: { id: userId },
        data: { bonusImageCredits: { decrement: bonusDrain } },
      });
    }
    return;
  }

  const monthKey = currentMonthKey();
  await db.usageRecord.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    create: {
      userId,
      monthKey,
      campaigns: resource === "campaigns" ? amount : 0,
      images: resource === "images" ? amount : 0,
      projects: resource === "projects" ? amount : 0,
    },
    update: {
      [resource]: {
        increment: amount,
      },
    },
  });
}

export async function getMonthlyUsage(userId: string): Promise<{
  campaigns: number;
  images: number;
  projects: number;
  monthKey: string;
  bonusImageCredits: number;
  lifetimeImages: number;
}> {
  const monthKey = currentMonthKey();
  const [usage, user, lifetimeAgg] = await Promise.all([
    db.usageRecord.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
      select: { campaigns: true, images: true, projects: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { bonusImageCredits: true },
    }),
    db.usageRecord.aggregate({
      where: { userId },
      _sum: { images: true },
    }),
  ]);

  return {
    campaigns: usage?.campaigns ?? 0,
    images: usage?.images ?? 0,
    projects: usage?.projects ?? 0,
    monthKey,
    bonusImageCredits: user?.bonusImageCredits ?? 0,
    lifetimeImages: lifetimeAgg._sum.images ?? 0,
  };
}

export async function canAccessLayer(userId: string, layerNumber: number): Promise<{
  allowed: boolean;
  planId: PlanId;
  maxLayer: number | null;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { planId: true },
  });

  const planId = normalizePlanId(user?.planId);
  const maxLayer = planById(planId).limits.aiLayers;
  return {
    allowed: maxLayer === null || layerNumber <= maxLayer,
    planId,
    maxLayer,
  };
}
