import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { isPlanId, creditPackById } from "~/lib/pricing";

function safeEqual(signature: string, expected: string): boolean {
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!safeEqual(signature, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
            notes?: Record<string, string>;
          };
        };
        order?: {
          entity?: {
            id?: string;
            status?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    const event = body.event ?? "";
    console.log(`[webhook] Received event: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const payment = body.payload?.payment?.entity;
      const order = body.payload?.order?.entity;
      const notes = payment?.notes ?? order?.notes ?? {};
      const userId = notes.userId;
      const kind = notes.kind ?? "subscription";

      if (!userId) {
        console.log("[webhook] Missing userId in notes, skipping");
        return NextResponse.json({ success: true });
      }

      if (kind === "credit_pack") {
        const pack = creditPackById(notes.packId ?? "");
        if (!pack) {
          console.log("[webhook] Unknown credit pack", notes.packId);
          return NextResponse.json({ success: true });
        }
        await db.user.update({
          where: { id: userId },
          data: {
            bonusImageCredits: { increment: pack.images },
            razorpayOrderId: payment?.order_id ?? order?.id,
            razorpayPaymentId: payment?.id,
          },
        });
        console.log(
          `[webhook] Credited pack=${pack.id} images=${pack.images} to user=${userId}`,
        );
        return NextResponse.json({ success: true });
      }

      // Subscription kind
      const planId = notes.planId;
      const interval = notes.interval;
      if (!isPlanId(planId) || planId === "free") {
        console.log("[webhook] Invalid planId in notes, skipping", planId);
        return NextResponse.json({ success: true });
      }

      const normalizedInterval = interval === "yearly" ? "yearly" : "monthly";
      const periodEnd = new Date();
      if (normalizedInterval === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await db.user.update({
        where: { id: userId },
        data: {
          planId,
          billingInterval: normalizedInterval,
          subscriptionStatus: "active",
          subscriptionPeriodEnd: periodEnd,
          razorpayOrderId: payment?.order_id ?? order?.id,
          razorpayPaymentId: payment?.id,
        },
      });

      console.log(`[webhook] Activated plan=${planId} for user=${userId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("billing.webhook error", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
