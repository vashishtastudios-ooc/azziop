'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coins, Loader2, ArrowRight } from 'lucide-react';
import { api } from '~/trpc/react';
import { formatCreditActivityDate, formatRefreshDate } from '~/lib/creditActivity';
import { CREDIT_COSTS } from '~/lib/pricing';

export function CreditsActivityPage() {
  const { data, isLoading, isError, refetch } = api.user.creditActivity.useQuery(
    { limit: 50 },
    { refetchOnWindowFocus: true },
  );

  const refreshHint =
    data?.planId === 'free'
      ? 'One-time trial credits on the Free plan'
      : data?.subscriptionPeriodEnd
        ? formatRefreshDate(new Date(data.subscriptionPeriodEnd))
        : 'Credits refresh each billing cycle on paid plans';

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Credit activity
          </h1>
          <p className="text-surface-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Credits power AI images and campaigns on your plan.{' '}
            <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
              Top up or upgrade
            </Link>
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-300 mb-4">Could not load credit activity.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-sm text-white underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {data && !isLoading && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="grid sm:grid-cols-2 gap-6 mb-12"
            >
              <div className="rounded-2xl border border-surface-800 bg-surface-900/80 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-surface-400">Credits</span>
                </div>
                <p className="text-4xl font-display font-bold text-white tabular-nums">
                  {data.creditBalance.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-surface-500">{refreshHint}</p>
              </div>

              <div className="rounded-2xl border border-surface-800 bg-surface-900/80 p-6">
                <p className="text-sm text-surface-400 mb-3">
                  {data.planName} plan
                </p>
                <p className="text-4xl font-display font-bold text-white tabular-nums">
                  {data.monthlyCredits.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-surface-500">
                  Credits included per billing cycle
                </p>
                <p className="mt-3 text-xs text-surface-600">
                  Image: {CREDIT_COSTS.image} credits · Campaign: {CREDIT_COSTS.campaign} credits
                </p>
              </div>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">Your recent activity</h2>

              {data.entries.length === 0 ? (
                <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-10 text-center">
                  <p className="text-surface-400 mb-4">No credit activity yet.</p>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Start a project <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-surface-800 bg-surface-900/60 overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-surface-800 text-xs font-medium uppercase tracking-wide text-surface-500">
                    <span>Date</span>
                    <span>Category</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <ul className="divide-y divide-surface-800/80">
                    {data.entries.map((entry) => {
                      const isCredit = entry.amount > 0;
                      return (
                        <li
                          key={entry.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-1 sm:gap-4 px-5 py-4 hover:bg-surface-800/30 transition-colors"
                        >
                          <span className="text-sm text-surface-300 sm:col-auto">
                            <span className="sm:hidden text-surface-500 text-xs mr-2">Date</span>
                            {formatCreditActivityDate(new Date(entry.createdAt))}
                          </span>
                          <span className="text-sm text-surface-200 capitalize">
                            <span className="sm:hidden text-surface-500 text-xs mr-2">Category</span>
                            {entry.category}
                          </span>
                          <span
                            className={`text-sm font-semibold tabular-nums sm:text-right ${
                              isCredit ? 'text-emerald-400' : 'text-surface-200'
                            }`}
                          >
                            <span className="sm:hidden text-surface-500 text-xs font-normal mr-2">
                              Amount
                            </span>
                            {isCredit ? '+' : ''}
                            {entry.amount.toLocaleString()}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  Get more credits <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
