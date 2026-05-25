'use client';

import { motion } from 'framer-motion';

export type BorderBeamProps = {
  children: React.ReactNode;
  /** Seconds per full lap around the border */
  duration?: number;
  /** Highlight ring thickness (px) */
  beamWidth?: number;
  className?: string;
};

/**
 * Animated light traveling along the card edge (Magic UI Border Beam–style).
 * @see https://magicui.design/docs/components/border-beam
 */
export function BorderBeam({
  children,
  duration = 7,
  beamWidth = 2,
  className = '',
}: BorderBeamProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={
        {
          '--bb-radius': '1rem',
          '--bb-beam': `${beamWidth}px`,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
      >
        <motion.div
          className="absolute left-1/2 top-1/2 aspect-square h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
          style={{
            /* Narrow wedge so the visible arc in the thin ring looks like a traveling highlight */
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 88deg, rgba(192, 132, 252, 0.5) 100deg, rgba(168, 85, 247, 1) 118deg, rgba(99, 102, 241, 1) 132deg, rgba(129, 140, 248, 0.85) 146deg, transparent 158deg, transparent 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
        />
      </div>
      <div
        className="relative z-[1] min-h-0 overflow-hidden border border-surface-700 bg-surface-800"
        style={{
          margin: 'var(--bb-beam)',
          borderRadius: 'calc(var(--bb-radius) - var(--bb-beam))',
        }}
      >
        {children}
      </div>
    </div>
  );
}
