'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Plus,
  Download,
  Edit3,
  Sparkles,
  Loader2,
  Play,
  MoreVertical,
  Image as ImageIcon,
  Upload,
  X,
  Copy,
  CheckCircle2,
  Wand2,
  LayoutTemplate,
} from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';
import type { BrandDNA } from '@/types';
import type { CampaignStrategy } from '@/types';
import type { GeneratedImage } from '@/types';
import type { ImagePrompt } from '@/types';
import type { SocialCreative } from '@/types';
import type { WebsiteData } from '@/types';
import { getHeadlineTypography } from '@/lib/creativeTypography';
import { api } from '~/trpc/react';

// Dynamic Google Fonts loader
function useBrandFont(fontName?: string) {
  useEffect(() => {
    if (!fontName || typeof window === 'undefined') return;
    const clean = fontName.replace(/['"]/g, '').trim();
    if (!clean || ['sans-serif', 'serif', 'monospace', 'inherit', 'system-ui'].includes(clean.toLowerCase())) return;

    const id = `gfont-${clean.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:wght@400;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, [fontName]);
}

// Contrast-aware text color
function getContrastColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

function imageAspectRatioCss(ar: ImagePrompt['aspectRatio'] | string | undefined): string {
  switch (ar) {
    case '9:16':
      return '9/16';
    case '4:5':
      return '4/5';
    case '1:1':
      return '1/1';
    case '16:9':
      return '16/9';
    default:
      return '9/16';
  }
}

function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function CreativesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;
  const campaignIdFromQuery = searchParams.get('campaignId') ?? undefined;
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [showGenNotice, setShowGenNotice] = useState(false);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);

  // Clone & Copy modal state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneReferenceImage, setCloneReferenceImage] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [presetTemplates, setPresetTemplates] = useState<{ src: string; label: string }[]>([]);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  const [showInfographicModal, setShowInfographicModal] = useState(false);
  const [productInfographicUrl, setProductInfographicUrl] = useState('');
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [infographicError, setInfographicError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.templates)) setPresetTemplates(d.templates); })
      .catch(() => {});
  }, []);

  const creatives = usePipelineStore((state: any) => state.creatives);
  const imagePrompts = usePipelineStore((state: any) => state.imagePrompts);
  const generatedImages = usePipelineStore((state: any) => state.generatedImages);
  const selectedCampaign = usePipelineStore((state: any) => state.selectedCampaign);
  const websiteData = usePipelineStore((state: any) => state.websiteData);
  const websiteColors = usePipelineStore((state: any) => state.websiteColors);
  const brandDNA = usePipelineStore((state: any) => state.brandDNA);
  const tagline = usePipelineStore((state: any) => state.tagline);
  const creativeLayouts = usePipelineStore((state: any) => state.creativeLayouts);
  const setGeneratedImages = usePipelineStore((state: any) => state.setGeneratedImages);
  const setImagePrompts = usePipelineStore((state: any) => state.setImagePrompts);
  const setCreatives = usePipelineStore((state: any) => state.setCreatives);
  const setSelectedCampaign = usePipelineStore((state: any) => state.setSelectedCampaign);
  const setWebsiteData = usePipelineStore((state: any) => state.setWebsiteData);
  const setBrandDNA = usePipelineStore((state: any) => state.setBrandDNA);
  const setWebsiteExtras = usePipelineStore((state: any) => state.setWebsiteExtras);
  const setCurrentPage = usePipelineStore((state: any) => state.setCurrentPage);
  const setEditingCreative = usePipelineStore((state: any) => state.setEditingCreative);

  const trpcUtils = api.useUtils();

  const { data: creativeData, isLoading: isLoadingCreativeData } =
    api.creative.getLatestProjectCreatives.useQuery({ projectId: projectIdFromQuery, campaignId: campaignIdFromQuery }, {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    });

  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!creativeData) return;

    if (creativeData.websiteData) {
      const dbWebsiteData = creativeData.websiteData as WebsiteData;
      setWebsiteData(dbWebsiteData);
      setWebsiteExtras({
        colors: dbWebsiteData.colors || [],
        fonts: dbWebsiteData.fonts || [],
        logo: dbWebsiteData.logo || dbWebsiteData.images?.[0] || null,
        tagline: dbWebsiteData.tagline || dbWebsiteData.heroText || null,
        aboutSection: dbWebsiteData.aboutSection || null,
        heroText: dbWebsiteData.heroText || null,
      });
    }

    if (creativeData.brandDNA) {
      setBrandDNA(creativeData.brandDNA as BrandDNA);
    }

    if (creativeData.selectedCampaign) {
      setSelectedCampaign(creativeData.selectedCampaign as CampaignStrategy);
    }

    if (creativeData.creatives) {
      setCreatives(creativeData.creatives as SocialCreative[]);
    }

    if (creativeData.imagePrompts) {
      setImagePrompts(creativeData.imagePrompts as ImagePrompt[]);
    }

    if (creativeData.generatedImages) {
      setGeneratedImages(creativeData.generatedImages as GeneratedImage[]);
    }

    if (Array.isArray(creativeData.creativeIds)) {
      setCreativeIds(creativeData.creativeIds as string[]);
    }

    hasHydrated.current = true;
  }, [
    creativeData,
    setBrandDNA,
    setCreatives,
    setGeneratedImages,
    setImagePrompts,
    setSelectedCampaign,
    setWebsiteData,
    setWebsiteExtras,
  ]);

  // Load brand fonts dynamically
  const headingFont = websiteData?.fonts?.[0];
  const bodyFont = websiteData?.fonts?.[1] || headingFont;
  useBrandFont(headingFont);
  useBrandFont(bodyFont);

  const getBrandReferenceImages = (): string[] => {
    const images: string[] = [];
    const isValidImg = (v: unknown): v is string =>
      typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http://') || v.startsWith('https://'));
    const logo = websiteData?.logo || websiteData?.images?.[0];
    if (isValidImg(logo)) images.push(logo);
    const productShots = (websiteData?.images || []).slice(logo ? 1 : 0, 4) as string[];
    for (const img of productShots) {
      if (isValidImg(img)) images.push(img);
    }
    return images;
  };

  /** Renders creatives via Gemini image model + project reference photos (layer5). */
  const runLayer5Batch = async (
    prompts: ImagePrompt[],
    options?: { productInfographic?: boolean },
  ) => {
    if (!prompts.length) return;
    const targetProjectId = creativeData?.projectId ?? projectIdFromQuery;
    if (!targetProjectId) {
      console.error('Missing projectId for image generation');
      return;
    }

    setIsGeneratingImages(true);
    setShowGenNotice(true);
    try {
      const promptsWithIds = prompts.map((p: ImagePrompt) => ({
        ...p,
        ...(creativeIds[p.creativeIndex] ? { creativeId: creativeIds[p.creativeIndex] } : {}),
      }));
      const referenceImages = getBrandReferenceImages();
      const response = await fetch('/api/layer5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompts: promptsWithIds,
          projectId: targetProjectId,
          referenceImages,
          productInfographic: options?.productInfographic === true,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.generatedImages) {
        setGeneratedImages(result.data.generatedImages);
      }
      await trpcUtils.creative.getLatestProjectCreatives.invalidate({
        projectId: projectIdFromQuery,
        campaignId: campaignIdFromQuery ?? undefined,
      });
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!imagePrompts || imagePrompts.length === 0) return;
    await runLayer5Batch(imagePrompts);
  };

  const handleProductInfographicSubmit = async () => {
    const url = productInfographicUrl.trim();
    if (!url) {
      setInfographicError('Enter a product page URL');
      return;
    }
    const targetProjectId = creativeData?.projectId ?? projectIdFromQuery;
    if (!targetProjectId) {
      setInfographicError('Missing project — open this page from a project');
      return;
    }
    setInfographicLoading(true);
    setInfographicError(null);
    let mergedPrompts: ImagePrompt[] | null = null;
    try {
      const res = await fetch('/api/product-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: url,
          projectId: targetProjectId,
          campaignId: campaignIdFromQuery ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Could not build infographic briefs');
      }
      const data = json.data as {
        creatives: SocialCreative[];
        imagePrompts: ImagePrompt[];
      };
      const nextCreatives = [...creatives];
      data.creatives.forEach((c, i) => {
        nextCreatives[i] = c;
      });
      setCreatives(nextCreatives);
      const byIndex = new Map(
        (imagePrompts || []).map((p: ImagePrompt) => [p.creativeIndex, p]),
      );
      for (const p of data.imagePrompts) {
        byIndex.set(p.creativeIndex, p);
      }
      mergedPrompts = Array.from(byIndex.values()).sort(
        (a, b) => a.creativeIndex - b.creativeIndex,
      );
      setImagePrompts(mergedPrompts);
      setGeneratedImages([]);
      setShowInfographicModal(false);
      setProductInfographicUrl('');
    } catch (e) {
      setInfographicError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setInfographicLoading(false);
    }

    if (mergedPrompts?.length) {
      await runLayer5Batch(mergedPrompts, { productInfographic: true });
    }
  };

  const handleEditCreative = (index: number) => {
    setEditingCreative(index);
    setCurrentPage('editor');
    const targetProjectId = creativeData?.projectId ?? projectIdFromQuery;
    const campaignParam = campaignIdFromQuery ? `&campaignId=${campaignIdFromQuery}` : '';
    router.push(targetProjectId ? `/editor?projectId=${targetProjectId}&index=${index}${campaignParam}` : `/editor?index=${index}`);
  };


  // Get image for a creative
  const getImageForCreative = (index: number) => {
    const generated = generatedImages.find((img: GeneratedImage) => img.creativeIndex === index);
    if (generated?.imageUrl) return generated.imageUrl;

    if (websiteData?.images && websiteData.images.length > 1) {
      const availableImages = websiteData.images.slice(1);
      const seedSource =
        campaignIdFromQuery ??
        selectedCampaign?.title ??
        creativeData?.selectedCampaign?.title ??
        projectIdFromQuery ??
        'default-campaign';
      const seed = hashStringToInt(seedSource);
      const length = availableImages.length;
      const start = seed % length;

      // Pick a step that is coprime to length so we walk the image set in a campaign-specific order.
      const candidateSteps = [5, 7, 11, 13, 17, 19, 23];
      const step =
        candidateSteps.find((s) => gcd(s, length) === 1) ??
        (gcd(1, length) === 1 ? 1 : 0);

      if (step === 0) return availableImages[0] ?? null;
      const mappedIndex = (start + index * step) % length;
      return availableImages[mappedIndex] ?? null;
    }
    return null;
  };

  // ─── Clone & Copy handlers ───
  const handleCloneFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCloneReferenceImage(dataUrl);
        setCloneResult(null);
        setCloneError(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCloneDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCloneFileSelect(file);
  }, [handleCloneFileSelect]);

  const handleCloneGenerate = async () => {
    if (!cloneReferenceImage) return;

    const targetProjectId = creativeData?.projectId ?? projectIdFromQuery;
    if (!targetProjectId) {
      setCloneError('Missing project ID');
      return;
    }

    setIsCloning(true);
    setCloneError(null);
    setCloneResult(null);

    try {
      // Gather product images from Brand DNA (skip logo, first image)
      const productImages = (websiteData?.images || []).slice(1, 4);

      // Build full brand DNA context for the API
      const brandContext = {
        brandName: websiteData?.brandName || websiteData?.title || 'Brand',
        brandColors: websiteColors,
        brandFonts: websiteData?.fonts || [],
        brandLogo: websiteData?.logo || websiteData?.images?.[0] || null,
        brandTagline: tagline || websiteData?.tagline || '',
        brandAesthetic: brandDNA?.brandAesthetic || '',
        brandValues: brandDNA?.brandValues || [],
        brandToneOfVoice: brandDNA?.brandToneOfVoice || [],
        industry: brandDNA?.industry || '',
        productType: brandDNA?.productType || '',
        positioning: brandDNA?.positioning || 'mid',
        // Campaign context
        campaignTitle: selectedCampaign?.title || '',
        campaignGoal: selectedCampaign?.goal || 'awareness',
        campaignAngle: selectedCampaign?.strategicAngle || '',
        campaignHook: selectedCampaign?.narrativeHook || '',
        emotionalLever: selectedCampaign?.emotionalLever || 'trust',
        visualDirection: selectedCampaign?.visualDirection || '',
        // Creative copy (use first creative or campaign data)
        campaignHeadline: creatives[0]?.headline || selectedCampaign?.title || '',
        campaignDescription: creatives[0]?.description || selectedCampaign?.strategicAngle || '',
        campaignCta: creatives[0]?.cta || 'Shop Now',
      };

      const response = await fetch('/api/clone-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjectId,
          referenceImage: cloneReferenceImage,
          productImages,
          ...brandContext,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.generatedImageUrl) {
        setCloneResult(result.data.generatedImageUrl);
      } else {
        setCloneError(result.error || 'Failed to generate clone');
      }
    } catch (error) {
      console.error('Clone error:', error);
      setCloneError(error instanceof Error ? error.message : 'Clone failed');
    } finally {
      setIsCloning(false);
    }
  };

  const handleRegenerateCreative = async (index: number) => {
    const prompt = imagePrompts.find((p: ImagePrompt) => p.creativeIndex === index);
    const targetProjectId = creativeData?.projectId ?? projectIdFromQuery;
    if (!prompt || !targetProjectId) return;
    const creativeId = creativeIds[index];
    const promptWithCreativeId = creativeId ? { ...prompt, creativeId } : prompt;

    setIsGeneratingImages(true);
    try {
      const response = await fetch('/api/layer5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompts: [promptWithCreativeId], projectId: targetProjectId, referenceImages: getBrandReferenceImages() }),
      });

      const result = await response.json();
      if (result.success && result.data?.generatedImages?.[0]) {
        const newImages = [...generatedImages];
        const existingIdx = newImages.findIndex(img => img.creativeIndex === index);
        if (existingIdx >= 0) {
          newImages[existingIdx] = result.data.generatedImages[0];
        } else {
          newImages.push(result.data.generatedImages[0]);
        }
        setGeneratedImages(newImages);
      }
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleAddCreative = () => {
    const newCreative: SocialCreative = {
      headline: 'New Brand Message',
      description: 'Discover the latest from our collection.',
      cta: 'Explore Now',
      layout: 'full-bleed',
      overlayStyle: 'gradient-dark',
      colorMood: 'premium',
      photographyStyle: 'commercial product',
      imageIntent: 'Showcasing the product in a lifestyle setting',
      sceneElements: [],
      textStyle: {
        fontWeight: 'bold',
        alignment: 'center',
        hierarchy: 'balanced'
      }
    };
    setCreatives([...creatives, newCreative]);
  };

  const handleAddCloneToGrid = () => {
    if (!cloneResult) return;
    // Add as a new generated image at the next available index
    const nextIndex = creatives.length + generatedImages.filter((img: GeneratedImage) => img.creativeIndex >= creatives.length).length;
    const newImages = [...generatedImages, { creativeIndex: nextIndex, imageUrl: cloneResult }];
    setGeneratedImages(newImages);
    setShowCloneModal(false);
    setCloneReferenceImage(null);
    setCloneResult(null);
  };

  const handleCloneDownload = () => {
    if (!cloneResult) return;
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    const brand = websiteData?.brandName ? slugify(websiteData.brandName) : '';
    const campaign = selectedCampaign?.title ? slugify(selectedCampaign.title) : '';
    const parts = [brand, campaign, 'clone'].filter(Boolean);
    const filename = parts.length ? `${parts.join('-')}.png` : `clone-creative-${Date.now()}.png`;
    const link = document.createElement('a');
    link.href = cloneResult;
    link.download = filename;
    link.click();
  };

  // Brand palette
  const primary = websiteColors[0] || '#1a1a2e';
  const secondary = websiteColors[1] || '#d4af37';
  const accent = websiteColors[2] || websiteColors[1] || '#6366f1';

  const headingFontFamily = headingFont
    ? `'${headingFont.replace(/['"]/g, '')}', sans-serif`
    : "'Inter', sans-serif";
  const bodyFontFamily = bodyFont
    ? `'${bodyFont.replace(/['"]/g, '')}', sans-serif`
    : "'Inter', sans-serif";

  if (isLoadingCreativeData && (!creatives || creatives.length === 0)) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    );
  }

  if (!creatives || creatives.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-4 flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-600 text-sm">No creatives found for this project yet.</p>
        <button
          onClick={() => router.push(projectIdFromQuery ? `/campaigns?projectId=${projectIdFromQuery}` : '/campaigns')}
          className="px-4 py-2 rounded-xl bg-[#FAD400] hover:brightness-95 text-neutral-900 font-display font-semibold text-sm marketing-cta-glow"
        >
          Go To Campaigns
        </button>
      </div>
    );
  }

  // ====================================================
  // 5 DISTINCT POMELLI-STYLE LAYOUT TEMPLATES
  // Each card gets a unique visual composition
  // ====================================================

  const renderCreativeCard = (index: number) => {
    const creative = creatives[index];
    const imageUrl = getImageForCreative(index);
    if (!creative) return null;

    /** Product infographic: full-bleed image, headline+desc at top, CTA pinned to bottom. */
    if (creative.layoutTemplate === 'product-infographic') {
      return (
        <div className="relative w-full h-full overflow-hidden bg-[#050505]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <ImageIcon className="w-12 h-12 text-neutral-500" />
            </div>
          )}

          {/* Top gradient — headline & description */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '40%',
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)',
            }}
          />
          <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-10">
            <h3
              className="text-white font-bold text-sm sm:text-[0.95rem] leading-tight line-clamp-2 drop-shadow-md"
              style={{ fontFamily: headingFontFamily }}
            >
              {creative.headline}
            </h3>
            {creative.description && (
              <p
                className="text-white/75 text-[10px] sm:text-[11px] leading-snug line-clamp-2 mt-1 max-w-[95%] drop-shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                {creative.description}
              </p>
            )}
          </div>

          {/* Bottom gradient — CTA */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '28%',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.18) 65%, transparent 100%)',
            }}
          />
          {creative.cta && (
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 z-10 flex justify-center">
              <span
                className="inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-sm shadow-lg"
                style={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {creative.cta}
              </span>
            </div>
          )}
        </div>
      );
    }

    const headlineTypography = getHeadlineTypography(creative, index % 5);

    const layouts = [
      // ─── LAYOUT 1: Full-bleed image + bottom-left bold text ───
      () => (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#111' }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.85)' }}
            />
          )}
          {/* Gradient overlay from bottom */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 40%, transparent 70%)'
          }} />
          {/* Text content — bottom-left, bold uppercase */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <h3
              className="text-white leading-[0.95] mb-3 uppercase tracking-tight"
              style={{
                fontFamily: headingFontFamily,
                fontWeight: headlineTypography.fontWeight,
                fontSize: headlineTypography.fontSize,
                textAlign: headlineTypography.textAlign,
                marginTop: '2px',
              }}
            >
              {creative.headline}
            </h3>
            <p
              className="text-white/75 text-xs leading-relaxed mb-3 max-w-[85%]"
              style={{ fontFamily: bodyFontFamily }}
            >
              {creative.description}
            </p>
            {creative.cta && (
              <span
                className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/40"
                style={{ color: '#fff' }}
              >
                {creative.cta}
              </span>
            )}
          </div>
        </div>
      ),

      // ─── LAYOUT 2: Dark card + centered bold text + image behind ───
      () => (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.7) contrast(1.1)', opacity: 0.75 }}
            />
          )}
          {/* Solid dark overlay */}
          <div className="absolute inset-0 bg-black/25" />
          {/* Centered text block */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-5 z-10 text-center">
            <h3
              className="text-white leading-[0.9] mb-4 uppercase tracking-tight"
              style={{
                fontFamily: headingFontFamily,
                fontWeight: headlineTypography.fontWeight,
                fontSize: headlineTypography.fontSize,
                textAlign: headlineTypography.textAlign,
                marginTop: '2px',
              }}
            >
              {creative.headline}
            </h3>
            <p
              className="text-white/70 text-xs leading-relaxed mb-4 max-w-[90%]"
              style={{ fontFamily: bodyFontFamily }}
            >
              {creative.description}
            </p>
            {creative.cta && (
              <span
                className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {creative.cta}
              </span>
            )}
          </div>
        </div>
      ),

      // ─── LAYOUT 3: Image top + giant text overlapping bottom ───
      () => (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#111' }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.8)' }}
            />
          )}
          {/* Strong gradient from bottom */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.35) 50%, transparent 80%)'
          }} />
          {/* Giant headline that overlaps into the image area */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <h3
              className="text-white leading-[0.85] mb-3 uppercase tracking-tight"
              style={{
                fontFamily: headingFontFamily,
                fontWeight: headlineTypography.fontWeight,
                fontSize: headlineTypography.fontSize,
                textAlign: headlineTypography.textAlign,
                marginTop: '2px',
              }}
            >
              {creative.headline}
            </h3>
            <p
              className="text-white/65 text-[11px] leading-relaxed mb-1"
              style={{ fontFamily: bodyFontFamily }}
            >
              {creative.description}
            </p>
          </div>
        </div>
      ),

      // ─── LAYOUT 4: Brand color accent panel + image ───
      // (Like Pomelli's copper/brown accent card)
      () => (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#111' }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.8)' }}
            />
          )}
          <div className="absolute inset-0 bg-black/15" />

          {/* Brand color accent shape — angled panel on the right */}
          <div
            className="absolute top-0 right-0 w-[45%] h-full z-10"
            style={{
              backgroundColor: primary,
              clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)',
              opacity: 0.92,
            }}
          />

          {/* Text on the accent panel */}
          <div className="absolute top-0 right-0 w-[42%] h-full flex flex-col justify-center p-4 z-20">
            <h3
              className="leading-[0.9] mb-3 uppercase tracking-tight"
              style={{
                fontFamily: headingFontFamily,
                fontWeight: headlineTypography.fontWeight,
                fontSize: headlineTypography.fontSize,
                textAlign: headlineTypography.textAlign,
                color: getContrastColor(primary),
                marginTop: '2px',
              }}
            >
              {creative.headline}
            </h3>
            <p
              className="text-[10px] leading-relaxed mb-3 max-w-full uppercase tracking-wide"
              style={{
                fontFamily: bodyFontFamily,
                color: getContrastColor(primary),
                opacity: 0.8,
              }}
            >
              {creative.description}
            </p>
            {creative.cta && (
              <span
                className="inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm w-fit"
                style={{
                  backgroundColor: getContrastColor(primary),
                  color: primary,
                }}
              >
                {creative.cta}
              </span>
            )}
          </div>
        </div>
      ),

      // ─── LAYOUT 5: Clean white card — image top, bold dark text bottom ───
      // (Like Pomelli's white background card with angled image)
      () => (
        <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ backgroundColor: '#f8f8f8' }}>
          {/* Image top section with angle clip */}
          <div
            className="relative w-full flex-shrink-0 overflow-hidden"
            style={{ height: '55%', clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-neutral-500" />
              </div>
            )}
          </div>
          {/* Text content — white bg, dark text */}
          <div className="flex-1 flex flex-col justify-center px-5 pb-5 pt-2">
            <h3
              className="leading-[1] mb-2 tracking-tight"
              style={{
                fontFamily: headingFontFamily,
                fontWeight: headlineTypography.fontWeight,
                fontSize: headlineTypography.fontSize,
                textAlign: headlineTypography.textAlign,
                color: '#1a1a1a',
                marginTop: '2px',
              }}
            >
              {creative.headline}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ fontFamily: bodyFontFamily, color: '#555' }}
            >
              {creative.description}
            </p>
          </div>
        </div>
      ),
    ];

    // Cycle through the 5 layouts
    const layoutFn = layouts[index % layouts.length];
    return layoutFn();
  };

  return (
    <div className="min-h-screen pt-8 pb-8 px-4 lg:px-8">
      <AnimatePresence>
        {showGenNotice && (
          <motion.div
            key="gen-notice"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border border-neutral-200 bg-white/95 shadow-2xl pointer-events-auto text-center"
              style={{ backdropFilter: 'blur(14px)', maxWidth: '420px', width: 'calc(100vw - 2rem)' }}
            >
              <p className="text-neutral-800 text-sm leading-relaxed" style={{ fontStyle: 'italic', fontWeight: 500 }}>
                this will take a little while — go take a walk, talk to your gf, your daughter, or as a last resort, your wife 🚶
              </p>
              <button
                type="button"
                onClick={() => setShowGenNotice(false)}
                className="text-xs text-neutral-600 hover:text-white transition-colors px-4 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100"
              >
                ok
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FAD400]/20 border border-[#FAD400]/30 mb-4">
            <Palette className="w-6 h-6 text-neutral-900" />
          </div>
          <h1 className="text-3xl font-display font-bold text-[#FAD400] mb-2">Campaign</h1>
          <p className="text-neutral-600">
            Here is a series of creatives to post for this campaign.
            <br />
            You can edit, delete or generate more.
          </p>
        </motion.div>

        {/* Campaign Info Sidebar + Creatives */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-72 lg:flex-shrink-0 space-y-4 lg:sticky lg:top-24 self-start"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Campaign Card */}
              <div className="card p-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAD400]/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#FAD400]" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[#FAD400] text-sm">{selectedCampaign?.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedCampaign?.strategicAngle?.slice(0, 150)}...
                </p>
              </div>

              {/* Generate Images Button */}
              {!generatedImages.length && (
                <button
                  type="button"
                  onClick={handleGenerateAllImages}
                  disabled={isGeneratingImages}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAD400] text-neutral-900 font-display font-semibold text-sm marketing-cta-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGeneratingImages ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Generate AI Images
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowCloneModal(true);
                  setCloneReferenceImage(null);
                  setCloneResult(null);
                  setCloneError(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-900 font-display font-semibold text-sm hover:border-[#FAD400]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Copy className="w-4 h-4" />
                Clone & Copy
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInfographicModal(true);
                  setInfographicError(null);
                  setProductInfographicUrl('');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-900 font-display font-semibold text-sm hover:border-[#FAD400]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutTemplate className="w-4 h-4" />
                Product Infographic
              </button>

              <div className="card p-4 bg-[#FAD400]/10 border-[#FAD400]/25 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-[#FAD400]" />
                  <span className="text-sm font-display font-semibold text-neutral-900">
                    Try Animate feature
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-light">
                  Generate animations from your campaigns in one click!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Creatives Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {creatives.map((creative: SocialCreative, index: number) => {
                const cellAspect = imageAspectRatioCss(
                  imagePrompts?.find((p: ImagePrompt) => p.creativeIndex === index)?.aspectRatio,
                );
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:border-[#FAD400]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    style={{ aspectRatio: cellAspect }}
                    onClick={() => handleEditCreative(index)}
                  >
                    {renderCreativeCard(index)}

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCreative(index);
                          }}
                          className="group/edit flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-neutral-900 text-xs font-medium shadow-lg transition-all duration-200 hover:bg-[#FAD400]/20 hover:shadow-md hover:scale-105"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateCreative(index);
                          }}
                          className="group/regen flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium shadow-lg transition-all duration-200 hover:bg-neutral-800 hover:scale-105"
                          title="Regenerate Image"
                        >
                          <Wand2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <motion.button
                type="button"
                onClick={handleAddCreative}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: creatives.length * 0.1 }}
                className="rounded-2xl border-2 border-dashed border-neutral-300 hover:border-[#FAD400] bg-neutral-50 hover:bg-white transition-all flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-[#FAD400]"
                style={{
                  aspectRatio: imageAspectRatioCss(
                    imagePrompts?.find((p: ImagePrompt) => p.creativeIndex === 0)?.aspectRatio ??
                      imagePrompts?.[0]?.aspectRatio,
                  ),
                }}
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-display font-semibold">Add Creative</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* CLONE & COPY MODAL                         */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showCloneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCloneModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-neutral-200 bg-white/95 backdrop-blur-sm rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                    <Copy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-[#FAD400]">Clone & Copy</h2>
                    <p className="text-xs text-neutral-600">Choose a preset or upload your own — AI recreates it for your brand</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Preset Templates + Upload */}
                {!cloneReferenceImage ? (
                  <div className="space-y-5">
                    {/* Preset Templates */}
                    {presetTemplates.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Style Presets</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {presetTemplates.map((preset) => (
                          <button
                            key={preset.src}
                            onClick={() => {
                              setCloneReferenceImage(preset.src);
                              setCloneResult(null);
                              setCloneError(null);
                            }}
                            className="group/preset relative rounded-xl overflow-hidden border-2 border-neutral-200 hover:border-purple-500 transition-all hover:scale-[1.03] active:scale-[0.98]"
                            style={{ aspectRatio: '1/1' }}
                          >
                            <img
                              src={preset.src}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white uppercase tracking-wider">
                              {preset.label}
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover/preset:opacity-100 transition-opacity bg-purple-500/10 border-2 border-purple-500 rounded-xl" />
                          </button>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-neutral-200" />
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">or upload your own</span>
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    {/* Upload Area */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleCloneDrop}
                      onClick={() => cloneInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                        ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                        : 'border-neutral-300 hover:border-purple-500/50 hover:bg-neutral-50'
                        }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm mb-0.5">Drop a reference creative here</p>
                        <p className="text-xs text-neutral-600">or click to browse — PNG, JPG, WebP</p>
                      </div>
                      <input
                        ref={cloneInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCloneFileSelect(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Preview + Generate */
                  <div className="space-y-5">
                    {/* Reference vs Result side by side */}
                    <div className={`grid ${cloneResult ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      {/* Reference Image */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-neutral-600 uppercase tracking-wider">Reference</span>
                          <button
                            onClick={() => { setCloneReferenceImage(null); setCloneResult(null); setCloneError(null); }}
                            className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            Change
                          </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                          <img
                            src={cloneReferenceImage}
                            alt="Reference creative"
                            className="w-full h-auto max-h-[400px] object-contain"
                          />
                        </div>
                      </div>

                      {/* Generated Result */}
                      {cloneResult && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Generated</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-neutral-100">
                            <img
                              src={cloneResult}
                              alt="Generated creative"
                              className="w-full h-auto max-h-[400px] object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Loading State */}
                    {isCloning && (
                      <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 animate-spin" style={{ animationDuration: '3s' }}>
                            <div className="absolute inset-1 rounded-full bg-white" />
                          </div>
                          <Wand2 className="absolute inset-0 m-auto w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium">Cloning creative...</p>
                          <p className="text-sm text-neutral-600 mt-1">AI is analyzing the reference and generating your brand version</p>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {cloneError && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-400">{cloneError}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {!cloneResult ? (
                        <button
                          onClick={handleCloneGenerate}
                          disabled={isCloning}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                          
                        >
                          {isCloning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Generate Clone
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleCloneDownload}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-white bg-neutral-200 hover:bg-neutral-300 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={handleCloneGenerate}
                            disabled={isCloning}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                            
                          >
                            <Wand2 className="w-4 h-4" />
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfographicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => !infographicLoading && setShowInfographicModal(false)}
          >
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 p-5 border-b border-neutral-200">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    
                  >
                    <LayoutTemplate className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-[#FAD400]">Product Infographic</h2>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      We read your product page and rewrite creatives into infographic layouts. Next, the image model runs
                      automatically: it uses your project’s brand/product photos as references so the hero matches your
                      packaging.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={infographicLoading}
                  onClick={() => setShowInfographicModal(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="product-infographic-url" className="block text-xs font-medium text-neutral-600 mb-2">
                    Product page URL
                  </label>
                  <input
                    id="product-infographic-url"
                    type="url"
                    value={productInfographicUrl}
                    onChange={(e) => setProductInfographicUrl(e.target.value)}
                    placeholder="https://yourstore.com/products/..."
                    disabled={infographicLoading}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50"
                    autoComplete="url"
                  />
                </div>

                {infographicError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                    <p className="text-sm text-red-400">{infographicError}</p>
                  </div>
                )}

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Up to five slots get distinct layouts. After the brief is saved, infographic images generate automatically
                  (watch the sidebar for progress). Add product photos under Brand DNA / site images so the AI can anchor the
                  real bottle or pack.
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    disabled={infographicLoading}
                    onClick={() => setShowInfographicModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={infographicLoading}
                    onClick={handleProductInfographicSubmit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                    
                  >
                    {infographicLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building briefs…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Apply &amp; generate images
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
