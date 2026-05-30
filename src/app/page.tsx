

'use client';

import { useState, useEffect } from 'react';
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
  Layers,
  Image,
  MessageSquare,
  Megaphone,
  ChevronDown,
  ArrowRight,
  Star,
  Quote,
  Globe,
  Cpu,
  Paintbrush
} from 'lucide-react';
import { Hero } from '../components/Hero';
import { Navbar } from '../components/Navbar';

// ============================================
// Section Components
// ============================================

// Animated Section Wrapper
function Section({
  children,
  className = '',
  id = ''
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`relative py-24 md:py-32 px-4 lg:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

// Section Header
function SectionHeader({
  badge,
  title,
  subtitle,
  align = 'center'
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={`mb-16 md:mb-20 ${align === 'center' ? 'text-center' : ''}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-6 ${align === 'center' ? 'mx-auto' : ''}`}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--hero-blue)] animate-pulse" />
          <span className="text-sm text-surface-300 uppercase tracking-wider">{badge}</span>
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-4"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-lg text-surface-400 leading-relaxed ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

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
    <Section id="how-it-works" className="overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-[var(--hero-blue)]/10 via-transparent to-transparent blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge="Simple Process"
          title="Three steps to <span class='text-gradient-blue'>marketing magic</span>"
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
                    className="h-full bg-gradient-to-r from-surface-600 via-surface-500 to-surface-600 origin-left"
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
                    <ArrowRight className="w-4 h-4 text-surface-500" />
                  </motion.div>
                </div>
              )}

              {/* Card */}
              <div className="relative h-full p-8 rounded-3xl bg-surface-900/50 border border-surface-800 overflow-hidden group-hover:border-surface-700 transition-all duration-500">
                {/* Hover Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Step Number - Large Background */}
                <div className="absolute -right-4 -top-4 text-[120px] font-display font-bold text-surface-800/50 select-none leading-none">
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
                  <h3 className="text-xl font-display font-semibold text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-surface-400 leading-relaxed">
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
    </Section>
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
    <Section className="bg-surface-950">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      {/* Floating Orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-radial from-[var(--hero-blue)]/20 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-gradient-radial from-[var(--hero-orange)]/15 to-transparent blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge="Capabilities"
          title="Everything you need to <span class='text-gradient-orange'>dominate</span>"
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
              <div className="relative h-full p-6 rounded-2xl glass-morphism border border-surface-800/50 overflow-hidden hover:border-[var(--hero-blue)]/30 transition-all duration-300">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />

                {/* Tag */}
                <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--hero-blue)] bg-[var(--hero-blue)]/10 rounded-md mb-4">
                  {feature.tag}
                </span>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-surface-300 group-hover:text-[var(--hero-blue)] transition-colors duration-300" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-display font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-surface-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
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
    <Section className="overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-950 to-surface-900" />

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear'
            }}
            className="absolute h-px bg-gradient-to-r from-transparent via-[var(--hero-blue)]/30 to-transparent"
            style={{ top: `${20 + i * 15}%`, width: '50%' }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge="Technology"
          title="6-Layer <span class='text-gradient-purple'>AI Pipeline</span>"
          subtitle="Watch your brand transform through our proprietary multi-stage AI processing system."
        />

        {/* Pipeline Visualization */}
        <div className="relative">
          {/* Central Connection */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2">
            <div className="h-full bg-gradient-to-r from-[var(--hero-blue)]/20 via-purple-500/30 to-[var(--hero-orange)]/20 rounded-full" />
            {/* Animated Pulse */}
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
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
                  <div className="relative p-6 rounded-2xl bg-surface-900/80 border border-surface-800 backdrop-blur-sm group-hover:border-surface-600 transition-all duration-300">
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
                      <h4 className="text-white font-semibold mt-1 mb-1">
                        {layer.name}
                      </h4>
                      <p className="text-xs text-surface-500">
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
            <div key={index} className="text-center p-6 rounded-xl bg-surface-900/30 border border-surface-800/50">
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient-blue mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-surface-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
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
    <Section className="bg-surface-950">
      {/* Geometric Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-conic from-[var(--hero-blue)]/10 via-transparent to-[var(--hero-orange)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-conic from-purple-500/10 via-transparent to-[var(--hero-blue)]/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge="Industries"
          title="Built for <span class='text-gradient-orange'>every</span> business"
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
              <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-surface-900 to-surface-950 border border-surface-800 overflow-hidden">
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--hero-blue)]/5 to-[var(--hero-orange)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon — slight scale + fade after card stagger */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08 + 0.12,
                    ease: USE_CASE_EASE,
                  }}
                  className="relative w-14 h-14 rounded-2xl bg-surface-800/80 flex items-center justify-center mb-6 group-hover:bg-[var(--hero-blue)]/20 transition-colors duration-300"
                >
                  <useCase.icon className="w-7 h-7 text-surface-300 group-hover:text-[var(--hero-blue)] transition-colors duration-300" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-display font-semibold text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-surface-400 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 text-xs text-surface-400 bg-surface-800/50 rounded-full border border-surface-700/50"
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
                  <ArrowRight className="w-5 h-5 text-[var(--hero-blue)]" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
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
    <Section className="overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900" />

      {/* Floating Quotes */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-20 left-10 text-surface-800"
      >
        <Quote className="w-24 h-24" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-20 right-10 text-surface-800"
      >
        <Quote className="w-32 h-32" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge="Social Proof"
          title="Loved by <span class='text-gradient-blue'>marketers</span> worldwide"
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
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-surface-500">
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
              <div className="relative h-full p-8 rounded-3xl glass-morphism border border-surface-800/50 hover:border-[var(--hero-blue)]/30 transition-all duration-300 overflow-hidden">
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--hero-blue)]/5 to-[var(--hero-orange)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                <p className="relative text-surface-200 leading-relaxed mb-8 text-lg group-hover:text-white transition-colors duration-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="relative flex items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-120px 0px -40px 0px' }}
                    transition={{ duration: 0.45, delay: index * 0.08 + 0.12, ease: USE_CASE_EASE }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--hero-blue)] to-[var(--hero-orange)] flex items-center justify-center text-white font-semibold text-sm shrink-0 group-hover:shadow-lg group-hover:shadow-[var(--hero-blue)]/20 transition-shadow duration-300"
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <div className="font-semibold text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-surface-500 group-hover:text-surface-400 transition-colors duration-300">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Decorative Quote Mark */}
                <div className="absolute top-6 right-6 text-surface-800/50 group-hover:text-[var(--hero-blue)]/20 transition-colors duration-300">
                  <Quote className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
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
    <Section className="bg-surface-950">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative max-w-4xl mx-auto">
        <SectionHeader
          badge="FAQ"
          title="Got <span class='text-gradient-purple'>questions?</span>"
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
                className="w-full p-6 rounded-2xl bg-surface-900/50 border border-surface-800 hover:border-surface-700 transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-[var(--hero-blue)] transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-surface-500" />
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
                      <p className="pt-4 text-surface-400 leading-relaxed border-t border-surface-800 mt-4">
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
    </Section>
  );
}

// ============================================
// 7. CTA SECTION
// ============================================
function CTASection() {
  return (
    <Section className="overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hero-blue)]/20 via-purple-500/10 to-[var(--hero-orange)]/20" />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 94, 245, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(255, 122, 61, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 94, 245, 0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute top-10 left-[10%]"
      >
        <Cpu className="w-8 h-8 text-[var(--hero-blue)]/30" />
      </motion.div>
      <motion.div
        animate={{ y: [10, -10, 10], rotate: [360, 180, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-10 right-[15%]"
      >
        <Zap className="w-10 h-10 text-[var(--hero-orange)]/30" />
      </motion.div>
      <motion.div
        animate={{ y: [5, -15, 5] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/3 right-[10%]"
      >
        <Layers className="w-6 h-6 text-purple-500/30" />
      </motion.div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-8"
        >
          <Sparkles className="w-4 h-4 text-[var(--hero-blue)]" />
          <span className="text-sm text-surface-300">Start for free</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white mb-6"
        >
          Ready to transform your
          <br />
          <span className="text-gradient-rainbow">marketing?</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-surface-300 mb-10 max-w-2xl mx-auto"
        >
          Join thousands of marketers creating campaigns at the speed of thought.
          No credit card required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group relative px-8 py-4 bg-[var(--hero-blue)] hover:bg-[#4a6cf7] text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-3 shadow-xl shadow-[var(--hero-blue)]/25 overflow-hidden"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
            <span className="relative">Start Creating Now</span>
            <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <button className="px-8 py-4 text-surface-300 hover:text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 border border-surface-700 hover:border-surface-500">
            <span>See Examples</span>
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-surface-500 text-sm"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Instant setup
          </span>
          <span className="w-1 h-1 rounded-full bg-surface-600" />
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            No credit card
          </span>
          <span className="w-1 h-1 rounded-full bg-surface-600" />
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            5 free campaigns
          </span>
        </motion.div>
      </div>
    </Section>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  return (
    <footer className="relative py-12 px-4 lg:px-8 border-t border-surface-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--hero-blue)] to-[var(--hero-orange)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-white">Azziop</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-surface-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-surface-500">
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
    <div className="relative">
      <Navbar />
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
