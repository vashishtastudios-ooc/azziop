'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Wand2,
  Edit3,
  Check,
  X,
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff,
  Upload,
  ArrowRight
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { usePipelineStore } from '@/store/pipeline';
import type { BrandDNA, CampaignStrategy, GeneratedImage, ImagePrompt, SocialCreative, WebsiteData } from '@/types';
import { getHeadlineTypography } from '@/lib/creativeTypography';
import { api } from '~/trpc/react';

// Which element is being edited
type EditingElement = 'headline' | 'description' | 'cta' | null;
type HideableElement = 'headline' | 'description' | 'cta';

type VisibilityState = {
  headline: boolean;
  description: boolean;
  cta: boolean;
};

/** Which image layer is shown in the editor when both website and AI versions exist */
type CreativeImageVersion = 'website' | 'ai';

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

function resolveImagePromptAspect(
  imagePrompts: ImagePrompt[] | undefined,
  creativeIndex: number | null
): ImagePrompt['aspectRatio'] {
  if (creativeIndex === null) return '9:16';
  const list = Array.isArray(imagePrompts) ? imagePrompts : [];
  const ar = list.find((p) => p.creativeIndex === creativeIndex)?.aspectRatio;
  if (ar === '1:1' || ar === '4:5' || ar === '9:16' || ar === '16:9') return ar;
  return '9:16';
}

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

