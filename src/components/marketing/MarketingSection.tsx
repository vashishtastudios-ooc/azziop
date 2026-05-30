'use client';

import { motion } from 'framer-motion';

export function MarketingSection({
  children,
  className = '',
  id = '',
  alt = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  alt?: boolean;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={`relative py-20 md:py-28 px-4 lg:px-8 ${
        alt ? 'bg-neutral-50' : 'bg-white'
      } ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function MarketingSectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={`mb-14 md:mb-16 ${align === 'center' ? 'text-center' : ''}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-white mb-6 ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FAD400] opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FAD400]" />
          </span>
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
            {badge}
          </span>
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-neutral-900 mb-4"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={`text-lg text-neutral-600 leading-relaxed font-light ${
            align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'
          }`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/** Accent span for section titles */
export const MKT_ACCENT = "text-[#FAD400]";
