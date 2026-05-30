'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Eye,
  ShoppingCart,
  Megaphone,
  Zap,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
  Users,
  HelpCircle,
  Trophy,
  Smile,
  Clock,
  Shield,
  Heart,
  Instagram,
  Linkedin,
  Image as ImageIcon,
} from 'lucide-react';
import { BorderBeam } from '@/components/BorderBeam';
import { usePipelineStore } from '@/store/pipeline';
import type { CampaignStrategy } from '@/types';
import type { BrandDNA } from '@/types';
import type { ImagePrompt } from '@/types';
import { api } from '~/trpc/react';
import { APP_BTN_PRIMARY, APP_CARD } from '~/lib/marketingTheme';

const CREATIVE_ASPECT_OPTIONS: {
  value: ImagePrompt['aspectRatio'];
  label: string;
  ratio: string;
}[] = [
  { value: '9:16', label: 'Story', ratio: '9:16' },
  { value: '1:1', label: 'Square', ratio: '1:1' },
  { value: '4:5', label: 'Feed', ratio: '4:5' },
];

const goalIcons = {
  awareness: Eye,
  consideration: Target,
  conversion: ShoppingCart,
};

const goalColors = {
  awareness: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    gradient: 'from-blue-50 to-sky-50',
  },
  consideration: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    gradient: 'from-violet-50 to-purple-50',
  },
  conversion: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    gradient: 'from-emerald-50 to-teal-50',
  },
};

