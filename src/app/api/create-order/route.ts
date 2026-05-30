import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { getRazorpayKeyId } from "~/lib/billing";
import { BILLING_CURRENCY } from "~/lib/pricing";
import {
  createRazorpayOrder,
  MIN_ORDER_AMOUNT_PAISE,
} from "~/lib/razorpayCheckout";

const inputSchema = z.object({
  amount: z.number().int().min(MIN_ORDER_AMOUNT_PAISE),
  currency: z.string().min(3).max(3).default(BILLING_CURRENCY),
  receipt: z.string().max(40).optional(),
});

/**
 * Razorpay Standard Checkout — Step 1: create order.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
 */
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

    const { amount, currency } = parsed.data;
    const receipt =
      parsed.data.receipt ??
      `order_${session.user.id.slice(-8)}_${Date.now().toString(36)}`;

    const order = await createRazorpayOrder({
      amount,
      currency,
      receipt,
      notes: { userId: session.user.id, kind: "standard_checkout" },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getRazorpayKeyId(),
    });
  } catch (error: unknown) {
    console.error("[create-order]", error);

    if (typeof error === "object" && error !== null && "statusCode" in error) {
      const code = (error as { statusCode?: number }).statusCode;
      if (code === 401) {
        return NextResponse.json(
          { error: "Razorpay authentication failed. Check API keys in .env." },
          { status: 401 },
        );
      }
    }

    if (error instanceof Error && error.message.includes("at least")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 },
    );
  }
}
