'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { MarketingPageShell } from '~/components/marketing/MarketingPageShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { MKT_BADGE } from '~/lib/marketingTheme';

type AuthPageLayoutProps = {
  headline: React.ReactNode;
  subtitle: string;
  features: { icon: LucideIcon; label: string }[];
  footerNote: string;
  children: React.ReactNode;
};

export function AuthPageLayout({
  headline,
  subtitle,
  features,
  footerNote,
  children,
}: AuthPageLayoutProps) {
  return (
    <MarketingPageShell>
      <div className="relative min-h-[calc(100vh-5rem)] pt-20 pb-16 lg:pt-24">
        {/* overflow-hidden only on backdrop — avoids clipping Syne descenders (g, y, p) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <MarketingPageBackdrop />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">
            {/* Branding — desktop */}
            <div className="hidden lg:flex lg:w-[46%] flex-col justify-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl xl:text-5xl font-display font-bold text-neutral-900 leading-tight mb-6">
                  {headline}
                </h1>
                <p className="text-lg text-neutral-600 leading-relaxed font-light">{subtitle}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap gap-3 mt-10"
              >
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className={`${MKT_BADGE} gap-2`}>
                    <Icon className="w-4 h-4 text-[#FAD400]" />
                    <span className="text-neutral-700 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-neutral-500 text-sm mt-12 font-light"
              >
                {footerNote}
              </motion.p>
            </div>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center py-4 lg:py-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
              >
                {/* Mobile headline */}
                <div className="lg:hidden text-center mb-8">
                  <h1 className="text-2xl font-display font-bold text-neutral-900 leading-[1.2] pb-0.5 mb-2">
                    {headline}
                  </h1>
                  <p className="text-neutral-600 text-sm font-light">{subtitle}</p>
                </div>

                {children}

                {/* Mobile feature chips */}
                <div className="lg:hidden flex flex-wrap justify-center gap-2 mt-8">
                  {features.map(({ icon: Icon, label }) => (
                    <div key={label} className={`${MKT_BADGE} gap-1.5 py-1.5 px-3`}>
                      <Icon className="w-3.5 h-3.5 text-[#FAD400]" />
                      <span className="text-neutral-600 text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}

export function AuthFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-neutral-200 shadow-sm p-8 sm:p-10">
      {children}
    </div>
  );
}

export function AuthFormLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-neutral-900 font-semibold underline underline-offset-4 hover:text-[#FAD400] transition-colors"
    >
      {children}
    </Link>
  );
}
