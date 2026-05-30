import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getAccountUsage } from "~/lib/quota";
import { planById } from "~/lib/pricing";
import { createRazorpayClient } from "~/lib/billing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { billingInterval: true, razorpaySubscriptionId: true },
    });

    const account = await getAccountUsage(session.user.id);
    const plan = planById(account.planId);

    return NextResponse.json({
      success: true,
      data: {
        planId: account.planId,
        rawPlanId: account.rawPlanId,
        billingInterval: user?.billingInterval ?? "monthly",
        subscriptionStatus: account.subscriptionStatus,
        subscriptionPeriodEnd: account.subscriptionPeriodEnd,
        razorpaySubscriptionId: user?.razorpaySubscriptionId ?? null,
        creditBalance: account.creditBalance,
        monthlyCredits: account.monthlyCredits,
        projects: account.projects,
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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { razorpaySubscriptionId: true },
    });

    // Cancel at cycle end in Razorpay so the user keeps access until paid-through.
    if (user?.razorpaySubscriptionId) {
      try {
        const razorpay = createRazorpayClient();
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);
      } catch (e) {
        console.error("[billing.portal] Razorpay cancel failed", e);
      }
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { subscriptionStatus: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("billing.portal.post error", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
