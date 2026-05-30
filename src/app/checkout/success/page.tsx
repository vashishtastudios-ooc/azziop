'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Coins } from 'lucide-react';
import { planById, creditPackById, type PlanId } from '~/lib/pricing';
import { AuthenticatedShell } from '~/components/AuthenticatedShell';

function SuccessContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') as PlanId | null;
  const packId = searchParams.get('pack');
  const interval = searchParams.get('interval');

  let headline = 'Payment successful';
  let detail = 'Your account has been updated.';

  if (packId) {
    const pack = creditPackById(packId);
    headline = 'Credits added';
    detail = pack
      ? `${pack.credits.toLocaleString()} credits are now on your account.`
      : 'Your credit pack purchase was successful.';
  } else if (planId && planId !== 'free') {
    const plan = planById(planId);
    headline = `${plan.name} plan activated`;
    detail = `You're on the ${plan.name} plan${interval ? ` (${interval})` : ''}. Credits have been added to your balance.`;
  }

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full text-center rounded-3xl border border-emerald-500/30 bg-surface-900/80 p-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-6">
          {packId ? (
            <Coins className="w-8 h-8 text-amber-400" />
          ) : (
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          )}
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">{headline}</h1>
        <p className="text-surface-400 mb-8">{detail}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm"
          >
            Go to dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/credits"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-surface-700 text-surface-300 hover:text-white text-sm"
          >
            View credits
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 flex items-center justify-center text-surface-400">
          Loading…
        </div>
      }
    >
      <AuthenticatedShell>
        <SuccessContent />
      </AuthenticatedShell>
    </Suspense>
  );
}
