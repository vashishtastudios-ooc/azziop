import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getRazorpayKeySecret } from "~/lib/billing";

const inputSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
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

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[billing.verify] Signature mismatch");
      return NextResponse.json(
        { error: "Payment verification failed — signature mismatch" },
        { status: 400 },
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        planId,
        billingInterval: interval,
        subscriptionStatus: "active",
        subscriptionPeriodEnd: periodEnd,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    console.log(
      `[billing.verify] User ${session.user.id} activated plan=${planId} interval=${interval} payment=${razorpay_payment_id}`,
    );

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
