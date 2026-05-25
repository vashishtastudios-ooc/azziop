import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
const isProd = process.env.NODE_ENV === "production";

// Hard guard: the Razorpay secret must NEVER be in a NEXT_PUBLIC_ variable.
// If someone ever puts it there again, fail the build instead of shipping
// the secret to the browser.
if (
  typeof process.env.NEXT_PUBLIC_RAZORPAY_SECRET === "string" &&
  process.env.NEXT_PUBLIC_RAZORPAY_SECRET.length > 0
) {
  throw new Error(
    "SECURITY: NEXT_PUBLIC_RAZORPAY_SECRET is set. This would expose your Razorpay secret to the browser. Rename it to RAZORPAY_KEY_SECRET (server-only) and ROTATE the key in the Razorpay dashboard immediately.",
  );
}

export const env = createEnv({
  /**
   * Server-side environment variables. These are NEVER shipped to the browser.
   */
  server: {
    AUTH_SECRET: isProd ? z.string() : z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    DATABASE_URL: isProd ? z.string().url() : z.string().url().optional(),
    GEMINI_API_KEY: isProd ? z.string().min(1) : z.string().optional(),
    META_APP_ID: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_PLAN_PRO_MONTHLY: z.string().optional(),
    RAZORPAY_PLAN_PRO_YEARLY: z.string().optional(),
    RAZORPAY_PLAN_AGENCY_MONTHLY: z.string().optional(),
    RAZORPAY_PLAN_AGENCY_YEARLY: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    // Secret for /api/cron/* — validated at request time in production, not at build.
    // Set on Vercel (min 16 chars); optional locally so `npm run build` works without it.
    CRON_SECRET: z.string().min(16).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  /**
   * Client-side environment variables. ANYTHING here is exposed to the browser.
   * Never put secrets here. Every value must be prefixed with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
  },

  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_PLAN_PRO_MONTHLY: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
    RAZORPAY_PLAN_PRO_YEARLY: process.env.RAZORPAY_PLAN_PRO_YEARLY,
    RAZORPAY_PLAN_AGENCY_MONTHLY: process.env.RAZORPAY_PLAN_AGENCY_MONTHLY,
    RAZORPAY_PLAN_AGENCY_YEARLY: process.env.RAZORPAY_PLAN_AGENCY_YEARLY,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
