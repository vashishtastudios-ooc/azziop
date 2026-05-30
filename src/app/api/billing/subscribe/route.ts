import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  createRazorpayClient,
  getRazorpayKeyId,
  getRazorpaySubscriptionPlanId,
} from "~/lib/billing";
import { createRazorpayOrder } from "~/lib/razorpayCheckout";
import {
  planById,
  resolvePlanPrice,
  BILLING_CURRENCY,
  type PlanId,
  type BillingInterval,
} from "~/lib/pricing";

const inputSchema = z.object({
  planId: z.enum(["free", "starter", "pro", "agency"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

// Number of billing cycles Razorpay should attempt before the subscription ends.
const TOTAL_CYCLES: Record<"monthly" | "yearly", number> = {
  monthly: 120, // ~10 years
  yearly: 10,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { planId, interval } = parsed.data;
    const userId = session.user.id;

    if (planId === "free") {
      await db.user.update({
        where: { id: userId },
        data: {
          planId: "free",
          billingInterval: null,
          subscriptionStatus: "active",
          subscriptionPeriodEnd: null,
          razorpaySubscriptionId: null,
        },
      });
      return NextResponse.json({ success: true, data: { planId: "free" } });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, mobile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const razorpay = createRazorpayClient();
    const razorpayPlanId = getRazorpaySubscriptionPlanId(planId, interval);

    // Prefer recurring subscriptions when dashboard plan IDs are configured.
    if (razorpayPlanId) {
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: TOTAL_CYCLES[interval],
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId,
          planId,
          interval,
          kind: "subscription",
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          mode: "subscription" as const,
          subscriptionId: subscription.id,
          keyId: getRazorpayKeyId(),
          planId,
          interval,
          userName: user.name,
          userEmail: user.email ?? "",
          userMobile: user.mobile ?? "",
        },
      });
    }

    // Fallback: one-time order (works with only RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET).
    const plan = planById(planId as PlanId);
    const perMonthUsd = resolvePlanPrice(plan, interval as BillingInterval);
    const totalUsd =
      interval === "yearly" ? perMonthUsd * 12 : perMonthUsd;
    const amountMinor = Math.round(totalUsd * 100);

    const order = await createRazorpayOrder({
      amount: amountMinor,
      currency: BILLING_CURRENCY,
      receipt: `${planId}_${interval}_${userId.slice(-6)}`,
      notes: {
        userId,
        planId,
        interval,
        kind: "subscription",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: "order" as const,
        orderId: order.id,
        keyId: getRazorpayKeyId(),
        amount: amountMinor,
        currency: BILLING_CURRENCY,
        planId,
        interval,
        userName: user.name,
        userEmail: user.email ?? "",
        userMobile: user.mobile ?? "",
      },
    });
  } catch (error: unknown) {
    console.error("billing.subscribe error", error);

    if (typeof error === "object" && error !== null && "statusCode" in error) {
      const code = (error as { statusCode?: number }).statusCode;
      if (code === 401) {
        return NextResponse.json(
          { error: "Razorpay authentication failed. Check API keys in .env and restart dev server." },
          { status: 401 },
        );
      }
      if (code === 400) {
        const msg = (error as { error?: { description?: string } }).error?.description;
        return NextResponse.json(
          {
            error:
              msg ??
              "Razorpay rejected the order. If charging USD, enable International Payments on your Razorpay dashboard.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 },
    );
  }
}
