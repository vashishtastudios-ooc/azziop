import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getMonthlyUsage } from "~/lib/quota";
import { planById, isPlanId, DEFAULT_PLAN_ID, type PlanId } from "~/lib/pricing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        planId: true,
        billingInterval: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        razorpaySubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usage = await getMonthlyUsage(user.id);
    const normalizedPlanId: PlanId = isPlanId(user.planId) ? user.planId : DEFAULT_PLAN_ID;
    const plan = planById(normalizedPlanId);

    return NextResponse.json({
      success: true,
      data: {
        planId: normalizedPlanId,
        billingInterval: user.billingInterval ?? "monthly",
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPeriodEnd: user.subscriptionPeriodEnd,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        usage,
        limits: plan.limits,
      },
    });
  } catch (error) {
    console.error("billing.portal.get error", error);
    return NextResponse.json({ error: "Failed to load billing info" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = (await req.json()) as { action?: string };
    if (action !== "cancel") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        planId: "free",
        billingInterval: null,
        subscriptionStatus: "active",
        subscriptionPeriodEnd: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("billing.portal.post error", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
