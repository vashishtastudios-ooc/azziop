'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Link2, Loader2, ArrowRight } from 'lucide-react';
import { usePipelineStore, useIsLoading, useCurrentStep } from '@/store/pipeline';

export function Hero() {
  const [url, setUrl] = useState('');
  const runPipeline = usePipelineStore((state) => state.runPipeline);
  const isLoading = useIsLoading();
  const currentStep = useCurrentStep();
  const status = usePipelineStore((state) => state.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    try {
      await runPipeline(url.trim());
    } catch {
      // `runPipeline` sets store `error` / `status`; avoid unhandled rejection
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-16 pb-12 px-4 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
      <div className="absolute inset-0 bg-radial-glow opacity-50" />

      {/* Moving spotlight effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-rose-500/10" />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(244, 63, 94, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Main content container */}
      <div className="relative max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Sparkles className="w-4 h-4 text-[var(--hero-blue)]" />
          <span className="text-sm text-surface-300">Powered by Gemini Pro</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1] text-center"
        >
          URL to{' '}
          <span className="text-[var(--hero-blue)]">Campaign</span>
          <br />
          in seconds
        </motion.h1>

        {/* Underline accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-20 h-1 bg-[var(--hero-orange)] mb-6"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-surface-400 max-w-xl mb-8 leading-relaxed text-center"
        >
          Enter any website URL and our 6-layer AI pipeline extracts brand DNA, generates marketing strategies, and creates ready-to-use social media creatives.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {[
            { label: 'Brand DNA Extraction' },
            { label: 'Campaign Strategy' },
            { label: 'Visual Creatives' },
          ].map(({ label }) => (
            <span
              key={label}
              className="px-3 py-1.5 text-xs uppercase tracking-wider text-surface-400 
                       border border-surface-700 rounded-full bg-surface-800/50"
            >
              {label}
            </span>
          ))}
        </motion.div>

        {/* URL Prompt - Campaigns-style */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full max-w-3xl mx-auto mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-[var(--hero-blue)]" />
            <span className="text-surface-300 text-sm font-medium">Paste your website URL</span>
          </div>

          <div className="relative rounded-2xl border border-surface-700 bg-surface-800/50 backdrop-blur-sm p-1.5 shadow-xl shadow-black/20 focus-within:border-[var(--hero-blue)]/50 focus-within:ring-2 focus-within:ring-[var(--hero-blue)]/20 transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourbrand.com or any website..."
                className="flex-1 bg-transparent text-white placeholder-surface-500 px-5 py-4 sm:py-3.5 focus:outline-none text-base leading-relaxed min-h-[52px]"
                disabled={isLoading}
                autoComplete="url"
              />
              <button
                type="submit"
                disabled={!url.trim() || isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-gradient-to-r from-[var(--hero-blue)] to-indigo-600 hover:from-[#4a6cf7] hover:to-indigo-500 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--hero-blue)]/25 hover:shadow-[var(--hero-blue)]/35"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Brand DNA</span>
                    <ArrowRight className="w-4 h-4 hidden sm:block" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-surface-500 text-xs mt-3">
            We&apos;ll analyze your site and extract brand identity in under 60 seconds.
          </p>

          {/* Quick URL chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {['nike.com', 'starbucks.com', 'stripe.com', 'notion.so', 'linear.app'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setUrl(`https://${chip}`)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-surface-400 bg-surface-800/80 border border-surface-700 hover:border-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Progressive status indicator */}
        {status !== 'idle' && status !== 'complete' && status !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-2 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-[var(--hero-blue)]/30 border-t-[var(--hero-blue)] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm text-[var(--hero-blue)] font-medium">{currentStep}</span>
            </div>
            <p className="text-xs text-surface-500">
              This may take up to a minute — we're analyzing your brand visually with AI.
            </p>
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-surface-600 flex items-start justify-center p-1"
          >
            <motion.div className="w-1 h-2 rounded-full bg-surface-500" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
