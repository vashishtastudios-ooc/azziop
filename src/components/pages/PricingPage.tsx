'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, ArrowRight, Zap, Star, Loader2, Coins } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PRICING_PLANS,
  CREDIT_PACKS,
  YEARLY_BILLING_DISCOUNT,
  resolvePlanPrice,
  creditsToApproxImages,
  type PlanId,
} from '~/lib/pricing';
import { MarketingPageShell } from '~/components/marketing/MarketingPageShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { MKT_BADGE, MKT_BTN_PRIMARY, MKT_CARD, MKT_CARD_LG } from '~/lib/marketingTheme';

export function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const router = useRouter();
  const { status } = useSession();

  const handlePlanClick = (planId: PlanId) => {
    const interval = yearly ? 'yearly' : 'monthly';

    if (status !== 'authenticated') {
      router.push(`/register?plan=${planId}&interval=${interval}`);
      return;
    }

    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(planId);
    router.push(`/checkout?plan=${planId}&interval=${interval}`);
  };

  const handleCreditPackClick = (packId: string) => {
    if (status !== 'authenticated') {
      router.push(`/register?pack=${packId}`);
      return;
    }
    setLoadingPack(packId);
    router.push(`/checkout?pack=${packId}`);
  };

  return (
    <MarketingPageShell>
      <div className="relative pt-24 pb-20 px-4 lg:px-8 overflow-hidden">
        <MarketingPageBackdrop />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className={`${MKT_BADGE} mb-8`}>
              <Zap className="w-4 h-4 text-[#FAD400]" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                Simple Pricing
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-[#FAD400]">Plans that</span>{' '}
              <span className="text-neutral-900">scale with you</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
              Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </p>

            <div className="inline-flex items-center gap-1 p-1.5 rounded-xl bg-neutral-100 border border-neutral-200">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`px-5 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
                  !yearly
                    ? 'bg-[#FAD400] text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`px-5 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200 flex items-center gap-2 ${
                  yearly
                    ? 'bg-[#FAD400] text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-[#FAD400] text-[10px] font-mono font-bold tracking-wide">
                  SAVE {Math.round(YEARLY_BILLING_DISCOUNT * 100)}%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {PRICING_PLANS.map((plan, i) => {
              const isLoading = loadingPlan === plan.id;
              const price = resolvePlanPrice(plan, yearly ? 'yearly' : 'monthly');
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                  className={`relative overflow-hidden ${MKT_CARD_LG} ${
                    plan.highlight
                      ? 'border-[#FAD400]/60 ring-2 ring-[#FAD400]/25 shadow-[0_12px_40px_-8px_rgba(250,212,0,0.35)]'
                      : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#FAD400] rounded-bl-xl">
                      <span className="text-xs font-display font-semibold text-neutral-900 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 lg:p-8">
                    <h3 className="text-xl font-display font-semibold text-[#FAD400] mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-6 min-h-[2.5rem] font-light">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-display font-bold text-neutral-900">
                        ${price}
                      </span>
                      {plan.monthlyPriceUsd > 0 && (
                        <span className="text-neutral-500 text-sm font-mono">/mo</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mb-6 h-4 font-mono">
                      {yearly && plan.monthlyPriceUsd > 0 ? `Billed $${price * 12}/year` : ''}
                    </p>

                    <button
                      type="button"
                      onClick={() => void handlePlanClick(plan.id)}
                      disabled={isLoading}
                      className={`w-full py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-8 disabled:opacity-60 ${
                        plan.highlight
                          ? `${MKT_BTN_PRIMARY} w-full hover:translate-y-0`
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.monthlyPriceUsd === 0 ? 'Start Free' : 'Get Started'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-[#FAD400] flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm font-light ${
                              feature.included ? 'text-neutral-700' : 'text-neutral-400'
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <div className={`${MKT_BADGE} mb-4`}>
                <Coins className="w-4 h-4 text-[#FAD400]" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                  Top-up credits
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#FAD400] mb-3">
                Out of images? Grab a credit pack.
              </h2>
              <p className="text-neutral-600 max-w-xl mx-auto font-light">
                One-time purchase, credits never expire. Works on any plan — including Free.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {CREDIT_PACKS.map((pack) => {
                const isLoading = loadingPack === pack.id;
                return (
                  <div
                    key={pack.id}
                    className={`relative p-6 ${MKT_CARD} ${
                      pack.highlight ? 'border-[#FAD400]/50 ring-1 ring-[#FAD400]/20' : ''
                    }`}
                  >
                    {pack.savings && (
                      <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#FAD400] text-neutral-900 text-xs font-mono font-bold tracking-wide">
                        {pack.savings}
                      </div>
                    )}
                    <h3 className="text-lg font-display font-semibold text-[#FAD400] mb-1">
                      {pack.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4 font-light">
                      {pack.credits} credits · ~{creditsToApproxImages(pack.credits)} images
                    </p>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-display font-bold text-neutral-900">
                        ${pack.priceUsd}
                      </span>
                      <span className="text-neutral-500 text-sm font-mono">one-time</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCreditPackClick(pack.id)}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl font-display font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Buy pack <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <p className="text-neutral-600 mb-4 font-light">
              Need a custom plan for your enterprise?{' '}
              <a
                href="mailto:hello@azziop.com"
                className="text-neutral-900 font-medium underline underline-offset-4 hover:text-[#FAD400] transition-colors"
              >
                Contact us
              </a>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-500 text-sm font-light">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FAD400]" />
                No credit card required for Free
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FAD400]" />
                Cancel anytime
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
