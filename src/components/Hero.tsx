'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { HeroCreativeSlider } from '~/components/marketing/HeroCreativeSlider';
import { useCountUp } from '~/hooks/useCountUp';

const TRUST_AVATARS = [
  { bg: 'bg-violet-500', initial: 'A' },
  { bg: 'bg-rose-400', initial: 'M' },
  { bg: 'bg-teal-500', initial: 'S' },
  { bg: 'bg-amber-400', initial: 'K' },
];

function HeroStat({
  value,
  suffix,
  unitSuffix,
  label,
  enabled,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  unitSuffix?: string;
  label: string;
  enabled: boolean;
  decimals?: number;
}) {
  const count = useCountUp(value, enabled, 1400, decimals);

  return (
    <div>
      <p className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 tracking-tight">
        {count}
        {suffix && <span className="text-[#FAD400]">{suffix}</span>}
        {unitSuffix && <span className="text-[#FAD400] font-mono text-2xl">{unitSuffix}</span>}
      </p>
      <p className="text-sm text-neutral-500 mt-1 font-light">{label}</p>
    </div>
  );
}

export function Hero() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });

  const scrollToDemo = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-white pt-[7.5rem] pb-16 lg:pb-24 px-4 lg:px-8">
      {/* Dot grid + noise atmosphere */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none marketing-dot-grid"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-white mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FAD400] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FAD400]" />
              </span>
              <span className="text-xs font-mono text-neutral-700 uppercase tracking-wide">
                AI-Powered Marketing Engine
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[3.5rem] font-display font-bold tracking-tight leading-[1.08] mb-4"
            >
              <span className="text-[#FAD400]">URL to</span>
              <br />
              <span className="text-[#FAD400]">Campaign</span>
              <br />
              <span className="text-neutral-900">in Seconds.</span>
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="h-[3px] w-16 bg-[#FAD400] origin-left mb-6"
            />

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-neutral-600 max-w-lg leading-relaxed mb-8 font-light"
            >
              Drop any website URL and watch AI extract your brand DNA, build campaign strategy,
              and produce ready-to-post social creatives — one workflow, zero briefs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAD400] text-neutral-900 font-display font-semibold text-sm marketing-cta-glow hover:-translate-y-1 transition-transform duration-200"
              >
                Try It Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={scrollToDemo}
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-display font-semibold text-sm hover:border-neutral-400 transition-colors"
              >
                See a Demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="flex -space-x-2">
                {TRUST_AVATARS.map(({ bg, initial }) => (
                  <div
                    key={initial}
                    className={`w-9 h-9 rounded-full ${bg} border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-500">
                Trusted by <span className="font-semibold text-neutral-800">2,400+</span> marketers
                worldwide
              </p>
            </motion.div>

            <motion.div
              ref={statsRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-200"
            >
              <HeroStat value={8} suffix="×" label="Faster campaigns" enabled={statsInView} />
              <HeroStat value={94} suffix="%" label="Brand accuracy" enabled={statsInView} />
              <HeroStat value={30} unitSuffix="s" label="To first output" enabled={statsInView} />
            </motion.div>
          </div>

          {/* Right column — auto-rotating creative showcase */}
          <div className="lg:pl-4">
            <HeroCreativeSlider />
          </div>
        </div>
      </div>
    </section>
  );
}
