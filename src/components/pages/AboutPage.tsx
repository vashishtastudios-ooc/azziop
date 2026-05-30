'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, Code2, Brain, Heart, ArrowRight } from 'lucide-react';
import { MarketingPageShell } from '~/components/marketing/MarketingPageShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { MKT_BADGE, MKT_BTN_PRIMARY, MKT_CARD } from '~/lib/marketingTheme';

const MISSION_CARDS = [
  {
    icon: Rocket,
    title: 'Our Mission',
    description:
      'Democratize professional marketing by making AI-powered campaign creation accessible to every business, from solo founders to agencies.',
  },
  {
    icon: Brain,
    title: 'The Technology',
    description:
      'Our proprietary 6-layer AI pipeline analyzes brands at a deeper level than traditional tools — extracting DNA, not just colors.',
  },
  {
    icon: Code2,
    title: 'Built Different',
    description:
      'Powered by leading AI models, every campaign is contextually aware of your brand identity, target audience, and industry best practices.',
  },
] as const;

export function AboutPage() {
  return (
    <MarketingPageShell>
      <div className="relative pt-24 pb-20 px-4 lg:px-8 overflow-hidden">
        <MarketingPageBackdrop />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className={`${MKT_BADGE} mb-8`}>
              <Heart className="w-4 h-4 text-[#FAD400]" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                Our Story
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-[#FAD400]">Marketing</span>{' '}
              <span className="text-[#FAD400]">should be</span>
              <br />
              <span className="text-neutral-900">effortless.</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-light">
              We believe every brand deserves stunning campaigns without the complexity, cost, or
              time investment traditionally required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-24">
            {MISSION_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className={`p-8 ${MKT_CARD}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAD400]/20 border border-[#FAD400]/30 flex items-center justify-center mb-6">
                  <card.icon className="w-6 h-6 text-neutral-900" />
                </div>
                <h3 className="text-xl font-display font-semibold text-[#FAD400] mb-3">
                  {card.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed font-light">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`relative p-10 md:p-14 ${MKT_CARD} overflow-hidden mb-20`}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(250,212,0,0.2)_0%,transparent_70%)] pointer-events-none"
              aria-hidden
            />

            <div className="relative flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#FAD400] p-[3px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-display font-bold text-[#FAD400]">
                      SV
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-left">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2 block">
                  Founder & Creator
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-[#FAD400] mb-4">
                  Siddhartha Vashishta
                </h2>
                <p className="text-lg text-neutral-700 leading-relaxed mb-4 font-light">
                  Passionate about the intersection of AI and creative marketing, Siddhartha built
                  Azziop to solve a problem he experienced firsthand — the struggle of creating
                  professional, on-brand marketing campaigns quickly and affordably.
                </p>
                <p className="text-neutral-600 leading-relaxed font-light">
                  With a vision to make world-class marketing accessible to everyone, he designed
                  the 6-layer AI pipeline that powers Azziop — turning any website URL into a
                  complete marketing campaign in under 60 seconds.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <Link href="/register" className={`${MKT_BTN_PRIMARY} group`}>
              <Sparkles className="w-5 h-5" />
              <span>Try It Now — It&apos;s Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
