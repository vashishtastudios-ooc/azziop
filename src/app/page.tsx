

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Dna,
  Target,
  Palette,
  Link2,
  Brain,
  Wand2,
  ShoppingBag,
  Building2,
  Rocket,
  User,
  Users,
  Zap,
  Image,
  MessageSquare,
  Megaphone,
  ChevronDown,
  ArrowRight,
  Star,
  Quote,
  Globe,
  Paintbrush
} from 'lucide-react';
import { Hero } from '../components/Hero';
import { AzziopLogo } from '~/components/branding/AzziopLogo';
import { MarketingNavbar } from '~/components/marketing/MarketingNavbar';
import {
  MarketingSection,
  MarketingSectionHeader,
} from '~/components/marketing/MarketingSection';

const CARD =
  'rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-[#FAD400]/35 transition-all duration-300';
const CARD_LG =
  'rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg hover:border-[#FAD400]/35 transition-all duration-300';

// ============================================
// 1. HOW IT WORKS SECTION
// ============================================
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Link2,
      title: 'Drop Your URL',
      description: 'Paste any website URL — your brand, competitor, or inspiration source.',
      color: 'var(--hero-blue)',
      gradient: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      number: '02',
      icon: Brain,
      title: 'AI Analyzes',
      description: 'Our 6-layer AI pipeline extracts brand DNA, voice, and visual identity.',
      color: 'var(--hero-orange)',
      gradient: 'from-orange-500/20 to-red-500/20'
    },
    {
      number: '03',
      icon: Wand2,
      title: 'Get Creatives',
      description: 'Receive ready-to-use campaigns, copy, and AI-generated visuals.',
      color: '#22c55e',
      gradient: 'from-emerald-500/20 to-green-500/20'
    }
  ];

  return (
    <MarketingSection id="how-it-works" className="overflow-hidden" alt>
      <div className="absolute inset-0 marketing-dot-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(250,212,0,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <MarketingSectionHeader
          badge="Simple Process"
          title="Three steps to <span class='text-[#FAD400]'>marketing magic</span>"
          subtitle="From URL to campaign-ready creatives in under 60 seconds. No design skills needed."
        />

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-full w-full h-px z-10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                    className="h-full bg-gradient-to-r from-neutral-200 via-[#FAD400]/60 to-neutral-200 origin-left"
                    style={{
                      maskImage: 'linear-gradient(to right, black, black 80%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to right, black, black 80%, transparent)'
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.2 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </motion.div>
                </div>
              )}

              {/* Card */}
              <div className={`relative h-full p-8 overflow-hidden group ${CARD_LG}`}>
                {/* Hover Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Step Number - Large Background */}
                <div className="absolute -right-4 -top-4 text-[120px] font-display font-bold text-neutral-100 select-none leading-none">
                  {step.number}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                      boxShadow: `0 8px 32px ${step.color}20`
                    }}
                  >
                    <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  </motion.div>

                  {/* Step Label */}
                  <span
                    className="text-xs font-mono uppercase tracking-wider mb-2 block"
                    style={{ color: step.color }}
                  >
                    Step {step.number}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-display font-semibold text-neutral-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Corner Decoration */}
                <div
                  className="absolute bottom-0 right-0 w-24 h-24 opacity-20"
                  style={{
                    background: `radial-gradient(circle at bottom right, ${step.color}, transparent 70%)`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// 2. FEATURES SECTION
// ============================================
function FeaturesSection() {
  const features = [
    {
      icon: Dna,
      title: 'Brand DNA Extraction',
      description: 'Deep analysis of visual identity, voice, values, and positioning from any website.',
      tag: 'Core'
    },
    {
      icon: Target,
      title: 'Campaign Strategy',
      description: 'AI-generated marketing angles, messaging frameworks, and audience targeting.',
      tag: 'Strategy'
    },
    {
      icon: Palette,
      title: 'Visual Creatives',
      description: 'Ready-to-post social media graphics with on-brand colors and typography.',
      tag: 'Design'
    },
    {
      icon: Image,
      title: 'AI Image Generation',
      description: 'Custom product shots and lifestyle images generated from your brand DNA.',
      tag: 'AI'
    },
    {
      icon: MessageSquare,
      title: 'Copy & Headlines',
      description: 'Compelling ad copy, taglines, and CTAs matched to your brand voice.',
      tag: 'Content'
    },
    {
      icon: Megaphone,
      title: 'Multi-Platform Ready',
      description: 'Exports optimized for Instagram, Facebook, Twitter, LinkedIn, and more.',
      tag: 'Export'
    }
  ];

  return (
    <MarketingSection>
      <div className="absolute inset-0 marketing-dot-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <MarketingSectionHeader
          badge="Capabilities"
          title="Everything you need to <span class='text-[#FAD400]'>dominate</span>"
          subtitle="A complete AI marketing suite that transforms how you create campaigns."
        />

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={`relative h-full p-6 overflow-hidden group ${CARD}`}>
                {/* Tag */}
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-800 bg-[#FAD400]/25 border border-[#FAD400]/40 rounded-md mb-4">
                  {feature.tag}
                </span>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#FAD400]/10 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-neutral-600 group-hover:text-neutral-900 transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-display font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// 3. PIPELINE SECTION
// ============================================
function PipelineSection() {
  const layers = [
    {
      number: 1,
      name: 'Brand DNA',
      description: 'Extract core identity',
      icon: Dna,
      color: '#3B5EF5'
    },
    {
      number: 2,
      name: 'Strategy',
      description: 'Generate campaign angles',
      icon: Target,
      color: '#6366f1'
    },
    {
      number: 3,
      name: 'Creative',
      description: 'Design visual concepts',
      icon: Paintbrush,
      color: '#8b5cf6'
    },
    {
      number: 4,
      name: 'Imagery',
      description: 'Create AI visuals',
      icon: Image,
      color: '#a855f7'
    },
    {
      number: 5,
      name: 'Copy',
      description: 'Write compelling text',
      icon: MessageSquare,
      color: '#d946ef'
    },
    {
      number: 6,
      name: 'Export',
      description: 'Multi-platform ready',
      icon: Megaphone,
      color: '#FF7A3D'
    }
  ];

  return (
    <MarketingSection className="overflow-hidden" alt>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(250,212,0,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <MarketingSectionHeader
          badge="Technology"
          title="6-Layer <span class='text-[#FAD400]'>AI Pipeline</span>"
          subtitle="Watch your brand transform through our proprietary multi-stage AI processing system."
        />

        {/* Pipeline Visualization */}
        <div className="relative">
          {/* Central Connection */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2">
            <div className="h-full bg-gradient-to-r from-[#FAD400]/20 via-[#FAD400]/40 to-[#FAD400]/20 rounded-full" />
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-[#FAD400]/50 to-transparent rounded-full"
            />
          </div>

          {/* Layers */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {layers.map((layer, index) => (
              <motion.div
                key={layer.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative">
                  {/* Glow on Hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                    style={{ background: layer.color }}
                  />

                  {/* Card */}
                  <div className={`relative p-6 backdrop-blur-sm group ${CARD}`}>
                    {/* Layer Number */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 relative"
                      style={{
                        background: `linear-gradient(135deg, ${layer.color}30, ${layer.color}10)`,
                        border: `2px solid ${layer.color}50`
                      }}
                    >
                      <layer.icon className="w-5 h-5" style={{ color: layer.color }} />

                      {/* Pulse Ring */}
                      <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full"
                        style={{ border: `1px solid ${layer.color}` }}
                      />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center">
                      <span
                        className="text-xs font-mono"
                        style={{ color: layer.color }}
                      >
                        Layer {layer.number}
                      </span>
                      <h4 className="text-neutral-900 font-semibold mt-1 mb-1">
                        {layer.name}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '<60s', label: 'Processing Time' },
            { value: '6', label: 'AI Layers' },
            { value: '∞', label: 'Possibilities' },
            { value: '100%', label: 'AI-Powered' }
          ].map((stat, index) => (
            <div key={index} className={`text-center p-6 ${CARD}`}>
              <div className="text-3xl md:text-4xl font-display font-bold text-[#FAD400] mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </MarketingSection>
  );
}

/** 3-col directional enter: left / center / right */
function useCaseEnterX(index: number): number {
  const col = index % 3;
  if (col === 0) return -22;
  if (col === 2) return 22;
  return 0;
}

const USE_CASE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ============================================
// 4. USE CASES SECTION
// ============================================
function UseCasesSection() {
  const useCases = [
    {
      icon: ShoppingBag,
      title: 'E-Commerce',
      description: 'Generate product campaigns, seasonal promos, and conversion-focused ads.',
      examples: ['Product launches', 'Sale campaigns', 'Retargeting ads']
    },
    {
      icon: Building2,
      title: 'Local Business',
      description: 'Create location-based marketing that connects with your community.',
      examples: ['Grand openings', 'Event promos', 'Service highlights']
    },
    {
      icon: Rocket,
      title: 'SaaS Products',
      description: 'Build feature announcements, onboarding content, and demo visuals.',
      examples: ['Feature launches', 'Case studies', 'Comparison ads']
    },
    {
      icon: User,
      title: 'Personal Brands',
      description: 'Craft a consistent visual identity across all your social platforms.',
      examples: ['Profile branding', 'Content series', 'Announcement posts']
    },
    {
      icon: Users,
      title: 'Agencies',
      description: 'Scale client deliverables with rapid campaign generation.',
      examples: ['Client pitches', 'Multi-brand campaigns', 'Quick iterations']
    },
    {
      icon: Globe,
      title: 'Global Brands',
      description: 'Maintain brand consistency while adapting for local markets.',
      examples: ['Localization', 'Campaign variants', 'A/B testing']
    }
  ];

  return (
    <MarketingSection>
      <div className="absolute inset-0 marketing-dot-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <MarketingSectionHeader
          badge="Industries"
          title="Built for <span class='text-[#FAD400]'>every</span> business"
          subtitle="From startups to enterprises, our AI adapts to your unique marketing needs."
        />

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20, x: useCaseEnterX(index) }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
                ease: USE_CASE_EASE,
              }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className={`relative h-full p-8 overflow-hidden group ${CARD_LG}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08 + 0.12,
                    ease: USE_CASE_EASE,
                  }}
                  className="relative w-14 h-14 rounded-2xl bg-[#FAD400]/15 border border-[#FAD400]/30 flex items-center justify-center mb-6 group-hover:bg-[#FAD400]/25 transition-colors duration-300"
                >
                  <useCase.icon className="w-7 h-7 text-neutral-700 group-hover:text-neutral-900 transition-colors duration-300" />
                </motion.div>

                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 text-xs text-neutral-600 bg-neutral-50 rounded-full border border-neutral-200"
                    >
                      {example}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="absolute bottom-8 right-8"
                >
                  <ArrowRight className="w-5 h-5 text-[#FAD400]" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// 5. TESTIMONIALS SECTION
// ============================================
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Azziop cut our campaign creation time by 90%. What used to take days now takes minutes.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow Inc.",
      avatar: "SC"
    },
    {
      quote: "The AI understands our brand better than some agencies we've worked with. The creatives are spot-on every time.",
      author: "Marcus Rodriguez",
      role: "Founder",
      company: "Bloom Commerce",
      avatar: "MR"
    },
    {
      quote: "We've 10x'd our social content output without adding headcount. This is the future of marketing.",
      author: "Emily Watson",
      role: "Head of Growth",
      company: "ScaleUp Labs",
      avatar: "EW"
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Campaigns Generated' },
    { value: '500+', label: 'Brands Served' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <MarketingSection className="overflow-hidden" alt>
      <div className="absolute top-20 left-10 text-[#FAD400]/10 pointer-events-none">
        <Quote className="w-24 h-24" />
      </div>
      <div className="absolute bottom-20 right-10 text-[#FAD400]/10 pointer-events-none">
        <Quote className="w-32 h-32" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <MarketingSectionHeader
          badge="Social Proof"
          title="Loved by <span class='text-[#FAD400]'>marketers</span> worldwide"
          subtitle="Join thousands of brands transforming their marketing with AI."
        />

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-500">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, x: useCaseEnterX(index) }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
                ease: USE_CASE_EASE,
              }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className={`relative h-full p-8 overflow-hidden group ${CARD_LG}`}>
                {/* Stars */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
                  transition={{ duration: 0.45, delay: index * 0.08 + 0.06, ease: USE_CASE_EASE }}
                  className="relative flex gap-1 mb-6"
                >
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </motion.div>

                {/* Quote */}
                <p className="relative text-neutral-700 leading-relaxed mb-8 text-lg group-hover:text-neutral-900 transition-colors duration-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="relative flex items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
                    transition={{ duration: 0.45, delay: index * 0.08 + 0.12, ease: USE_CASE_EASE }}
                    className="w-12 h-12 rounded-full bg-[#FAD400] flex items-center justify-center text-neutral-900 font-semibold text-sm shrink-0 group-hover:shadow-lg group-hover:shadow-[#FAD400]/30 transition-shadow duration-300"
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <div className="font-semibold text-neutral-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-neutral-500 group-hover:text-neutral-600 transition-colors duration-300">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Decorative Quote Mark */}
                <div className="absolute top-6 right-6 text-neutral-200 group-hover:text-[#FAD400]/40 transition-colors duration-300">
                  <Quote className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// 6. FAQ SECTION
// ============================================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How long does it take to generate a campaign?",
      answer: "Our 6-layer AI pipeline processes most websites in under 60 seconds. Complex sites with lots of content may take slightly longer, but you'll typically have complete campaign assets within 2 minutes."
    },
    {
      question: "What platforms are supported for export?",
      answer: "We generate optimized creatives for all major social platforms including Instagram (posts, stories, reels), Facebook, Twitter/X, LinkedIn, TikTok, and Pinterest. Each export is sized and formatted specifically for that platform."
    },
    {
      question: "Can I edit the generated creatives?",
      answer: "Absolutely! All generated creatives can be edited in our built-in editor. Adjust colors, text, layouts, and images to perfectly match your vision before exporting."
    },
    {
      question: "What if the AI misunderstands my brand?",
      answer: "You can refine the brand DNA extraction by providing additional context or correcting specific elements. The AI learns from your feedback to generate more accurate results in future sessions."
    },
    {
      question: "Is there a limit to how many campaigns I can generate?",
      answer: "This depends on your plan. Free users get 5 campaigns per month. Pro users get unlimited campaign generation with priority processing and advanced features."
    },
    {
      question: "How does the AI image generation work?",
      answer: "We use advanced AI models to generate custom product shots and lifestyle images based on your brand DNA. Simply describe what you want, and the AI creates unique, royalty-free visuals that match your brand aesthetic."
    }
  ];

  return (
    <MarketingSection>
      <div className="absolute inset-0 marketing-dot-grid opacity-15 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <MarketingSectionHeader
          badge="FAQ"
          title="Got <span class='text-[#FAD400]'>questions?</span>"
          subtitle="Everything you need to know about Azziop."
        />

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full p-6 text-left group ${CARD}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-[#FAD400] transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-neutral-600 leading-relaxed border-t border-neutral-200 mt-4">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// 7. CTA SECTION
// ============================================
function CTASection() {
  const router = useRouter();

  return (
    <MarketingSection className="overflow-hidden" alt>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,212,0,0.15)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-white mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#FAD400]" />
          <span className="text-sm text-neutral-600 font-medium">Start for free</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-neutral-900 mb-6"
        >
          Ready to transform your
          <br />
          <span className="text-[#FAD400]">marketing?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto"
        >
          Join thousands of marketers creating campaigns at the speed of thought.
          No credit card required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#FAD400] text-neutral-900 font-semibold rounded-xl marketing-cta-glow hover:-translate-y-1 transition-transform"
          >
            Start Creating Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="group px-8 py-4 text-neutral-700 font-semibold rounded-xl border border-neutral-300 bg-white hover:border-neutral-400 flex items-center gap-2 transition-colors"
          >
            See Examples
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-neutral-500 text-sm"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FAD400]" />
            Instant setup
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FAD400]" />
            No credit card
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#FAD400]" />
            5 free campaigns
          </span>
        </motion.div>
      </div>
    </MarketingSection>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  return (
    <footer className="relative py-12 px-4 lg:px-8 border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <AzziopLogo
            size={32}
            wordmarkClassName="font-display font-semibold text-neutral-900"
          />

          <div className="flex items-center gap-8 text-sm text-neutral-600">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              Terms
            </Link>
            <a href="mailto:hello@azziop.com" className="hover:text-neutral-900 transition-colors">
              Contact
            </a>
          </div>

          <div className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Azziop. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN HOMEPAGE COMPONENT
// ============================================
export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  return (
    <div className="relative bg-white text-neutral-900 min-h-screen font-body font-light">
      <MarketingNavbar />
      <Hero />
      <HowItWorksSection />
      <FeaturesSection />
      <PipelineSection />
      <UseCasesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
