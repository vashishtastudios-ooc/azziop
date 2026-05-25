import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  createRazorpayClient,
  getRazorpayKeyId,
  getRazorpayKeySecret,
} from "~/lib/billing";
import { creditPackById, BILLING_CURRENCY } from "~/lib/pricing";

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
    const razorpay = createRazorpayClient();

    const order = await razorpay.orders.create({
      amount: amountMinor,
      currency: BILLING_CURRENCY,
      receipt: `credits_${pack.id}_${session.user.id.slice(-6)}`,
      notes: {
        userId: session.user.id,
        packId: pack.id,
        images: String(pack.images),
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
        images: pack.images,
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

    let secret: string;
    try {
      secret = getRazorpayKeySecret();
    } catch {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 },
      );
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== parsed.data.razorpay_signature) {
      return NextResponse.json(
        { error: "Signature mismatch" },
        { status: 400 },
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        bonusImageCredits: { increment: pack.images },
        razorpayOrderId: parsed.data.razorpay_order_id,
        razorpayPaymentId: parsed.data.razorpay_payment_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { imagesAdded: pack.images },
    });
  } catch (error) {
    console.error("billing.credits.verify error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}
