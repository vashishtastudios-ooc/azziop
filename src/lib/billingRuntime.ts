import "server-only";

import { db } from "~/server/db";
import {
  CREDIT_COSTS,
  PRICING_PLANS,
  planById,
  type PlanId,
  type PlanLimits,
  type PricingPlan,
} from "~/lib/pricing";

const SETTINGS_KEY = "billing";
const CACHE_TTL_MS = 10_000;

export type CreditCostsRuntime = {
  image: number;
  campaign: number;
};

export type PlanLimitsOverlay = {
  monthlyCredits?: number;
  aiLayers?: number | null;
  projects?: number | null;
  scheduling?: boolean;
};

export type BillingRuntime = {
  creditCosts: CreditCostsRuntime;
  plans: Partial<Record<PlanId, PlanLimitsOverlay>>;
};

function defaults(): BillingRuntime {
  return {
    creditCosts: { image: CREDIT_COSTS.image, campaign: CREDIT_COSTS.campaign },
    plans: {},
  };
}

function clampCost(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(1, Math.min(10_000, Math.round(v)));
}

function parseStored(raw: string | null | undefined): Partial<BillingRuntime> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<BillingRuntime>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

let cache: { value: BillingRuntime; loadedAt: number } | null = null;

export function invalidateBillingRuntimeCache() {
  cache = null;
}

function merge(stored: Partial<BillingRuntime>): BillingRuntime {
  const base = defaults();
  return {
    creditCosts: {
      image: clampCost(stored.creditCosts?.image, base.creditCosts.image),
      campaign: clampCost(stored.creditCosts?.campaign, base.creditCosts.campaign),
    },
    plans: stored.plans ?? {},
  };
}

import { CREDIT_COSTS } from "~/lib/pricing";

export async function getBillingRuntime(): Promise<BillingRuntime> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.value;
  const row = await db.appSetting.findUnique({
    where: { key: SETTINGS_KEY },
    select: { value: true },
  });
  const value = merge(parseStored(row?.value));
  cache = { value, loadedAt: Date.now() };
  return value;
}

export async function saveBillingRuntime(
  patch: Partial<BillingRuntime>,
): Promise<BillingRuntime> {
  const current = await getBillingRuntime();
  const next = merge({
    creditCosts: { ...current.creditCosts, ...patch.creditCosts },
    plans: { ...current.plans, ...patch.plans },
  });
  await db.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { value: next, loadedAt: Date.now() };
  return next;
}

export async function getCreditCosts(): Promise<CreditCostsRuntime> {
  return (await getBillingRuntime()).creditCosts;
}

export async function getEffectivePlan(planId: PlanId): Promise<PricingPlan> {
  const plan = planById(planId);
  const overlay = (await getBillingRuntime()).plans[planId];
  if (!overlay) return plan;

  const limits: PlanLimits = {
    ...plan.limits,
    monthlyCredits:
      typeof overlay.monthlyCredits === "number"
        ? overlay.monthlyCredits
        : plan.limits.monthlyCredits,
    aiLayers:
      overlay.aiLayers === undefined ? plan.limits.aiLayers : overlay.aiLayers,
    projects:
      overlay.projects === undefined ? plan.limits.projects : overlay.projects,
    scheduling:
      overlay.scheduling === undefined ? plan.limits.scheduling : overlay.scheduling,
  };

  return { ...plan, limits };
}

export async function getMonthlyCreditsForPlan(planId: PlanId): Promise<number> {
  return (await getEffectivePlan(planId)).limits.monthlyCredits;
}

export function codeDefaultPlans() {
  return PRICING_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    limits: p.limits,
  }));
}
