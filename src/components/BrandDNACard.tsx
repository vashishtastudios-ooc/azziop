'use client';

import { motion } from 'framer-motion';
import { 
  Dna, 
  Palette, 
  MessageSquare, 
  TrendingUp, 
  ShieldOff, 
  Gauge, 
  Brain,
  Copy,
  Check
} from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';
import { useState } from 'react';

export function BrandDNACard() {
  const brandDNA = usePipelineStore((state) => state.brandDNA);
  const websiteData = usePipelineStore((state) => state.websiteData);
  const [copied, setCopied] = useState(false);

  if (!brandDNA) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(brandDNA, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    {
      icon: Dna,
      title: 'Brand Values',
      items: brandDNA.brandValues || [],
      color: 'indigo',
    },
    {
      icon: MessageSquare,
      title: 'Tone of Voice',
      items: brandDNA.brandToneOfVoice || [],
      color: 'purple',
    },
    {
      icon: TrendingUp,
      title: 'Marketing Bias',
      items: brandDNA.marketingBias || [],
      color: 'cyan',
    },
    {
      icon: ShieldOff,
      title: 'Avoid List',
      items: brandDNA.avoidList || [],
      color: 'red',
    },
  ];

  const getPositioningColor = (pos: string) => {
    switch (pos) {
      case 'premium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'mid': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'budget': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-surface-400 bg-surface-700 border-surface-600';
    }
  };

  const getMindsetColor = (mindset: string) => {
    switch (mindset) {
      case 'aspirational': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'practical': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'emotional': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'status-driven': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-surface-400 bg-surface-700 border-surface-600';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="px-4 py-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Dna className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="heading-3 text-white">Brand DNA</h2>
              </div>
              {websiteData && (
                <p className="text-surface-400 text-sm">
                  Extracted from <span className="text-indigo-400">{websiteData.url}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="btn-ghost flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Aesthetic Statement */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">Brand Aesthetic</span>
            </div>
            <p className="text-surface-200 leading-relaxed">{brandDNA.brandAesthetic || 'No aesthetic defined'}</p>
          </div>

          {/* Position & Mindset */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-400">Positioning</span>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border capitalize ${getPositioningColor(brandDNA.positioning || 'mid')}`}>
                {brandDNA.positioning || 'mid'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-400">Audience Mindset</span>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border capitalize ${getMindsetColor(brandDNA.audienceMindset || 'practical')}`}>
                {brandDNA.audienceMindset || 'practical'}
              </span>
            </div>
          </div>

          {/* Attribute Sections */}
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section) => (
              <div
                key={section.title}
                className="p-4 rounded-xl bg-surface-800/30 border border-surface-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <section.icon className={`w-4 h-4 text-${section.color}-400`} />
                  <span className="text-sm font-medium text-surface-300">{section.title}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {section.items?.length > 0 ? section.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-surface-700/50 text-surface-300 text-sm"
                    >
                      {item}
                    </span>
                  )) : (
                    <span className="text-surface-500 text-sm italic">No data available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

