import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { isPlanId, creditPackById, type BillingInterval, type PlanId } from "~/lib/pricing";
import { activatePlanAndGrant, grantCreditPack } from "~/server/lib/billingGrants";

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

type Notes = Record<string, string> | undefined;

function periodEndFrom(interval: BillingInterval, currentEnd?: number | null): Date {
  if (currentEnd) return new Date(currentEnd * 1000);
  const d = new Date();
  if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
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

    // Idempotency: dedupe by Razorpay's event id so retries are no-ops.
    const eventId = req.headers.get("x-razorpay-event-id");
    if (eventId) {
      try {
        await db.processedWebhook.create({ data: { eventId } });
      } catch (e) {
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code?: string }).code === "P2002"
        ) {
          // Already processed.
          return NextResponse.json({ success: true, duplicate: true });
        }
        throw e;
      }
    }

    const body = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; notes?: Notes } };
        order?: { entity?: { id?: string; notes?: Notes } };
        subscription?: {
          entity?: {
            id?: string;
            status?: string;
            current_end?: number | null;
            notes?: Notes;
          };
        };
      };
    };

    const event = body.event ?? "";
    console.log(`[webhook] event=${event} id=${eventId ?? "n/a"}`);

    // ─── Subscription lifecycle ──────────────────────────────
    if (event.startsWith("subscription.")) {
      const sub = body.payload?.subscription?.entity;
      const payment = body.payload?.payment?.entity;
      const notes = sub?.notes ?? {};
      const userId = notes.userId;
      const planId = notes.planId;
      const interval: BillingInterval = notes.interval === "yearly" ? "yearly" : "monthly";

      if (!userId || !isPlanId(planId) || planId === "free") {
        return NextResponse.json({ success: true, skipped: "missing subscription notes" });
      }

      if (event === "subscription.charged" || event === "subscription.activated") {
        await activatePlanAndGrant({
          userId,
          planId,
          interval,
          periodEnd: periodEndFrom(interval, sub?.current_end),
          subscriptionId: sub?.id,
          paymentId: payment?.id,
          status: "active",
        });
        return NextResponse.json({ success: true });
      }

      if (event === "subscription.halted" || event === "subscription.pending") {
        // Payment is failing — keep access until period end, flag the status.
        await db.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "halted" },
        });
        return NextResponse.json({ success: true });
      }

      if (event === "subscription.cancelled" || event === "subscription.completed") {
        // Keep paid access until current_end, then effectivePlanId() drops to free.
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "cancelled",
            subscriptionPeriodEnd: periodEndFrom(interval, sub?.current_end),
          },
        });
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: true });
    }

    // ─── One-time credit pack purchase ───────────────────────
    if (event === "payment.captured" || event === "order.paid") {
      const payment = body.payload?.payment?.entity;
      const order = body.payload?.order?.entity;
      const notes = payment?.notes ?? order?.notes ?? {};
      const userId = notes.userId;

      if (!userId) {
        return NextResponse.json({ success: true, skipped: "no userId" });
      }

      if (notes.kind === "subscription") {
        const planId = notes.planId;
        const interval: BillingInterval =
          notes.interval === "yearly" ? "yearly" : "monthly";
        if (isPlanId(planId) && planId !== "free") {
          await activatePlanAndGrant({
            userId,
            planId: planId as Exclude<PlanId, "free">,
            interval,
            periodEnd: periodEndFrom(interval),
            paymentId: payment?.id,
            orderId: payment?.order_id ?? order?.id,
          });
        }
        return NextResponse.json({ success: true });
      }

      if (notes.kind !== "credit_pack") {
        return NextResponse.json({ success: true, skipped: "unknown kind" });
      }

      const pack = creditPackById(notes.packId ?? "");
      if (!pack) {
        return NextResponse.json({ success: true, skipped: "unknown pack" });
      }

      await grantCreditPack({
        userId,
        packId: pack.id,
        credits: pack.credits,
        paymentId: payment?.id,
        orderId: payment?.order_id ?? order?.id,
      });
      console.log(`[webhook] credit pack=${pack.id} credits=${pack.credits} user=${userId}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("billing.webhook error", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
