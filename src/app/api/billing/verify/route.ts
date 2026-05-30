import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "~/server/auth";
import { createRazorpayClient, getRazorpayKeySecret } from "~/lib/billing";
import { verifyOrderPaymentSignature } from "~/lib/razorpayCheckout";
import { activatePlanAndGrant } from "~/server/lib/billingGrants";
import type { BillingInterval } from "~/lib/pricing";

const inputSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  razorpay_subscription_id: z.string().optional(),
  razorpay_order_id: z.string().optional(),
  planId: z.enum(["starter", "pro", "agency"]),
  interval: z.enum(["monthly", "yearly"]),
});

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

    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
      razorpay_order_id,
      planId,
      interval,
    } = parsed.data;

    let secret: string;
    try {
      secret = getRazorpayKeySecret();
    } catch {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 },
      );
    }

    const isOrderCheckout = Boolean(razorpay_order_id);

    const signatureValid = isOrderCheckout
      ? verifyOrderPaymentSignature(
          razorpay_order_id!,
          razorpay_payment_id,
          razorpay_signature,
        )
      : crypto
          .createHmac("sha256", secret)
          .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
          .digest("hex") === razorpay_signature;

    if (!signatureValid) {
      console.error("[billing.verify] Signature mismatch");
      return NextResponse.json(
        { error: "Payment verification failed — signature mismatch" },
        { status: 400 },
      );
    }

    if (!isOrderCheckout && !razorpay_subscription_id) {
      return NextResponse.json(
        { error: "Missing subscription id for subscription checkout" },
        { status: 400 },
      );
    }

    let periodEnd = nextPeriodEnd(interval);

    if (!isOrderCheckout && razorpay_subscription_id) {
      try {
        const razorpay = createRazorpayClient();
        const sub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
        const end = (sub as { current_end?: number | null }).current_end;
        if (end) periodEnd = new Date(end * 1000);
      } catch {
        periodEnd = nextPeriodEnd(interval);
      }
    }

    await activatePlanAndGrant({
      userId: session.user.id,
      planId,
      interval: interval as BillingInterval,
      periodEnd,
      subscriptionId: razorpay_subscription_id ?? null,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id ?? null,
    });

    return NextResponse.json({
      success: true,
      data: { planId, interval, paymentId: razorpay_payment_id },
    });
  } catch (error) {
    console.error("billing.verify error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}

function nextPeriodEnd(interval: BillingInterval, from = new Date()): Date {
  const d = new Date(from);
  if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
