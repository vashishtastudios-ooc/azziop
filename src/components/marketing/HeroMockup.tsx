'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_URL = 'mossscentsuk.com';
const DNA_TAGS = ['Luxury', 'Bold', 'Sophisticated', 'Sensory'] as const;

const CREATIVES = [
  { label: 'Instagram post', lines: 4 },
  { label: 'Google Ad', lines: 3 },
  { label: 'Facebook post', lines: 4 },
  { label: 'Instagram story', lines: 2 },
] as const;

type Phase = 'typing' | 'progress' | 'dna' | 'creatives' | 'done';

export function HeroMockup() {
  const [phase, setPhase] = useState<Phase>('typing');
  const [typedLen, setTypedLen] = useState(0);
  const [creativeFill, setCreativeFill] = useState(0);

  useEffect(() => {
    if (phase !== 'typing') return;
    if (typedLen >= DEMO_URL.length) {
      const t = setTimeout(() => setPhase('progress'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLen((n) => n + 1), 85);
    return () => clearTimeout(t);
  }, [phase, typedLen]);

  useEffect(() => {
    if (phase === 'progress') {
      const t = setTimeout(() => setPhase('dna'), 1200);
      return () => clearTimeout(t);
    }
    if (phase === 'dna') {
      const t = setTimeout(() => setPhase('creatives'), 1400);
      return () => clearTimeout(t);
    }
    if (phase === 'creatives') {
      const interval = setInterval(() => {
        setCreativeFill((f) => {
          if (f >= CREATIVES.length) {
            clearInterval(interval);
            setPhase('done');
            return f;
          }
          return f + 1;
        });
      }, 550);
      return () => clearInterval(interval);
    }
    if (phase === 'done') {
      const t = setTimeout(() => {
        setTypedLen(0);
        setCreativeFill(0);
        setPhase('typing');
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const typed = DEMO_URL.slice(0, typedLen);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(250,212,0,0.18)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative rounded-2xl border border-neutral-200/80 bg-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="ml-2 text-[10px] font-mono text-neutral-400 truncate">
            azziop.com/analyse
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* URL row */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 min-h-[44px]">
              <span className="text-neutral-300 text-sm">🔒</span>
              <span className="font-mono text-sm text-neutral-800 truncate">
                {typed}
                <span className="inline-block w-0.5 h-4 bg-[#FAD400] ml-0.5 align-middle animate-pulse" />
              </span>
            </div>
            <motion.button
              type="button"
              animate={
                phase === 'progress' || phase === 'dna' || phase === 'creatives' || phase === 'done'
                  ? { scale: [1, 1.04, 1] }
                  : {}
              }
              transition={{ duration: 0.6, repeat: phase === 'progress' ? Infinity : 0 }}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#FAD400] text-neutral-900 text-sm font-semibold"
            >
              Analyse
            </motion.button>
          </div>

          {/* Progress */}
          <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
            <motion.div
              className="h-full bg-[#FAD400] rounded-full"
              initial={{ width: '0%' }}
              animate={{
                width:
                  phase === 'typing'
                    ? '0%'
                    : phase === 'progress'
                      ? '100%'
                      : '100%',
              }}
              transition={{ duration: phase === 'progress' ? 1 : 0.2 }}
            />
          </div>

          {/* Brand DNA */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Brand personality
            </p>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {(phase === 'dna' || phase === 'creatives' || phase === 'done') &&
                DNA_TAGS.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.35 }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[#FAD400]/15 text-neutral-800 border border-[#FAD400]/40"
                  >
                    {tag}
                  </motion.span>
                ))}
            </div>
          </div>

          {/* Creative grid */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Generated creatives
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CREATIVES.map((card, i) => {
                const filled = creativeFill > i;
                const loading =
                  phase === 'creatives' && creativeFill === i;
                return (
                  <div
                    key={card.label}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-2.5 min-h-[72px]"
                  >
                    <p className="text-[9px] font-semibold text-neutral-400 uppercase mb-2 truncate">
                      {card.label}
                    </p>
                    <div className="space-y-1.5">
                      {Array.from({ length: card.lines }).map((_, li) => (
                        <div
                          key={li}
                          className="h-1.5 rounded-full overflow-hidden bg-neutral-200/80"
                        >
                          {filled ? (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${55 + ((li * 17) % 40)}%` }}
                              transition={{ duration: 0.4 }}
                              className="h-full rounded-full bg-neutral-400"
                            />
                          ) : loading ? (
                            <div className="h-full w-full marketing-shimmer rounded-full" />
                          ) : (
                            <div className="h-full w-3/4 bg-neutral-200 rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute -top-3 right-4 sm:right-8 px-3 py-1.5 rounded-full bg-white border border-[#FAD400]/50 shadow-lg text-xs font-semibold text-neutral-800 flex items-center gap-1.5"
          >
            <span className="text-emerald-500">✓</span> Brand DNA Extracted
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