export function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;
  const campaignIdFromQuery = searchParams.get('campaignId') ?? undefined;
  const indexFromQuery = searchParams.get('index');
  const parsedIndex = indexFromQuery !== null ? Number(indexFromQuery) : null;
  const trpcUtils = api.useUtils();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);
  const editingIndex = usePipelineStore((state) => state.editingCreativeIndex);
  const creatives = usePipelineStore((state) => state.creatives);
  const generatedImages = usePipelineStore((state) => state.generatedImages);
  const imagePrompts = usePipelineStore((state) => state.imagePrompts);
  const websiteData = usePipelineStore((state) => state.websiteData);
  const brandDNA = usePipelineStore((state) => state.brandDNA);
  const selectedCampaign = usePipelineStore((state) => state.selectedCampaign);
  const websiteColors = usePipelineStore((state) => state.websiteColors);
  const updateCreative = usePipelineStore((state) => state.updateCreative);
  const updateGeneratedImage = usePipelineStore((state) => state.updateGeneratedImage);
  const setCreatives = usePipelineStore((state) => state.setCreatives);
  const setImagePrompts = usePipelineStore((state) => state.setImagePrompts);
  const setGeneratedImages = usePipelineStore((state) => state.setGeneratedImages);
  const setWebsiteData = usePipelineStore((state) => state.setWebsiteData);
  const setBrandDNA = usePipelineStore((state) => state.setBrandDNA);
  const setSelectedCampaign = usePipelineStore((state) => state.setSelectedCampaign);
  const setWebsiteExtras = usePipelineStore((state) => state.setWebsiteExtras);
  const setCurrentPage = usePipelineStore((state) => state.setCurrentPage);
  const setEditingCreative = usePipelineStore((state) => state.setEditingCreative);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElement>(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isDownloading, setIsDownloading] = useState(false);
  const [visibilityByCreative, setVisibilityByCreative] = useState<Record<number, VisibilityState>>({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageEditPrompt, setImageEditPrompt] = useState('');
  const [uploadedSourceImages, setUploadedSourceImages] = useState<string[]>([]);
  const [selectedSourceImage, setSelectedSourceImage] = useState<string | null>(null);
  const [isApplyingImageEdit, setIsApplyingImageEdit] = useState(false);
  /** Per-creative toggle: Original (website-mapped) vs AI-generated */
  const [imageVersionByCreative, setImageVersionByCreative] = useState<Record<number, CreativeImageVersion>>({});
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const hasHydrated = useRef(false);
  const creativePreviewRef = useRef<HTMLDivElement>(null);
  const safeImagePrompts: ImagePrompt[] = Array.isArray(imagePrompts) ? imagePrompts : [];

  const { data: creativeData, isLoading: isLoadingCreativeData } =
    api.creative.getLatestProjectCreatives.useQuery({ projectId: projectIdFromQuery, campaignId: campaignIdFromQuery }, {
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    });

  const updateCreativeCopyMutation = api.creative.updateCreativeCopy.useMutation();

  useEffect(() => {
    if (!creativeData) return;

    setProjectId(creativeData.projectId ?? null);

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

    if ((creativeData.creatives?.length ?? 0) > 0) {
      if (parsedIndex !== null && Number.isFinite(parsedIndex)) {
        const boundedIndex = Math.max(0, Math.min((creativeData.creatives?.length ?? 1) - 1, parsedIndex));
        setEditingCreative(boundedIndex);
      } else if (editingIndex === null || editingIndex < 0) {
        setEditingCreative(0);
      }
    }

    hasHydrated.current = true;
  }, [
    creativeData,
    editingIndex,
    parsedIndex,
    setBrandDNA,
    setCreatives,
    setEditingCreative,
    setGeneratedImages,
    setImagePrompts,
    setSelectedCampaign,
    setWebsiteData,
    setWebsiteExtras,
  ]);

  // Brand fonts
  const headingFont = websiteData?.fonts?.[0];
  const bodyFont = websiteData?.fonts?.[1] || headingFont;
  useBrandFont(headingFont);
  useBrandFont(bodyFont);

  const creative = editingIndex !== null ? creatives[editingIndex] : null;
  const generatedImage = editingIndex !== null
    ? generatedImages.find(img => img.creativeIndex === editingIndex)
    : null;

  // Brand palette
  const primary = websiteColors[0] || '#1a1a2e';
  const secondary = websiteColors[1] || '#d4af37';

  const headingFontFamily = headingFont
    ? `'${headingFont.replace(/['"]/g, '')}', sans-serif`
    : "'Inter', sans-serif";
  const bodyFontFamily = bodyFont
    ? `'${bodyFont.replace(/['"]/g, '')}', sans-serif`
    : "'Inter', sans-serif";

  // Website-mapped image only (never the AI layer)
  const getWebsiteImageForCreative = useCallback(() => {
    if (!editingIndex && editingIndex !== 0) return null;
    if (websiteData?.images && websiteData.images.length > 1) {
      const availableImages = websiteData.images.slice(1);
      const seedSource =
        campaignIdFromQuery ??
        selectedCampaign?.title ??
        projectIdFromQuery ??
        'default-campaign';
      const seed = hashStringToInt(seedSource);
      const length = availableImages.length;
      const start = seed % length;

      const candidateSteps = [5, 7, 11, 13, 17, 19, 23];
      const step =
        candidateSteps.find((s) => gcd(s, length) === 1) ??
        (gcd(1, length) === 1 ? 1 : 0);

      if (step === 0) return availableImages[0] ?? null;
      const mappedIndex = (start + editingIndex * step) % length;
      return availableImages[mappedIndex] ?? null;
    }
    return null;
  }, [
    campaignIdFromQuery,
    selectedCampaign?.title,
    projectIdFromQuery,
    editingIndex,
    websiteData,
  ]);

  const websiteImageUrl = getWebsiteImageForCreative();
  const aiImageUrl = generatedImage?.imageUrl ?? null;
  const hasBothImageVersions = Boolean(websiteImageUrl && aiImageUrl);
  const activeImageVersion: CreativeImageVersion =
    hasBothImageVersions
      ? (imageVersionByCreative[editingIndex ?? -1] ?? 'ai')
      : aiImageUrl
        ? 'ai'
        : 'website';

  const imageUrl =
    activeImageVersion === 'ai' && aiImageUrl
      ? aiImageUrl
      : websiteImageUrl ?? aiImageUrl;
  const currentVisibility: VisibilityState = visibilityByCreative[editingIndex ?? -1] ?? {
    headline: true,
    description: true,
    cta: true,
  };
  const showHeadline = currentVisibility.headline;
  const showDescription = currentVisibility.description;
  const showCta = currentVisibility.cta;

  // ─── EDIT HANDLERS ───
  const startEditing = (element: EditingElement) => {
    if (!creative || !element) return;
    setEditingElement(element);
    setEditValue(creative[element] || '');
  };

  const cancelEditing = () => {
    setEditingElement(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (editingIndex === null || !editingElement) return;

    updateCreative(editingIndex, { [editingElement]: editValue });

    const creativeId = creativeIds[editingIndex];
    if (creativeId) {
      try {
        await updateCreativeCopyMutation.mutateAsync({
          creativeId,
          ...(editingElement === 'headline' ? { headline: editValue } : {}),
          ...(editingElement === 'description' ? { description: editValue } : {}),
          ...(editingElement === 'cta' ? { cta: editValue } : {}),
        });
        const targetProjectId = projectId ?? projectIdFromQuery;
        if (targetProjectId) {
          await trpcUtils.creative.getLatestProjectCreatives.invalidate({ projectId: targetProjectId, campaignId: campaignIdFromQuery });
        } else {
          await trpcUtils.creative.getLatestProjectCreatives.invalidate();
        }
      } catch (error) {
        console.error('Failed to persist creative edit:', error);
      }
    }

    setEditingElement(null);
    setEditValue('');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleBackToCreatives = async () => {
    setCurrentPage('creatives');
    const targetProjectId = projectId ?? projectIdFromQuery;
    try {
      if (targetProjectId) {
        await trpcUtils.creative.getLatestProjectCreatives.invalidate({ projectId: targetProjectId, campaignId: campaignIdFromQuery });
      } else {
        await trpcUtils.creative.getLatestProjectCreatives.invalidate();
      }
    } catch (error) {
      console.error('Failed to refresh creatives cache:', error);
    }
    router.push(
      targetProjectId
        ? `/creatives?projectId=${targetProjectId}${campaignIdFromQuery ? `&campaignId=${campaignIdFromQuery}` : ''}`
        : '/creatives'
    );
  };

  const navigateCreative = (direction: 'prev' | 'next') => {
    if (editingIndex === null) return;
    cancelEditing();
    const newIndex = direction === 'prev'
      ? Math.max(0, editingIndex - 1)
      : Math.min(creatives.length - 1, editingIndex + 1);
    setEditingCreative(newIndex);
    const targetProjectId = projectId ?? projectIdFromQuery;
    router.replace(
      targetProjectId
        ? `/editor?projectId=${targetProjectId}&index=${newIndex}${campaignIdFromQuery ? `&campaignId=${campaignIdFromQuery}` : ''}`
        : `/editor?index=${newIndex}`
    );
  };

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

  const handleRegenerate = async () => {
    if (editingIndex === null || !brandDNA || !creative) return;

    setIsRegenerating(true);
    try {
      const targetProjectId = projectId ?? projectIdFromQuery;
      const aspectRatio = resolveImagePromptAspect(safeImagePrompts, editingIndex);

      const response = await fetch('/api/layer4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProjectId,
          creatives: [creative],
          brandDNA,
          campaign: selectedCampaign,
          aspectRatio,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.imagePrompts?.[0]) {
        const newPromptData = result.data.imagePrompts[0] as {
          prompt: string;
          aspectRatio?: string;
        };
        const list = [...safeImagePrompts];
        const i = list.findIndex((p) => p.creativeIndex === editingIndex);
        const updated: ImagePrompt = {
          creativeIndex: editingIndex,
          prompt: newPromptData.prompt,
          aspectRatio:
            (newPromptData.aspectRatio as ImagePrompt['aspectRatio']) ?? aspectRatio,
        };
        if (i >= 0) list[i] = updated;
        else list.push(updated);
        setImagePrompts(list);

        // Current image goes first so Gemini edits it in-place;
        // brand/product images follow as additional identity references.
        const referenceImages: string[] = [];
        if (imageUrl) {
          referenceImages.push(imageUrl);
        }
        referenceImages.push(...getBrandReferenceImages());

        const imageResponse = await fetch('/api/layer5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imagePrompts: [{
              ...result.data.imagePrompts[0],
              creativeIndex: editingIndex,
              creativeId: creativeIds[editingIndex],
            }],
            projectId: targetProjectId,
            referenceImages,
            editExisting: !!imageUrl,
          }),
        });

        const imageResult = await imageResponse.json();

        if (imageResult.success && imageResult.data?.generatedImages?.[0]) {
          updateGeneratedImage(editingIndex, imageResult.data.generatedImages[0].imageUrl);
          setImageVersionByCreative((prev) => ({ ...prev, [editingIndex]: 'ai' }));
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const buildDownloadFilename = () => {
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

    const brand = websiteData?.brandName ? slugify(websiteData.brandName) : '';
    const campaign = selectedCampaign?.title ? slugify(selectedCampaign.title) : '';
    const headline = creative?.headline ? slugify(creative.headline) : '';
    const idx = (editingIndex ?? 0) + 1;

    const parts = [brand, campaign, headline].filter(Boolean);
    return parts.length ? `${parts.join('-')}-${idx}.png` : `creative-${idx}.png`;
  };

  const handleDownload = async () => {
    if (!creativePreviewRef.current) return;
    setIsDownloading(true);
    const filename = buildDownloadFilename();
    try {
      const dataUrl = await toPng(creativePreviewRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error('Download capture failed:', error);
      if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        link.click();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleVisibility = (element: HideableElement) => {
    if (editingIndex === null) return;
    setVisibilityByCreative((prev) => {
      const current = prev[editingIndex] ?? { headline: true, description: true, cta: true };
      return {
        ...prev,
        [editingIndex]: {
          ...current,
          [element]: !current[element],
        },
      };
    });
  };

  const availableSourceImages = [
    ...(websiteImageUrl ? [websiteImageUrl] : []),
    ...(aiImageUrl ? [aiImageUrl] : []),
    ...uploadedSourceImages,
    ...(websiteData?.images ?? []),
  ].filter((src, idx, arr) => !!src && arr.indexOf(src) === idx);

  const openImageModal = () => {
    setSelectedSourceImage(imageUrl ?? availableSourceImages[0] ?? null);
    setIsImageModalOpen(true);
  };

  const handleUploadSourceImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers)
      .then((dataUrls) => {
        const valid = dataUrls.filter(Boolean);
        if (valid.length === 0) return;
        setUploadedSourceImages((prev) => [...valid, ...prev].filter((src, idx, arr) => arr.indexOf(src) === idx));
        setSelectedSourceImage(valid[0] ?? null);
      })
      .catch((error) => {
        console.error('Failed to read uploaded image:', error);
      })
      .finally(() => {
        event.target.value = '';
      });
  };

  const handleApplyImageEdit = async () => {
    if (editingIndex === null) return;
    const sourceImage = selectedSourceImage ?? imageUrl;
    if (!sourceImage) return;

    setIsApplyingImageEdit(true);
    try {
      const targetProjectId = projectId ?? projectIdFromQuery;
      const basePrompt =
        safeImagePrompts.find((p) => p.creativeIndex === editingIndex)?.prompt ??
        `Create a premium social ad visual for ${websiteData?.brandName ?? 'the brand'}`;
      const promptWithInstruction = imageEditPrompt.trim()
        ? `${basePrompt}\n\nBACKGROUND EDIT INSTRUCTION: ${imageEditPrompt.trim()}`
        : basePrompt;

      const referenceImages: string[] = [sourceImage, ...getBrandReferenceImages()].filter(
        (src, idx, arr) => !!src && arr.indexOf(src) === idx,
      );

      const aspectRatio = resolveImagePromptAspect(safeImagePrompts, editingIndex);

      const imageResponse = await fetch('/api/layer5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompts: [
            {
              prompt: promptWithInstruction,
              creativeIndex: editingIndex,
              creativeId: creativeIds[editingIndex],
              aspectRatio,
            },
          ],
          projectId: targetProjectId,
          referenceImages,
          editExisting: true,
        }),
      });

      const imageResult = await imageResponse.json();
      if (imageResult.success && imageResult.data?.generatedImages?.[0]?.imageUrl) {
        updateGeneratedImage(editingIndex, imageResult.data.generatedImages[0].imageUrl);
        setImageVersionByCreative((prev) => ({ ...prev, [editingIndex]: 'ai' }));
        setIsImageModalOpen(false);
        setImageEditPrompt('');
      }
    } catch (error) {
      console.error('Image edit failed:', error);
    } finally {
      setIsApplyingImageEdit(false);
    }
  };

  if (isLoadingCreativeData && (!creatives || creatives.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-surface-400" />
      </div>
    );
  }

  if (!creative || editingIndex === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-surface-400">No creative selected</p>
      </div>
    );
  }

  // ─── RENDER CREATIVE PREVIEW (matches CreativesPage layouts) ───
  const renderCreativePreview = () => {
    const layoutIndex = editingIndex % 5;
    const headlineTypography = getHeadlineTypography(creative, layoutIndex);

    // Edit button overlay for an element
    const EditButton = ({ element, position }: { element: EditingElement; position: string }) => (
      <button
        onClick={(e) => { e.stopPropagation(); startEditing(element); }}
        className={`absolute ${position} opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/40 border border-white/20 z-30`}
      >
        <Edit3 className="w-3.5 h-3.5 text-white" />
      </button>
    );

    // Edit button variant for dark backgrounds (used in white card layout)
    const EditButtonDark = ({ element, position }: { element: EditingElement; position: string }) => (
      <button
        onClick={(e) => { e.stopPropagation(); startEditing(element); }}
        className={`absolute ${position} opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg bg-black/10 backdrop-blur-sm hover:bg-black/20 border border-black/10 z-30`}
      >
        <Edit3 className="w-3.5 h-3.5 text-surface-700" />
      </button>
    );

    /** Same layout as CreativesPage product-infographic grid — not the 5 rotating templates. */
    if (creative.layoutTemplate === 'product-infographic') {
      return (
        <div className="group relative w-full h-full overflow-hidden rounded-2xl bg-[#050505]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              onClick={openImageModal}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
              <ImageIcon className="w-12 h-12 text-surface-600" />
            </div>
          )}

          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '40%',
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)',
            }}
          />
          <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-10">
            <div className="relative">
              <EditButton element="headline" position="-top-2 -right-2" />
              {showHeadline && (
                <h3
                  className="text-white font-bold text-sm sm:text-[0.95rem] leading-tight line-clamp-2 drop-shadow-md"
                  style={{ fontFamily: headingFontFamily }}
                >
                  {creative.headline}
                </h3>
              )}
            </div>
            <div className="relative mt-1">
              <EditButton element="description" position="-top-2 -right-2" />
              {showDescription && creative.description && (
                <p
                  className="text-white/75 text-[10px] sm:text-[11px] leading-snug line-clamp-2 max-w-[95%] drop-shadow-sm"
                  style={{ fontFamily: bodyFontFamily }}
                >
                  {creative.description}
                </p>
              )}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '28%',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.18) 65%, transparent 100%)',
            }}
          />
          {creative.cta && showCta && (
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 z-10 flex justify-center">
              <div className="relative">
                <EditButton element="cta" position="-top-2 -right-2" />
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
            </div>
          )}
        </div>
      );
    }

    switch (layoutIndex) {
      // LAYOUT 1: Full-bleed + bottom-left text
      case 0:
        return (
          <div className="group relative w-full h-full overflow-hidden rounded-2xl" style={{ backgroundColor: '#111' }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                style={{ filter: 'brightness(0.85)' }}
                onClick={openImageModal}
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 40%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <div className="relative">
                <EditButton element="headline" position="-top-2 -right-2" />
                {showHeadline && (
                  <h3 className="text-white leading-[0.95] mb-3 uppercase tracking-tight" style={{ fontFamily: headingFontFamily, fontWeight: headlineTypography.fontWeight, fontSize: headlineTypography.fontSize, textAlign: headlineTypography.textAlign, marginTop: '2px' }}>
                    {creative.headline}
                  </h3>
                )}
              </div>
              <div className="relative">
                <EditButton element="description" position="-top-2 -right-2" />
                {showDescription && (
                  <p className="text-white/75 text-sm leading-relaxed mb-3 max-w-[85%]" style={{ fontFamily: bodyFontFamily }}>
                    {creative.description}
                  </p>
                )}
              </div>
              {creative.cta && showCta && (
                <div className="relative inline-block">
                  <EditButton element="cta" position="-top-2 -right-6" />
                  <span className="inline-block px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full border border-white/40 text-white">
                    {creative.cta}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      // LAYOUT 2: Dark centered
      case 1:
        return (
          <div className="group relative w-full h-full overflow-hidden rounded-2xl" style={{ backgroundColor: '#0a0a0a' }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                style={{ filter: 'brightness(0.7) contrast(1.1)', opacity: 0.75 }}
                onClick={openImageModal}
              />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 text-center">
              <div className="relative">
                <EditButton element="headline" position="-top-2 -right-2" />
                {showHeadline && (
                  <h3 className="text-white leading-[0.9] mb-4 uppercase tracking-tight" style={{ fontFamily: headingFontFamily, fontWeight: headlineTypography.fontWeight, fontSize: headlineTypography.fontSize, textAlign: headlineTypography.textAlign, marginTop: '2px' }}>
                    {creative.headline}
                  </h3>
                )}
              </div>
              <div className="relative">
                <EditButton element="description" position="-top-2 -right-2" />
                {showDescription && (
                  <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-[90%]" style={{ fontFamily: bodyFontFamily }}>
                    {creative.description}
                  </p>
                )}
              </div>
              {creative.cta && showCta && (
                <div className="relative inline-block">
                  <EditButton element="cta" position="-top-2 -right-6" />
                  <span className="inline-block px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {creative.cta}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      // LAYOUT 3: Giant headline overlap
      case 2:
        return (
          <div className="group relative w-full h-full overflow-hidden rounded-2xl" style={{ backgroundColor: '#111' }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                style={{ filter: 'brightness(0.8)' }}
                onClick={openImageModal}
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.35) 50%, transparent 80%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <div className="relative">
                <EditButton element="headline" position="-top-2 -right-2" />
                {showHeadline && (
                  <h3 className="text-white leading-[0.85] mb-3 uppercase tracking-tight" style={{ fontFamily: headingFontFamily, fontWeight: headlineTypography.fontWeight, fontSize: headlineTypography.fontSize, textAlign: headlineTypography.textAlign, marginTop: '2px' }}>
                    {creative.headline}
                  </h3>
                )}
              </div>
              <div className="relative">
                <EditButton element="description" position="-top-2 -right-2" />
                {showDescription && (
                  <p className="text-white/65 text-[12px] leading-relaxed mb-1" style={{ fontFamily: bodyFontFamily }}>
                    {creative.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // LAYOUT 4: Brand accent panel
      case 3:
        return (
          <div className="group relative w-full h-full overflow-hidden rounded-2xl" style={{ backgroundColor: '#111' }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                style={{ filter: 'brightness(0.8)' }}
                onClick={openImageModal}
              />
            )}
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute top-0 right-0 w-[45%] h-full z-10" style={{ backgroundColor: primary, clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)', opacity: 0.92 }} />
            <div className="absolute top-0 right-0 w-[42%] h-full flex flex-col justify-center p-5 z-20">
              <div className="relative">
                <EditButton element="headline" position="-top-2 -right-2" />
                {showHeadline && (
                  <h3 className="leading-[0.9] mb-3 uppercase tracking-tight" style={{ fontFamily: headingFontFamily, fontWeight: headlineTypography.fontWeight, fontSize: headlineTypography.fontSize, textAlign: headlineTypography.textAlign, color: getContrastColor(primary), marginTop: '2px' }}>
                    {creative.headline}
                  </h3>
                )}
              </div>
              <div className="relative">
                <EditButton element="description" position="-top-2 -right-2" />
                {showDescription && (
                  <p className="text-[11px] leading-relaxed mb-3 uppercase tracking-wide" style={{ fontFamily: bodyFontFamily, color: getContrastColor(primary), opacity: 0.8 }}>
                    {creative.description}
                  </p>
                )}
              </div>
              {creative.cta && showCta && (
                <div className="relative inline-block">
                  <EditButton element="cta" position="-top-2 -right-6" />
                  <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm w-fit" style={{ backgroundColor: getContrastColor(primary), color: primary }}>
                    {creative.cta}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      // LAYOUT 5: Clean white card — angled image top, dark text bottom
      case 4:
      default:
        return (
          <div className="group relative w-full h-full overflow-hidden rounded-2xl flex flex-col" style={{ backgroundColor: '#f8f8f8' }}>
            {/* Image top section with angle clip */}
            <div
              className="relative w-full flex-shrink-0 overflow-hidden"
              style={{ height: '55%', clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover cursor-pointer" onClick={openImageModal} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-300 to-surface-400 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-surface-500" />
                </div>
              )}
            </div>
            {/* Text content — white bg, dark text */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-6 pt-2">
              <div className="relative">
                <EditButtonDark element="headline" position="-top-2 -right-2" />
                {showHeadline && (
                  <h3
                    className="leading-[1] mb-3 tracking-tight"
                    style={{ fontFamily: headingFontFamily, fontWeight: headlineTypography.fontWeight, fontSize: headlineTypography.fontSize, textAlign: headlineTypography.textAlign, color: '#1a1a1a', marginTop: '2px' }}
                  >
                    {creative.headline}
                  </h3>
                )}
              </div>
              <div className="relative">
                <EditButtonDark element="description" position="-top-2 -right-2" />
                {showDescription && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: bodyFontFamily, color: '#555' }}
                  >
                    {creative.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const previewAspectCss = imageAspectRatioCss(
    safeImagePrompts.find((p) => p.creativeIndex === editingIndex)?.aspectRatio
  );

  return (
    <div className="min-h-screen pt-16 bg-surface-950">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-surface-800">
            <button
              onClick={handleBackToCreatives}
              className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Creatives</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateCreative('prev')}
                disabled={editingIndex === 0}
                className="p-2 rounded-lg hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-surface-400" />
              </button>
              <span className="text-sm text-surface-400">
                {editingIndex + 1} / {creatives.length}
              </span>
              <button
                onClick={() => navigateCreative('next')}
                disabled={editingIndex === creatives.length - 1}
                className="p-2 rounded-lg hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </button>
            </div>
          </div>

          {/* Creative Preview — large centered */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[#0f0f0f]">
            <AnimatePresence mode="wait">
              <motion.div
                key={editingIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative"
                style={{ width: '360px', aspectRatio: previewAspectCss }}
              >
                <div ref={creativePreviewRef} className="w-full h-full relative">
                  {renderCreativePreview()}
                </div>

                {hasBothImageVersions && editingIndex !== null && (
                  <div className="absolute top-3 left-1/2 z-50 flex -translate-x-1/2 pointer-events-none">
                    <div
                      className="pointer-events-auto flex rounded-lg border border-white/20 bg-black/55 p-0.5 backdrop-blur-md shadow-lg"
                      role="group"
                      aria-label="Image version"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setImageVersionByCreative((prev) => ({ ...prev, [editingIndex]: 'website' }))
                        }
                        className={[
                          'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                          activeImageVersion === 'website'
                            ? 'bg-white text-surface-900'
                            : 'text-white/80 hover:text-white',
                        ].join(' ')}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImageVersionByCreative((prev) => ({ ...prev, [editingIndex]: 'ai' }))
                        }
                        className={[
                          'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                          activeImageVersion === 'ai'
                            ? 'bg-indigo-500 text-white'
                            : 'text-white/80 hover:text-white',
                        ].join(' ')}
                      >
                        AI
                      </button>
                    </div>
                  </div>
                )}

                {/* Regenerating Overlay */}
                {isRegenerating && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-40 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
                      <p className="text-white text-sm font-medium">Regenerating creative...</p>
                      <p className="text-surface-400 text-xs mt-1">This may take a moment</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-surface-800">
            {saveStatus === 'saved' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-emerald-400 text-sm mr-4"
              >
                <Check className="w-4 h-4" />
                Saved
              </motion.div>
            )}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleDownload}
              disabled={!imageUrl || isDownloading}
              className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Right Sidebar — Edit Panel */}
        <div className="w-96 border-l border-surface-800 bg-surface-900 overflow-y-auto">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-white mb-1">Edit Creative</h2>
            <p className="text-xs text-surface-500 mb-6">Click an edit icon on the preview or use the fields below. Save to update.</p>

            {/* Image Preview */}
            <div className="mb-6">
              <label className="flex items-center justify-between text-sm font-medium text-surface-300 mb-3">
                <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-surface-500" />
                Image
                </span>
                <button
                  onClick={openImageModal}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Edit image
                </button>
              </label>
              <div className="h-[200px] w-full rounded-xl overflow-hidden bg-surface-800 border border-surface-700 flex items-center justify-center p-2">
                {imageUrl ? (
                  <div
                    className="max-h-full max-w-full overflow-hidden rounded-lg cursor-pointer"
                    style={{ aspectRatio: previewAspectCss }}
                    onClick={openImageModal}
                    onKeyDown={(e) => e.key === 'Enter' && openImageModal()}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-surface-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Headline */}
            <VisibilityToggle
              label="Headline"
              visible={showHeadline}
              onToggle={() => toggleVisibility('headline')}
            />
            <EditField
              label="Headline"
              value={creative.headline}
              isEditing={editingElement === 'headline'}
              editValue={editValue}
              onStartEdit={() => startEditing('headline')}
              onSave={saveEdit}
              onCancel={cancelEditing}
              onChange={setEditValue}
              multiline
            />

            {/* Description */}
            <VisibilityToggle
              label="Description"
              visible={showDescription}
              onToggle={() => toggleVisibility('description')}
            />
            <EditField
              label="Description"
              value={creative.description}
              isEditing={editingElement === 'description'}
              editValue={editValue}
              onStartEdit={() => startEditing('description')}
              onSave={saveEdit}
              onCancel={cancelEditing}
              onChange={setEditValue}
              multiline
            />

            {/* Call to Action */}
            <VisibilityToggle
              label="Call to Action"
              visible={showCta}
              onToggle={() => toggleVisibility('cta')}
            />
            <EditField
              label="Call to Action"
              value={creative.cta}
              isEditing={editingElement === 'cta'}
              editValue={editValue}
              onStartEdit={() => startEditing('cta')}
              onSave={saveEdit}
              onCancel={cancelEditing}
              onChange={setEditValue}
            />

            {/* Info */}
            <div className="mt-6 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
              <p className="text-xs text-surface-500 leading-relaxed">
                <strong className="text-surface-400">Tip:</strong> Edit any text field, then click Save.
                Hit &quot;Regenerate&quot; to create a new AI image that matches your updated text while keeping the brand style.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Edit Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="max-w-5xl mx-auto mt-10 bg-surface-900 border border-surface-700 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
                <div>
                  <h3 className="text-white font-semibold">Edit image</h3>
                  <p className="text-xs text-surface-500 mt-1">Use source image, optional background edit, then apply.</p>
                </div>
                <button onClick={() => setIsImageModalOpen(false)} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid lg:grid-cols-[1.2fr_0.9fr] gap-5 p-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-surface-300 font-medium">Source image</p>
                    <button
                      onClick={() => imageUploadInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-600 hover:border-indigo-400 text-surface-200 text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Images
                    </button>
                    <input
                      ref={imageUploadInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadSourceImages}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                    {availableSourceImages.map((src) => (
                      <button
                        key={src}
                        onClick={() => setSelectedSourceImage(src)}
                        className={[
                          'aspect-square rounded-lg overflow-hidden border-2 transition-colors',
                          selectedSourceImage === src ? 'border-indigo-400' : 'border-surface-700 hover:border-surface-500',
                        ].join(' ')}
                      >
                        <img src={src} alt="source" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm text-surface-300 font-medium">Background edits <span className="text-surface-500">(Optional)</span></label>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-surface-700 bg-surface-800/60 px-3 py-2">
                      <input
                        value={imageEditPrompt}
                        onChange={(e) => setImageEditPrompt(e.target.value)}
                        placeholder="Describe the background you want this image to have"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-surface-500 focus:outline-none"
                      />
                      <ArrowRight className="w-4 h-4 text-surface-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-surface-300 font-medium mb-3">Preview</p>
                  <div className="rounded-xl border border-surface-700 bg-surface-800 overflow-hidden aspect-square">
                    {selectedSourceImage ? (
                      <img src={selectedSourceImage} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-surface-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-surface-700 flex justify-end gap-2">
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyImageEdit}
                  disabled={!selectedSourceImage || isApplyingImageEdit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isApplyingImageEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VisibilityToggle({
  label,
  visible,
  onToggle,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800/40 px-3 py-2">
      <span className="text-xs text-surface-400">{label} visibility</span>
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-xs text-surface-300 hover:text-white transition-colors"
      >
        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

// ─── Reusable Edit Field Component ───
function EditField({
  label,
  value,
  isEditing,
  editValue,
  onStartEdit,
  onSave,
  onCancel,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-surface-300">{label}</label>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-800 border border-indigo-500/50 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-800 border border-indigo-500/50 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={onStartEdit}
          className="px-3 py-2.5 bg-surface-800/50 border border-surface-700 rounded-xl text-white text-sm cursor-pointer hover:border-surface-600 transition-colors"
        >
          {value || <span className="text-surface-500 italic">Empty</span>}
        </div>
      )}
    </div>
  );
}
