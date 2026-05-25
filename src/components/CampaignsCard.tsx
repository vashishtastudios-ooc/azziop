'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Megaphone, 
  ShoppingCart, 
  Eye,
  Zap,
  ArrowRight,
  Check,
  RefreshCw,
  Loader2,
  Heart,
  AlertTriangle,
  Users,
  HelpCircle,
  Trophy,
  Smile,
  Clock,
  Shield,
  Instagram,
  Linkedin
} from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';
import type { CampaignStrategy } from '@/types';

const goalIcons = {
  awareness: Eye,
  consideration: Target,
  conversion: ShoppingCart,
};

const goalColors = {
  awareness: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  consideration: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  conversion: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
};

const ctaStrength = {
  soft: { label: 'Soft', color: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  strong: { label: 'Strong', color: 'text-red-400' },
};

const emotionalLevers = {
  aspiration: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  fear: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  belonging: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  curiosity: { icon: HelpCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  pride: { icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  relief: { icon: Smile, color: 'text-green-400', bg: 'bg-green-500/10' },
  urgency: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  trust: { icon: Shield, color: 'text-teal-400', bg: 'bg-teal-500/10' },
};

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
};

function CampaignCard({ campaign, index, isSelected, onSelect }: { 
  campaign: CampaignStrategy; 
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const GoalIcon = goalIcons[campaign.goal];
  const colors = goalColors[campaign.goal];
  const cta = ctaStrength[campaign.ctaStyle];
  const emotion = campaign.emotionalLever ? emotionalLevers[campaign.emotionalLever] : null;
  const EmotionIcon = emotion?.icon || Heart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`
        relative p-5 rounded-xl border cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-indigo-500/10 border-indigo-500/30 ring-2 ring-indigo-500/20' 
          : 'bg-surface-800/30 border-surface-700/50 hover:border-surface-600'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Badges row: Goal + Emotional Lever */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
          <GoalIcon className={`w-3.5 h-3.5 ${colors.text}`} />
          <span className={`text-xs font-medium ${colors.text} capitalize`}>{campaign.goal}</span>
        </div>
        {emotion && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${emotion.bg} border border-white/5`}>
            <EmotionIcon className={`w-3.5 h-3.5 ${emotion.color}`} />
            <span className={`text-xs font-medium ${emotion.color} capitalize`}>{campaign.emotionalLever}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">{campaign.title}</h3>

      {/* Strategic Angle */}
      <p className="text-surface-400 text-sm mb-3 leading-relaxed">{campaign.strategicAngle}</p>

      {/* Pain Point (if available) */}
      {campaign.audiencePainPoint && (
        <div className="text-xs text-surface-500 mb-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500/70 shrink-0" />
          <span><span className="text-amber-500/70">Pain point:</span> {campaign.audiencePainPoint}</span>
        </div>
      )}

      {/* Narrative Hook */}
      <div className="p-3 rounded-lg bg-surface-800/50 border border-surface-700/50 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="w-3.5 h-3.5 text-surface-500" />
          <span className="text-xs text-surface-500 uppercase tracking-wide">Narrative Hook</span>
        </div>
        <p className="text-surface-200 text-sm italic">&quot;{campaign.narrativeHook}&quot;</p>
      </div>

      {/* Visual Direction (if available) */}
      {campaign.visualDirection && (
        <div className="text-xs text-surface-500 mb-3 flex items-start gap-1.5">
          <Eye className="w-3 h-3 mt-0.5 text-indigo-400/70 shrink-0" />
          <span><span className="text-indigo-400/70">Visual:</span> {campaign.visualDirection}</span>
        </div>
      )}

      {/* Footer: CTA + Platforms */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-surface-500" />
          <span className="text-xs text-surface-500">CTA:</span>
          <span className={`text-xs font-medium ${cta.color}`}>{cta.label}</span>
        </div>
        
        {/* Platform icons */}
        {campaign.bestPlatforms && campaign.bestPlatforms.length > 0 && (
          <div className="flex items-center gap-1">
            {campaign.bestPlatforms.slice(0, 3).map((platform) => {
              const PlatformIcon = platformIcons[platform];
              return PlatformIcon ? (
                <PlatformIcon key={platform} className="w-3.5 h-3.5 text-surface-500" />
              ) : (
                <span key={platform} className="text-[10px] text-surface-600 uppercase">{platform.slice(0,2)}</span>
              );
            })}
          </div>
        )}
        
        <ArrowRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-indigo-400' : 'text-surface-600'}`} />
      </div>
    </motion.div>
  );
}

export function CampaignsCard() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const campaigns = usePipelineStore((state) => state.campaigns);
  const selectedCampaign = usePipelineStore((state) => state.selectedCampaign);
  const brandDNA = usePipelineStore((state) => state.brandDNA);
  const setSelectedCampaign = usePipelineStore((state) => state.setSelectedCampaign);
  const setCreatives = usePipelineStore((state) => state.setCreatives);
  const setImagePrompts = usePipelineStore((state) => state.setImagePrompts);

  const handleRegenerate = async () => {
    if (!selectedCampaign || !brandDNA || isRegenerating) return;
    
    const projectId = usePipelineStore.getState().projectId;
    if (!projectId) {
      console.error('Project ID is required');
      return;
    }
    
    setIsRegenerating(true);
    try {
      // Call Layer 3: Creative Architect
      const layer3Response = await fetch('/api/layer3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          campaign: selectedCampaign, 
          brandDNA 
        }),
      });
      const layer3Result = await layer3Response.json();
      
      if (!layer3Result.success) {
        throw new Error(layer3Result.error);
      }
      
      setCreatives(layer3Result.data.creatives);
      
      // Call Layer 4: Image Prompt Builder with campaign context
      const layer4Response = await fetch('/api/layer4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          creatives: layer3Result.data.creatives, 
          brandDNA,
          campaign: selectedCampaign,
          aspectRatio: '1:1'
        }),
      });
      const layer4Result = await layer4Response.json();
      
      if (layer4Result.success) {
        setImagePrompts(layer4Result.data.imagePrompts);
      }
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="px-4 py-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="heading-3 text-white">Campaign Strategies</h2>
                <p className="text-surface-400 text-sm">Select a campaign and regenerate creatives</p>
              </div>
            </div>
            {selectedCampaign && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="btn-primary flex items-center gap-2"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate Creatives</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Campaign Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {campaigns.map((campaign, index) => (
              <CampaignCard
                key={index}
                campaign={campaign}
                index={index}
                isSelected={selectedCampaign?.title === campaign.title}
                onSelect={() => setSelectedCampaign(campaign)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

