import crypto from "crypto";
import "server-only";
import { createRazorpayClient, getRazorpayKeySecret } from "~/lib/billing";

export const MIN_ORDER_AMOUNT_PAISE = 100;

/** HMAC-SHA256 per Razorpay Standard Checkout: order_id|payment_id */
export function verifyOrderPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = getRazorpayKeySecret();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (params.amount < MIN_ORDER_AMOUNT_PAISE) {
    throw new Error(`Amount must be at least ${MIN_ORDER_AMOUNT_PAISE} paise`);
  }
  const razorpay = createRazorpayClient();
  return razorpay.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });
}
