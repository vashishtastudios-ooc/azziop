import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getRazorpayKeyId } from "~/lib/billing";
import { creditPackById, BILLING_CURRENCY } from "~/lib/pricing";
import {
  createRazorpayOrder,
  verifyOrderPaymentSignature,
} from "~/lib/razorpayCheckout";
import { grantCreditPack } from "~/server/lib/billingGrants";

const createSchema = z.object({
  packId: z.string().min(1),
});

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  packId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const pack = creditPackById(parsed.data.packId);
    if (!pack) {
      return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, mobile: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const amountMinor = Math.round(pack.priceUsd * 100);

    const order = await createRazorpayOrder({
      amount: amountMinor,
      currency: BILLING_CURRENCY,
      receipt: `credits_${pack.id}_${session.user.id.slice(-6)}`,
      notes: {
        userId: session.user.id,
        packId: pack.id,
        credits: String(pack.credits),
        kind: "credit_pack",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        keyId: getRazorpayKeyId(),
        amount: amountMinor,
        currency: BILLING_CURRENCY,
        packId: pack.id,
        credits: pack.credits,
        userName: user.name,
        userEmail: user.email ?? "",
        userMobile: user.mobile ?? "",
      },
    });
  } catch (error: unknown) {
    console.error("billing.credits.create error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create credit pack order",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = verifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const pack = creditPackById(parsed.data.packId);
    if (!pack) {
      return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 });
    }

    const valid = verifyOrderPaymentSignature(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature,
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Signature mismatch" },
        { status: 400 },
      );
    }

    // Idempotent by payment id — webhook may also grant this pack.
    await grantCreditPack({
      userId: session.user.id,
      packId: pack.id,
      credits: pack.credits,
      paymentId: parsed.data.razorpay_payment_id,
      orderId: parsed.data.razorpay_order_id,
    });

    return NextResponse.json({
      success: true,
      data: { creditsAdded: pack.credits },
    });
  } catch (error) {
    console.error("billing.credits.verify error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}
