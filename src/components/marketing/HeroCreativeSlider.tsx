'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Sample images live in `public/` (served from the site root, e.g. `/creative-1.png`).
 * Any number of slides works. Portrait (4:5) images look best in this frame,
 * but `object-cover` will gracefully crop any aspect ratio.
 */
const SLIDES = [
  { src: '/creative-1.png', label: 'Instagram Post' },
  { src: '/creative-2.png', label: 'Facebook Ad' },
  { src: '/creative-3.png', label: 'Instagram Story' },
  { src: '/creative-4.png', label: 'Google Display' },
  { src: '/creative-5.png', label: 'Product Feature' },
  { src: '/creative-6.png', label: 'Brand Campaign' },
  { src: '/creative-7.png', label: 'Promo Creative' },
] as const;

const SLIDE_DURATION_MS = 3000;

export function HeroCreativeSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, [index]);

  const advance = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(advance, SLIDE_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, paused, advance]);

  const active = SLIDES[index]!;

  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient brand glow */}
      <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(250,212,0,0.20)_0%,transparent_70%)] pointer-events-none" />

      {/* Decorative floating cards behind the frame for depth */}
      <div className="absolute -left-6 top-10 hidden sm:block w-24 h-32 rounded-2xl bg-white border border-neutral-200/70 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.18)] -rotate-6" />
      <div className="absolute -right-5 bottom-12 hidden sm:block w-20 h-28 rounded-2xl bg-white border border-neutral-200/70 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.18)] rotate-6" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative rounded-2xl border border-neutral-200/80 bg-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.14)] overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="ml-2 text-[10px] font-mono text-neutral-400 truncate">
            azziop.com/creatives
          </span>
        </div>

        {/* Image stage */}
        <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={active.src}
              custom={direction}
              className="absolute inset-0"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.06, x: direction * 40 }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, x: 0 }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98, x: direction * -40 }
              }
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Ken Burns slow zoom on the active image */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1 }}
                animate={reduceMotion ? { scale: 1 } : { scale: 1.08 }}
                transition={{ duration: SLIDE_DURATION_MS / 1000 + 0.7, ease: 'linear' }}
              >
                <Image
                  src={active.src}
                  alt={active.label}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover"
                />
              </motion.div>

              {/* Bottom gradient + caption */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-semibold text-neutral-800 shadow-sm">
                  {active.label}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FAD400] text-[11px] font-semibold text-neutral-900 shadow-sm">
                  AI-generated
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls: progress bar + dots */}
        <div className="px-4 py-3 border-t border-neutral-100 bg-white">
          <div className="h-1 rounded-full bg-neutral-100 overflow-hidden mb-3">
            <motion.div
              key={`${index}-${paused}`}
              className="h-full bg-[#FAD400] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: paused ? '0%' : '100%' }}
              transition={{ duration: paused ? 0 : SLIDE_DURATION_MS / 1000, ease: 'linear' }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Show ${slide.label}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-[#FAD400]' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="absolute -top-3 right-4 sm:right-8 px-3 py-1.5 rounded-full bg-white border border-[#FAD400]/50 shadow-lg text-xs font-semibold text-neutral-800 flex items-center gap-1.5"
      >
        <span className="text-emerald-500">✓</span> Generated in 30s
      </motion.div>
    </div>
  );
}
