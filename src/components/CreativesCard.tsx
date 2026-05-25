'use client';

import { motion } from 'framer-motion';
import { 
  Palette, 
  Layout, 
  Type, 
  Image,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';
import { useState } from 'react';
import type { SocialCreative, ImagePrompt, GeneratedImage } from '@/types';

const layoutLabels: Record<string, string> = {
  'hero-center': 'Hero Center',
  'split-left': 'Split Left',
  'split-right': 'Split Right',
  'minimal-bottom': 'Minimal Bottom',
  'full-bleed': 'Full Bleed',
  'card-stack': 'Card Stack',
  'diagonal-split': 'Diagonal Split',
};

const overlayLabels: Record<string, string> = {
  'gradient-dark': 'Dark Gradient',
  'gradient-light': 'Light Gradient',
  'solid-dark': 'Solid Dark',
  'solid-light': 'Solid Light',
  'blur-heavy': 'Heavy Blur',
  'blur-light': 'Light Blur',
  'duotone': 'Duotone',
  'none': 'None',
};

function CreativeCard({ 
  creative, 
  index, 
  imagePrompt,
  generatedImage 
}: { 
  creative: SocialCreative; 
  index: number;
  imagePrompt?: ImagePrompt;
  generatedImage?: GeneratedImage;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = async () => {
    if (imagePrompt) {
      await navigator.clipboard.writeText(imagePrompt.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const narrativeLabels = ['Hook', 'Tension', 'Solution', 'Action'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-surface-700/50 bg-surface-800/30 overflow-hidden"
    >
      {/* Creative Preview */}
      <div className="relative aspect-square bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center">
        {generatedImage && generatedImage.imageUrl ? (
          <img 
            src={generatedImage.imageUrl} 
            alt={creative.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-surface-500" />
            </div>
            <p className="text-surface-500 text-sm">Image preview not generated</p>
          </div>
        )}
        
        {/* Narrative label */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-xs font-medium text-white">
            {index + 1}. {narrativeLabels[index] || 'Creative'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Headline */}
        <h3 className="text-lg font-semibold text-white mb-2">{creative.headline}</h3>
        
        {/* Description */}
        <p className="text-surface-400 text-sm mb-4">{creative.description}</p>

        {/* CTA */}
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <span className="text-sm font-medium text-indigo-400">{creative.cta}</span>
        </div>

        {/* Layout & Style Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-surface-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Layout className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-xs text-surface-500">Layout</span>
            </div>
            <span className="text-sm text-surface-300">{layoutLabels[creative.layout]}</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Palette className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-xs text-surface-500">Overlay</span>
            </div>
            <span className="text-sm text-surface-300">{overlayLabels[creative.overlayStyle]}</span>
          </div>
        </div>

        {/* Text Style */}
        <div className="p-3 rounded-lg bg-surface-800/50 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Type className="w-3.5 h-3.5 text-surface-500" />
            <span className="text-xs text-surface-500">Text Style</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-700/50 text-xs text-surface-400 capitalize">
              {creative.textStyle.fontWeight}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-700/50 text-xs text-surface-400 capitalize">
              {creative.textStyle.alignment}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-700/50 text-xs text-surface-400">
              {creative.textStyle.hierarchy === 'headline-dominant' ? 'Headline Focus' : 'Balanced'}
            </span>
          </div>
        </div>

        {/* Image Intent */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/10">
          <div className="flex items-center gap-1.5 mb-2">
            <Image className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-purple-400">Image Intent</span>
          </div>
          <p className="text-sm text-surface-300 italic">{creative.imageIntent}</p>
        </div>

        {/* Image Prompt (Collapsible) */}
        {imagePrompt && (
          <div className="mt-4 pt-4 border-t border-surface-700/50">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full flex items-center justify-between text-surface-400 hover:text-surface-300 transition-colors"
            >
              <span className="text-xs uppercase tracking-wide">Image Generation Prompt</span>
              {showPrompt ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <div className="p-3 rounded-lg bg-surface-900 border border-surface-700">
                  <p className="text-xs text-surface-400 font-mono leading-relaxed mb-3">
                    {imagePrompt.prompt}
                  </p>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CreativesCard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const creatives = usePipelineStore((state) => state.creatives);
  const imagePrompts = usePipelineStore((state) => state.imagePrompts);
  const generatedImages = usePipelineStore((state) => state.generatedImages);
  const selectedCampaign = usePipelineStore((state) => state.selectedCampaign);
  const setGeneratedImages = usePipelineStore((state) => state.setGeneratedImages);

  const handleGenerateImages = async () => {
    if (!imagePrompts || imagePrompts.length === 0 || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/layer5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompts }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.generatedImages) {
        setGeneratedImages(result.data.generatedImages);
      } else {
        console.error('Image generation failed:', result.error);
      }
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!creatives || creatives.length === 0) return null;

  const hasImages = generatedImages && generatedImages.length > 0 && generatedImages.some(img => img.imageUrl);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="px-4 py-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <Palette className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="heading-3 text-white">Social Creatives</h2>
                {selectedCampaign && (
                  <p className="text-surface-400 text-sm">
                    For campaign: <span className="text-cyan-400">{selectedCampaign.title}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-surface-500">
                {creatives.length} creatives • Narrative arc
              </div>
              {imagePrompts && imagePrompts.length > 0 && !hasImages && (
                <button
                  onClick={handleGenerateImages}
                  disabled={isGenerating}
                  className="btn-primary flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Images</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Creative Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {creatives.map((creative, index) => (
              <CreativeCard
                key={index}
                creative={creative}
                index={index}
                imagePrompt={imagePrompts.find(p => p.creativeIndex === index)}
                generatedImage={generatedImages.find(i => i.creativeIndex === index)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

