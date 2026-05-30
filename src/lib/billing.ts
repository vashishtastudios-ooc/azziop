import Razorpay from "razorpay";
import "server-only";
import { env } from "~/env";

export function createRazorpayClient(): Razorpay {
  const keyId = env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim() ?? "";

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (server-only, never prefixed with NEXT_PUBLIC_).",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export function getRazorpayKeyId(): string {
  return env.RAZORPAY_KEY_ID?.trim() ?? "";
}

export function getRazorpayKeySecret(): string {
  const secret = env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }
  return secret;
}

/**
 * Razorpay Subscription Plan IDs (created once in the dashboard). Stored in env
 * so the charged amount has a single source of truth. Returns "" if unset.
 */
export function getRazorpaySubscriptionPlanId(
  planId: "starter" | "pro" | "agency",
  interval: "monthly" | "yearly",
): string {
  const key = `RAZORPAY_PLAN_${planId.toUpperCase()}_${interval.toUpperCase()}`;
  const value = (env as Record<string, string | undefined>)[key];
  return value?.trim() ?? "";
}
