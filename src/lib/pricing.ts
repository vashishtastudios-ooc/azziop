export type PlanId = "free" | "starter" | "pro" | "agency";
export type BillingInterval = "monthly" | "yearly";

export const YEARLY_BILLING_DISCOUNT = 0.25;
export const BILLING_CURRENCY: "USD" = "USD";

// ─── Credit costs ────────────────────────────────────────────────
// Single source of truth for what each billable action costs. Reprice the
// entire product by editing these numbers — no schema migration needed.
// Tie to real provider cost: sell-price-per-credit ≈ (AI cost / credits) × margin.

export const CREDIT_COSTS = {
  /** One generated AI image (layer 5). */
  image: 10,
  /** One campaign strategy set (layer 2). */
  campaign: 30,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/** Rough "images" equivalent for a credit amount — used for UI copy only. */
export function creditsToApproxImages(credits: number): number {
  return Math.floor(credits / CREDIT_COSTS.image);
}

export type PlanLimits = {
  /** Credits granted each billing cycle (one-time for Free). */
  monthlyCredits: number;
  /** Max layers in the AI pipeline this plan can reach. null = all. */
  aiLayers: number | null;
  /** Max concurrent projects/workspaces. null = unlimited. */
  projects: number | null;
  teamMembers: number | null;
  whiteLabel: boolean;
  scheduling: boolean;
  priorityQueue: boolean;
};

export type PricingFeature = {
  text: string;
  included: boolean;
};

export type PricingPlan = {
  id: PlanId;
  name: string;
  description: string;
  /** Price in USD for display. Actual charge comes from the Razorpay plan. */
  monthlyPriceUsd: number;
  highlight: boolean;
  badge?: string;
  features: PricingFeature[];
  limits: PlanLimits;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Try the platform with a one-time credit trial",
    monthlyPriceUsd: 0,
    highlight: false,
    features: [
      { text: "60 credits (one-time) — ~6 AI images", included: true },
      { text: "1 project", included: true },
      { text: "Up to 3 AI layers", included: true },
      { text: "Watermarked exports", included: true },
      { text: "Community support", included: true },
      { text: "Social scheduling", included: false },
      { text: "White-label exports", included: false },
    ],
    limits: {
      monthlyCredits: 60,
      aiLayers: 3,
      projects: 1,
      teamMembers: 1,
      whiteLabel: false,
      scheduling: false,
      priorityQueue: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For solo founders & creators",
    monthlyPriceUsd: 19,
    highlight: false,
    features: [
      { text: "300 credits / month", included: true },
      { text: "~30 AI images or 10 campaigns", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Up to 2 projects", included: true },
      { text: "Email support", included: true },
      { text: "Social scheduling", included: false },
      { text: "White-label exports", included: false },
    ],
    limits: {
      monthlyCredits: 300,
      aiLayers: 6,
      projects: 2,
      teamMembers: 1,
      whiteLabel: false,
      scheduling: false,
      priorityQueue: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Best for growing brands & small teams",
    monthlyPriceUsd: 39,
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "800 credits / month", included: true },
      { text: "~80 AI images or 26 campaigns", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Up to 5 projects", included: true },
      { text: "Up to 3 team members", included: true },
      { text: "Social scheduling", included: true },
      { text: "Priority support", included: true },
    ],
    limits: {
      monthlyCredits: 800,
      aiLayers: 6,
      projects: 5,
      teamMembers: 3,
      whiteLabel: false,
      scheduling: true,
      priorityQueue: true,
    },
  },
  {
    id: "agency",
    name: "Agency",
    description: "For agencies & teams at scale",
    monthlyPriceUsd: 99,
    highlight: false,
    features: [
      { text: "2,500 credits / month", included: true },
      { text: "~250 AI images or 83 campaigns", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Social scheduling + auto-post", included: true },
      { text: "White-label exports", included: true },
    ],
    limits: {
      monthlyCredits: 2500,
      aiLayers: 6,
      projects: null,
      teamMembers: null,
      whiteLabel: true,
      scheduling: true,
      priorityQueue: true,
    },
  },
];

export const DEFAULT_PLAN_ID: PlanId = "free";

// ─── One-time credit packs (top-ups) ─────────────────────────────
// Bought as a one-time Razorpay order. Credits never expire and stack on top
// of the monthly plan allotment.

export type CreditPack = {
  id: string;
  name: string;
  priceUsd: number;
  credits: number;
  savings?: string;
  highlight?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_small",
    name: "Small pack",
    priceUsd: 9,
    credits: 200,
  },
  {
    id: "pack_medium",
    name: "Medium pack",
    priceUsd: 29,
    credits: 750,
    savings: "Save $5",
    highlight: true,
  },
  {
    id: "pack_large",
    name: "Large pack",
    priceUsd: 79,
    credits: 2500,
    savings: "Save $33",
  },
];

export function creditPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function yearlyPricePerMonth(amount: number): number {
  if (amount <= 0) return 0;
  return Math.round(amount * (1 - YEARLY_BILLING_DISCOUNT));
}

export function resolvePlanPrice(
  plan: PricingPlan,
  interval: BillingInterval,
): number {
  const monthly = plan.monthlyPriceUsd;
  return interval === "yearly" ? yearlyPricePerMonth(monthly) : monthly;
}

export function planById(planId: PlanId): PricingPlan {
  return PRICING_PLANS.find((plan) => plan.id === planId) ?? PRICING_PLANS[0]!;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "starter" || value === "pro" || value === "agency";
}

export function monthlyCreditsForPlan(planId: PlanId): number {
  return planById(planId).limits.monthlyCredits;
}

// ─── Effective plan (expiry enforcement) ─────────────────────────
// A user keeps their paid plan only while the subscription is active or the
// paid-through date is still in the future. Otherwise they fall back to Free.

export type SubscriptionFields = {
  planId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: Date | null;
};

export function effectivePlanId(user: SubscriptionFields, now = new Date()): PlanId {
  const planId = isPlanId(user.planId) ? user.planId : DEFAULT_PLAN_ID;
  if (planId === "free") return "free";

  const status = user.subscriptionStatus ?? "";
  const periodEnd = user.subscriptionPeriodEnd ?? null;

  const stillActive = status === "active" || status === "authenticated";
  const withinPaidWindow = periodEnd !== null && periodEnd.getTime() > now.getTime();

  return stillActive || withinPaidWindow ? planId : "free";
}

// ─── Razorpay subscription plan IDs ──────────────────────────────
// Created once in the Razorpay dashboard; the IDs live in env vars so billing
// amounts have a single source of truth.

export function razorpayPlanEnvKey(
  planId: Exclude<PlanId, "free">,
  interval: BillingInterval,
): string {
  return `RAZORPAY_PLAN_${planId.toUpperCase()}_${interval.toUpperCase()}`;
}