const emotionalLevers = {
  aspiration: { icon: Trophy, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  fear: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  belonging: { icon: Users, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  curiosity: { icon: HelpCircle, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  pride: { icon: Trophy, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  relief: { icon: Smile, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  urgency: { icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  trust: { icon: Shield, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
};

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
};

function CampaignCard({
  campaign,
  index,
  isSelected,
  onSelect
}: {
  campaign: CampaignStrategy;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const GoalIcon = goalIcons[campaign.goal] || Target;
  const colors = goalColors[campaign.goal] || goalColors.consideration;
  const emotion = campaign.emotionalLever ? emotionalLevers[campaign.emotionalLever] : null;
  const EmotionIcon = emotion?.icon || Heart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`
        relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
        ${isSelected
          ? `${colors.border} bg-gradient-to-br ${colors.gradient} shadow-md ring-2 ring-[#FAD400]/30`
          : 'border-neutral-200 bg-white hover:border-[#FAD400]/40 hover:shadow-sm'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAD400] flex items-center justify-center shadow-lg"
        >
          <Check className="w-5 h-5 text-neutral-900" />
        </motion.div>
      )}

      {/* Badges row: Goal + Emotional Lever */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.bg} ${colors.border} border`}>
          <GoalIcon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-sm font-medium ${colors.text} capitalize`}>{campaign.goal}</span>
        </div>
        {emotion && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border ${emotion.bg}`}>
            <EmotionIcon className={`w-3.5 h-3.5 ${emotion.color}`} />
            <span className={`text-xs font-medium ${emotion.color} capitalize`}>{campaign.emotionalLever}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-display font-bold text-[#FAD400] mb-3">{campaign.title}</h3>

      {/* Strategic Angle */}
      <p className="text-neutral-600 text-sm mb-4 leading-relaxed line-clamp-3 font-light">
        {campaign.strategicAngle}
      </p>

      {/* Pain Point (if available) */}
      {campaign.audiencePainPoint && (
        <div className="text-xs text-neutral-500 mb-4 flex items-start gap-1.5 font-light">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
          <span>
            <span className="text-amber-700 font-mono font-medium uppercase text-[10px] tracking-wide">
              Pain point
            </span>
            : {campaign.audiencePainPoint}
          </span>
        </div>
      )}

      {/* Narrative Hook */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-4 h-4 text-neutral-400" />
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            Narrative Hook
          </span>
        </div>
        <p className="text-neutral-700 italic font-light">&quot;{campaign.narrativeHook}&quot;</p>
      </div>

      {/* Visual Direction (if available) */}
      {campaign.visualDirection && (
        <div className="text-xs text-neutral-500 mb-4 flex items-start gap-1.5 font-light">
          <Eye className="w-3.5 h-3.5 mt-0.5 text-neutral-600 shrink-0" />
          <span>
            <span className="font-mono font-medium uppercase text-[10px] tracking-wide text-neutral-700">
              Visual
            </span>
            : {campaign.visualDirection}
          </span>
        </div>
      )}

      {/* Footer: CTA + Platforms */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-wide">CTA</span>
          <span
            className={`text-sm font-medium capitalize ${campaign.ctaStyle === 'strong' ? 'text-red-600' : campaign.ctaStyle === 'medium' ? 'text-amber-700' : 'text-emerald-700'}`}
          >
            {campaign.ctaStyle}
          </span>
        </div>

        {/* Platform icons */}
        {campaign.bestPlatforms && campaign.bestPlatforms.length > 0 && (
          <div className="flex items-center gap-1.5">
            {campaign.bestPlatforms.slice(0, 3).map((platform) => {
              const PlatformIcon = platformIcons[platform];
              return PlatformIcon ? (
                <PlatformIcon key={platform} className="w-4 h-4 text-neutral-500" />
              ) : (
                <span
                  key={platform}
                  className="text-[10px] font-mono text-neutral-600 uppercase bg-neutral-100 px-1.5 py-0.5 rounded"
                >
                  {platform.slice(0, 2)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Past campaigns history cards
function PastCampaignsSection({
  previews,
  onViewCreatives,
}: {
  previews: { id: string; title: string; setIndex: number; firstImageUrl: string | null }[];
  onViewCreatives: (campaignId?: string) => void;
}) {
  if (previews.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <h2 className="text-lg font-display font-semibold text-[#FAD400] mb-4">Past Campaigns</h2>
      <div className="flex flex-wrap gap-4">
        {previews.map((preview) => (
          <motion.button
            key={preview.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onViewCreatives(preview.id)}
            className={`group w-40 flex-shrink-0 rounded-2xl overflow-hidden ${APP_CARD} text-left p-0 hover:shadow-md`}
          >
            {/* Thumbnail */}
            <div className="relative w-full h-24 bg-neutral-100 overflow-hidden">
              {preview.firstImageUrl ? (
                <img
                  src={preview.firstImageUrl}
                  alt={preview.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-neutral-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-xs font-display font-semibold text-neutral-900 leading-snug line-clamp-2">
                {preview.title}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 font-mono">
                View Creatives <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Prompt input section component
function CampaignPromptSection({
  onGenerate,
  isGenerating,
  aspectRatio,
  onAspectRatioChange,
}: {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  aspectRatio: ImagePrompt['aspectRatio'];
  onAspectRatioChange: (v: ImagePrompt['aspectRatio']) => void;
}) {
  const [promptText, setPromptText] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-[#FAD400] text-sm font-display font-semibold">AI Campaign Generator</span>
      </div>

      {/* Main prompt card */}
      <div className="max-w-3xl mx-auto">
        <BorderBeam duration={8} beamWidth={2}>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe the campaign you want to create..."
            className="w-full bg-transparent text-neutral-900 placeholder-neutral-400 px-5 py-4 resize-none focus:outline-none text-base leading-relaxed min-h-[80px] font-light"
            rows={2}
            disabled={isGenerating}
          />

          <div className="px-5 py-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-t border-neutral-200">
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-wider">
                Creative aspect ratio
              </p>
              <div className="flex flex-wrap gap-2">
                {CREATIVE_ASPECT_OPTIONS.map((opt) => {
                  const selected = aspectRatio === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onAspectRatioChange(opt.value)}
                      disabled={isGenerating}
                      className={`
                        px-3 py-2 rounded-xl text-xs border transition-all disabled:opacity-50 font-mono
                        ${selected
                          ? 'border-[#FAD400] bg-[#FAD400]/15 text-neutral-900 ring-1 ring-[#FAD400]/40 font-medium'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                        }
                      `}
                    >
                      <span className="font-display font-semibold">{opt.label}</span>
                      <span className="text-neutral-400 ml-1">({opt.ratio})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onGenerate(promptText)}
              disabled={isGenerating}
              className={`flex shrink-0 items-center justify-center gap-2 px-5 py-2.5 rounded-xl ${APP_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Suggest Ideas</span>
                </>
              )}
            </button>
          </div>
        </BorderBeam>

        {/* Disclaimer */}
        <p className="text-center text-neutral-500 text-xs mt-3 font-light">
          AI can make mistakes, so double-check it.
        </p>

        {/* Quick suggestion chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {['Valentine\'s Day', 'Black Friday', 'Summer Sale', 'Product Launch', 'Brand Awareness'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setPromptText(chip + ' campaign')}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-full text-xs font-light text-neutral-600 bg-white border border-neutral-200 hover:border-[#FAD400]/50 hover:text-neutral-900 transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;

  const [creativeAspectRatio, setCreativeAspectRatio] = useState<ImagePrompt['aspectRatio']>('1:1');
  const [billingInfo, setBillingInfo] = useState<{
    creditBalance: number;
    monthlyCredits: number;
    planId: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const selectedCampaign = usePipelineStore((state) => state.selectedCampaign);
  const brandDNA = usePipelineStore((state) => state.brandDNA);
  const setBrandDNA = usePipelineStore((state) => state.setBrandDNA);
  const setSelectedCampaign = usePipelineStore((state) => state.setSelectedCampaign);
  const setCreatives = usePipelineStore((state) => state.setCreatives);
  const setImagePrompts = usePipelineStore((state) => state.setImagePrompts);

  const {
    data: projectCampaignData,
    isLoading: isLoadingProjectData,
    refetch,
  } = api.campaign.getProjectCampaignSets.useQuery(
    { projectId: projectIdFromQuery },
    {
      refetchOnWindowFocus: false,
    },
  );

  const generateCampaignsMutation = api.campaign.generate.useMutation();
  const generateCreativesMutation = api.campaign.generateCreatives.useMutation();

  const resolvedBrandDNA =
    brandDNA ?? (projectCampaignData?.brandDNA as BrandDNA | null) ?? null;

  useEffect(() => {
    if (!projectCampaignData) return;

    setProjectId(projectCampaignData.projectId);

    if (projectCampaignData.brandDNA) {
      setBrandDNA(projectCampaignData.brandDNA as BrandDNA);
    }

  }, [projectCampaignData, setBrandDNA]);

  useEffect(() => {
    let cancelled = false;
    const loadBilling = async () => {
      try {
        const res = await fetch('/api/billing/portal');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.data) {
          setBillingInfo(json.data);
          const plan = json.data.planId;
          if (
            plan === 'free' ||
            plan === 'starter' ||
            plan === 'pro' ||
            plan === 'agency'
          ) {
            usePipelineStore.getState().setUserPlan(plan);
          }
        }
      } catch {
        // billing panel is optional
      }
    };
    void loadBilling();
    return () => {
      cancelled = true;
    };
  }, []);

  const campaignPreviews = (projectCampaignData?.campaignPreviews ?? []) as {
    id: string;
    title: string;
    setIndex: number;
    firstImageUrl: string | null;
  }[];

  const currentSuggestions = (projectCampaignData?.currentSuggestions ?? []) as CampaignStrategy[];

  const handleSuggestIdeas = async (userPrompt: string) => {
    const activeProjectId = projectId ?? projectIdFromQuery;
    if (!activeProjectId) return;

    const historyCampaigns = (projectCampaignData?.campaignSets ?? []).flatMap((s) => s.campaigns);
    const previousTitles = historyCampaigns.map((c) => c.title).filter(Boolean);
    const previousHooks = historyCampaigns.map((c) => c.narrativeHook).filter(Boolean);
    const previousAngles = historyCampaigns.map((c) => c.strategicAngle).filter(Boolean);

    const hasPrevious =
      previousTitles.length > 0 ||
      previousHooks.length > 0 ||
      previousAngles.length > 0;

    setIsRegenerating(true);
    try {
      const result = await generateCampaignsMutation.mutateAsync({
        projectId: activeProjectId,
        userPrompt: userPrompt || undefined,
        previousContext: hasPrevious
          ? {
              titles: previousTitles.slice(-15),
              hooks: previousHooks.slice(-9),
              angles: previousAngles.slice(-9),
            }
          : undefined,
      });

      if (result.campaigns && result.campaigns.length > 0) {
        setSelectedCampaign(null);
        await refetch();
      }
    } catch (error) {
      console.error('Error generating campaign ideas:', error);
      const message = error instanceof Error ? error.message : 'Upgrade required';
      if (message.toLowerCase().includes('limit') || message.toLowerCase().includes('upgrade')) {
        setUpgradeReason(message);
        setShowUpgradeModal(true);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedCampaign || !resolvedBrandDNA) return;

    const activeProjectId = projectId ?? usePipelineStore.getState().projectId;
    if (!activeProjectId) {
      console.error('Project ID is required');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCreativesMutation.mutateAsync({
        projectId: activeProjectId,
        campaign: selectedCampaign,
        aspectRatio: creativeAspectRatio,
      });

      if (result.creatives && result.creatives.length > 0) {
        setCreatives(result.creatives);
      }

      if (result.imagePrompts && result.imagePrompts.length > 0) {
        setImagePrompts(result.imagePrompts as ImagePrompt[]);
      }

      const targetProjectId = activeProjectId ?? projectIdFromQuery;
      router.push(targetProjectId ? `/creatives?projectId=${targetProjectId}` : '/creatives');
    } catch (error) {
      console.error('Error generating creatives:', error);
      const message = error instanceof Error ? error.message : 'Upgrade required';
      if (message.toLowerCase().includes('limit') || message.toLowerCase().includes('upgrade')) {
        setUpgradeReason(message);
        setShowUpgradeModal(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Show prompt section even without campaigns
  if (isLoadingProjectData && !resolvedBrandDNA) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    );
  }

  if (!resolvedBrandDNA) return null;

  const activeProjectId = projectId ?? projectIdFromQuery;

  return (
    <div className="min-h-screen pt-8 pb-8 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-[#FAD400] mb-2">Campaign Strategies</h1>
          <p className="text-neutral-600 font-light">
            Generate campaign ideas or select one to create social media creatives
          </p>
        </motion.div>

        {billingInfo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 ${APP_CARD}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-neutral-600 font-light">
                Plan:{' '}
                <span className="font-display font-semibold capitalize text-neutral-900">
                  {billingInfo.planId}
                </span>
              </p>
              <button
                type="button"
                onClick={() => router.push('/pricing')}
                className="text-xs font-display font-semibold text-neutral-900 hover:text-[#FAD400] transition-colors"
              >
                Upgrade
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-neutral-500 font-mono">
                  <span>Credits</span>
                  <span>
                    {billingInfo.creditBalance.toLocaleString()} /{' '}
                    {billingInfo.monthlyCredits.toLocaleString()} per cycle
                  </span>
                </div>
                <div className="h-2 rounded bg-neutral-200">
                  <div
                    className="h-2 rounded bg-[#FAD400]"
                    style={{
                      width: `${Math.min(
                        100,
                        billingInfo.monthlyCredits
                          ? (billingInfo.creditBalance / billingInfo.monthlyCredits) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pomelli-style Prompt Section */}
        <CampaignPromptSection
          onGenerate={handleSuggestIdeas}
          isGenerating={isRegenerating}
          aspectRatio={creativeAspectRatio}
          onAspectRatioChange={setCreativeAspectRatio}
        />

        {/* Campaigns Section Header */}
        {currentSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <h2 className="text-lg font-display font-semibold text-neutral-900">Generated Campaigns</h2>
          </motion.div>
        )}

        {/* Campaign Cards */}
        <AnimatePresence mode="wait">
          {currentSuggestions.length > 0 && (
            <motion.div
              key={currentSuggestions.map((c) => c.title).join('|')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-3 gap-6 mb-3"
            >
              {currentSuggestions.map((campaign, index) => (
                <CampaignCard
                  key={`${campaign.title}-${index}`}
                  campaign={campaign}
                  index={index}
                  isSelected={selectedCampaign?.title === campaign.title}
                  onSelect={() => setSelectedCampaign(campaign)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Creatives — inline under the grid (sticky so it stays reachable when scrolling to Past Campaigns) */}
        {currentSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`sticky top-20 z-20 mt-2 mb-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ${APP_CARD}`}
          >
            <div className="text-sm text-neutral-600 space-y-1 min-w-0 font-light">
              {selectedCampaign ? (
                <span>
                  Selected:{' '}
                  <span className="font-display font-semibold text-neutral-900">
                    {selectedCampaign.title}
                  </span>
                </span>
              ) : (
                <span>Select a campaign to continue</span>
              )}
              <p className="text-xs text-neutral-500 font-mono">
                Image format:{' '}
                <span className="text-neutral-700">
                  {CREATIVE_ASPECT_OPTIONS.find((o) => o.value === creativeAspectRatio)?.label ?? 'Square'}{' '}
                  ({creativeAspectRatio})
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedCampaign || isGenerating}
              className={`group relative shrink-0 w-full sm:w-auto min-h-[48px] ${APP_BTN_PRIMARY} disabled:opacity-45 disabled:pointer-events-none disabled:hover:translate-y-0`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span>Generating Creatives...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Generate Creatives</span>
                  <ArrowRight className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Empty state when no campaigns */}
        {currentSuggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FAD400]/20 border border-[#FAD400]/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-neutral-700" />
            </div>
            <h3 className="text-lg font-display font-semibold text-neutral-700 mb-2">No campaigns yet</h3>
            <p className="text-neutral-500 text-sm font-light">
              Click "Suggest Ideas" to generate campaign strategies
            </p>
          </motion.div>
        )}

        {/* Past Campaigns Section */}
        <PastCampaignsSection
          previews={campaignPreviews}
          onViewCreatives={(campaignId) =>
            router.push(
              activeProjectId
                ? `/creatives?projectId=${activeProjectId}${campaignId ? `&campaignId=${campaignId}` : ''}`
                : '/creatives'
            )
          }
        />

        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`w-full max-w-md p-6 ${APP_CARD}`}
              >
                <h3 className="mb-2 text-xl font-display font-bold text-[#FAD400]">Upgrade Required</h3>
                <p className="mb-5 text-sm text-neutral-600 font-light">
                  {upgradeReason || 'Your current plan limit is reached for this action.'}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 font-light hover:bg-neutral-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/pricing')}
                    className={`rounded-lg px-4 py-2 text-sm ${APP_BTN_PRIMARY}`}
                  >
                    View Pricing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
