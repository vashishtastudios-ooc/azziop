export type PlanId = "free" | "starter" | "pro" | "agency";
export type BillingInterval = "monthly" | "yearly";

export const YEARLY_BILLING_DISCOUNT = 0.25;
export const BILLING_CURRENCY: "USD" = "USD";

export type PlanLimits = {
  campaignsPerMonth: number | null;
  aiImagesPerMonth: number | null;
  /** For the Free plan this is a lifetime cap (enforced in quota.ts). */
  aiImagesLifetime: number | null;
  aiLayers: number | null;
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
  /** Price in USD. This is the single source of truth for billing. */
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
    description: "Try the platform with a small one-time trial",
    monthlyPriceUsd: 0,
    highlight: false,
    features: [
      { text: "1 project", included: true },
      { text: "5 AI images (one-time trial)", included: true },
      { text: "Up to 3 AI layers", included: true },
      { text: "Watermarked exports", included: true },
      { text: "Community support", included: true },
      { text: "Social scheduling", included: false },
      { text: "White-label exports", included: false },
    ],
    limits: {
      campaignsPerMonth: 2,
      aiImagesPerMonth: null,
      aiImagesLifetime: 5,
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
      { text: "3 campaigns per month", included: true },
      { text: "15 AI images per month", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Up to 2 projects", included: true },
      { text: "Watermarked exports", included: true },
      { text: "Email support", included: true },
      { text: "Social scheduling", included: false },
      { text: "White-label exports", included: false },
    ],
    limits: {
      campaignsPerMonth: 3,
      aiImagesPerMonth: 15,
      aiImagesLifetime: null,
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
      { text: "10 campaigns per month", included: true },
      { text: "50 AI images per month", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Up to 5 projects", included: true },
      { text: "Up to 3 team members", included: true },
      { text: "Social scheduling", included: true },
      { text: "Priority support", included: true },
      { text: "White-label exports", included: false },
    ],
    limits: {
      campaignsPerMonth: 10,
      aiImagesPerMonth: 50,
      aiImagesLifetime: null,
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
      { text: "Unlimited campaigns", included: true },
      { text: "200 AI images per month", included: true },
      { text: "Full 6-layer AI pipeline", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Social scheduling + auto-post", included: true },
      { text: "Priority support", included: true },
      { text: "White-label exports", included: true },
    ],
    limits: {
      campaignsPerMonth: null,
      aiImagesPerMonth: 200,
      aiImagesLifetime: null,
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
// These are extra images a user can buy on top of their monthly quota.
// Sold as a one-time Razorpay order, credits land in `User.bonusImageCredits`.

export type CreditPack = {
  id: string;
  name: string;
  priceUsd: number;
  images: number;
  savings?: string;
  highlight?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_small",
    name: "Small pack",
    priceUsd: 9,
    images: 20,
  },
  {
    id: "pack_medium",
    name: "Medium pack",
    priceUsd: 29,
    images: 75,
    savings: "Save $5",
    highlight: true,
  },
  {
    id: "pack_large",
    name: "Large pack",
    priceUsd: 79,
    images: 250,
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
