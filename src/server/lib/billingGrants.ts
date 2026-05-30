import { db } from "~/server/db";
import { grantCredits } from "~/lib/credits";
import {
  monthlyCreditsForPlan,
  type PlanId,
  type BillingInterval,
} from "~/lib/pricing";

/**
 * Shared billing side-effects. Both the redirect-time verify route and the
 * Razorpay webhook call these. Credit grants are keyed by the Razorpay payment
 * id, so if both run for the same charge the second is an idempotent no-op.
 */

export type ActivateInput = {
  userId: string;
  planId: Exclude<PlanId, "free">;
  interval: BillingInterval;
  periodEnd: Date;
  subscriptionId?: string | null;
  paymentId?: string | null;
  orderId?: string | null;
  status?: string;
};

export async function activatePlanAndGrant(input: ActivateInput): Promise<void> {
  const {
    userId,
    planId,
    interval,
    periodEnd,
    subscriptionId,
    paymentId,
    orderId,
    status = "active",
  } = input;

  await db.user.update({
    where: { id: userId },
    data: {
      planId,
      billingInterval: interval,
      subscriptionStatus: status,
      subscriptionPeriodEnd: periodEnd,
      ...(subscriptionId ? { razorpaySubscriptionId: subscriptionId } : {}),
      ...(orderId ? { razorpayOrderId: orderId } : {}),
      ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
    },
  });

  // Grant the cycle's credits. Keyed by payment id → one grant per charge.
  const grantKey = paymentId
    ? `grant:payment:${paymentId}`
    : `grant:sub:${subscriptionId}:${periodEnd.toISOString()}`;

  await grantCredits({
    userId,
    amount: monthlyCreditsForPlan(planId),
    reason: "plan_grant",
    sourceId: grantKey,
    metadata: { planId, interval, subscriptionId, paymentId },
  });
}

export type CreditPackGrantInput = {
  userId: string;
  packId: string;
  credits: number;
  paymentId?: string | null;
  orderId?: string | null;
};

export async function grantCreditPack(input: CreditPackGrantInput): Promise<void> {
  const { userId, packId, credits, paymentId, orderId } = input;

  const grantKey = paymentId
    ? `grant:payment:${paymentId}`
    : `grant:pack:${packId}:${orderId ?? ""}`;

  await grantCredits({
    userId,
    amount: credits,
    reason: "topup",
    sourceId: grantKey,
    metadata: { packId, paymentId, orderId },
  });

  if (orderId || paymentId) {
    await db.user.update({
      where: { id: userId },
      data: {
        ...(orderId ? { razorpayOrderId: orderId } : {}),
        ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
      },
    });
  }
}

/** Downgrade a user to Free (subscription cancelled/expired). */
export async function downgradeToFree(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      planId: "free",
      billingInterval: null,
      subscriptionStatus: "cancelled",
      subscriptionPeriodEnd: null,
      razorpaySubscriptionId: null,
    },
  });
}
