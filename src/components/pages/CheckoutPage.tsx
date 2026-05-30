'use client';

import { useCallback, useMemo, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  CreditCard,
  Loader2,
  Shield,
} from 'lucide-react';
import {
  PRICING_PLANS,
  CREDIT_PACKS,
  planById,
  creditPackById,
  resolvePlanPrice,
  creditsToApproxImages,
  BILLING_CURRENCY,
  type PlanId,
  type BillingInterval,
} from '~/lib/pricing';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

type SubscribeResponse = {
  mode: 'subscription' | 'order';
  subscriptionId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId: string;
  planId: PlanId;
  interval: BillingInterval;
  userName: string;
  userEmail: string;
  userMobile: string;
};

export function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const planId = (searchParams.get('plan') ?? '') as PlanId;
  const packId = searchParams.get('pack') ?? '';
  const interval = (searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;

  const checkout = useMemo(() => {
    if (packId) {
      const pack = creditPackById(packId);
      if (!pack) return null;
      return {
        kind: 'pack' as const,
        title: pack.name,
        subtitle: `${pack.credits} credits · ~${creditsToApproxImages(pack.credits)} images`,
        amountUsd: pack.priceUsd,
        lineItems: [
          { label: 'Credit pack', value: pack.name },
          { label: 'Credits', value: pack.credits.toLocaleString() },
          { label: 'Billing', value: 'One-time purchase' },
        ],
      };
    }

    if (planId && planId !== 'free' && ['starter', 'pro', 'agency'].includes(planId)) {
      const plan = planById(planId);
      const perMonth = resolvePlanPrice(plan, interval);
      const total = interval === 'yearly' ? perMonth * 12 : perMonth;
      return {
        kind: 'plan' as const,
        title: `${plan.name} plan`,
        subtitle: interval === 'yearly' ? `Billed yearly ($${total}/year)` : 'Billed monthly',
        amountUsd: total,
        lineItems: [
          { label: 'Plan', value: plan.name },
          { label: 'Credits / cycle', value: plan.limits.monthlyCredits.toLocaleString() },
          { label: 'Billing', value: interval === 'yearly' ? 'Yearly' : 'Monthly' },
        ],
      };
    }

    return null;
  }, [packId, planId, interval]);

  const openRazorpay = useCallback(
    (
      payload: SubscribeResponse | {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        packId: string;
        credits: number;
        userName: string;
        userEmail: string;
        userMobile: string;
      },
      meta: { type: 'plan'; planId: PlanId; interval: BillingInterval } | { type: 'pack'; packId: string },
    ) => {
      const isPlan = meta.type === 'plan';
      const options: RazorpayOptions = {
        key: payload.keyId,
        name: 'Azziop',
        description: isPlan
          ? `${meta.planId} plan — ${meta.interval}`
          : `${(payload as { credits: number }).credits} credits`,
        prefill: {
          name: payload.userName,
          email: payload.userEmail,
          contact: payload.userMobile,
        },
        theme: { color: '#4f46e5' },
        handler: async (response: RazorpayResponse) => {
          try {
            if (isPlan) {
              const sub = payload as SubscribeResponse;
              const body: Record<string, string> = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: meta.planId,
                interval: meta.interval,
              };
              if (sub.mode === 'order' && response.razorpay_order_id) {
                body.razorpay_order_id = response.razorpay_order_id;
              } else if (response.razorpay_subscription_id) {
                body.razorpay_subscription_id = response.razorpay_subscription_id;
              }
              const verifyRes = await fetch('/api/billing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              const result = await verifyRes.json();
              if (verifyRes.ok && result.success) {
                router.push(
                  `/checkout/success?plan=${meta.planId}&interval=${meta.interval}`,
                );
              } else {
                setError(result?.error ?? 'Payment verification failed.');
                router.push('/checkout/cancelled?reason=verify');
              }
            } else {
              const verifyRes = await fetch('/api/billing/credits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  packId: meta.packId,
                }),
              });
              const result = await verifyRes.json();
              if (verifyRes.ok && result.success) {
                router.push(`/checkout/success?pack=${meta.packId}`);
              } else {
                setError(result?.error ?? 'Payment verification failed.');
                router.push('/checkout/cancelled?reason=verify');
              }
            }
          } catch {
            setError('Payment verification failed. Please contact support.');
            router.push('/checkout/cancelled?reason=error');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            router.push('/checkout/cancelled');
          },
        },
      };

      if (isPlan) {
        const sub = payload as SubscribeResponse;
        if (sub.mode === 'subscription' && sub.subscriptionId) {
          options.subscription_id = sub.subscriptionId;
        } else if (sub.mode === 'order' && sub.orderId) {
          options.order_id = sub.orderId;
          options.amount = sub.amount;
          options.currency = sub.currency ?? BILLING_CURRENCY;
        }
      } else {
        const pack = payload as { orderId: string; amount: number; currency: string };
        options.order_id = pack.orderId;
        options.amount = pack.amount;
        options.currency = pack.currency;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setPaying(false);
        router.push('/checkout/cancelled?reason=failed');
      });
      rzp.open();
    },
    [router],
  );

  const handlePay = async () => {
    if (!checkout) return;
    setError('');
    setPaying(true);

    if (!window.Razorpay) {
      setError('Payment SDK is still loading. Wait a moment and try again.');
      setPaying(false);
      return;
    }

    try {
      if (checkout.kind === 'pack') {
        const res = await fetch('/api/billing/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId }),
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.orderId) {
          setError(json?.error ?? 'Could not start checkout.');
          setPaying(false);
          return;
        }
        openRazorpay(json.data, { type: 'pack', packId });
        return;
      }

      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.keyId) {
        setError(json?.error ?? 'Could not start checkout.');
        setPaying(false);
        return;
      }
      if (json.data.mode === 'subscription' && !json.data.subscriptionId) {
        setError('Invalid checkout session from server.');
        setPaying(false);
        return;
      }
      if (json.data.mode === 'order' && !json.data.orderId) {
        setError('Invalid checkout session from server.');
        setPaying(false);
        return;
      }
      openRazorpay(json.data as SubscribeResponse, { type: 'plan', planId, interval });
    } catch {
      setError('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  if (!checkout) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-white text-lg font-semibold mb-2">Invalid checkout</p>
          <p className="text-surface-400 mb-6">Choose a plan or credit pack from pricing.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" /> Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />

      <div className="relative max-w-2xl mx-auto">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-surface-800 bg-surface-900/80 overflow-hidden"
        >
          <div className="p-6 lg:p-8 border-b border-surface-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                {checkout.kind === 'pack' ? (
                  <Coins className="w-5 h-5 text-amber-400" />
                ) : (
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">Checkout</h1>
                <p className="text-sm text-surface-400">Secure payment via Razorpay</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-white">{checkout.title}</h2>
            <p className="text-surface-400 text-sm mt-1">{checkout.subtitle}</p>
          </div>

          <div className="p-6 lg:p-8 space-y-4">
            <ul className="space-y-3">
              {checkout.lineItems.map((row) => (
                <li
                  key={row.label}
                  className="flex justify-between text-sm border-b border-surface-800/80 pb-3"
                >
                  <span className="text-surface-400">{row.label}</span>
                  <span className="text-white font-medium">{row.value}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-surface-300 font-medium">Total due today</span>
              <span className="text-3xl font-display font-bold text-white">
                ${checkout.amountUsd}
                <span className="text-sm text-surface-500 font-normal ml-1">
                  {BILLING_CURRENCY}
                </span>
              </span>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={paying}
              className="w-full py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-colors"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  Pay ${checkout.amountUsd}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-2 text-xs text-surface-500">
              <Shield className="w-3.5 h-3.5" />
              Encrypted checkout · Powered by Razorpay
            </p>
          </div>
        </motion.div>

        {checkout.kind === 'plan' && (
          <ul className="mt-6 space-y-2 text-sm text-surface-400">
            {planById(planId).features
              .filter((f) => f.included)
              .slice(0, 4)
              .map((f) => (
                <li key={f.text} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {f.text}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
