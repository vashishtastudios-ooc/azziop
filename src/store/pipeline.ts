// ============================================
// Pipeline State Store (Zustand)
// Manages the state of the creative pipeline
// ============================================

import { create } from 'zustand';
import type {
  PipelineState,
  WebsiteData,
  BrandDNA,
  CampaignStrategy,
  SocialCreative,
  ImagePrompt,
  GeneratedImage
} from '@/types';
import type { PlanId } from '~/lib/pricing';

// Extended state for multi-page app
interface ExtendedPipelineState extends PipelineState {
  // Navigation
  currentPage: 'home' | 'brand-dna' | 'campaigns' | 'creatives' | 'editor' | 'about' | 'faq' | 'pricing';
  editingCreativeIndex: number | null;

  // Project tracking
  projectId: string | null;

  // Extracted website data
  websiteColors: string[];
  websiteFonts: string[];
  websiteLogo: string | null;
  tagline: string | null;
  aboutSection: string | null;
  heroText: string | null;

  // Layout templates for each creative (index -> template)
  creativeLayouts: Record<number, CreativeLayoutTemplate>;
  userPlan: PlanId;
}

interface PipelineStore extends ExtendedPipelineState {
  // Actions
  reset: () => void;
  setStatus: (status: PipelineState['status']) => void;
  setCurrentLayer: (layer: number) => void;
  setCurrentPage: (page: ExtendedPipelineState['currentPage']) => void;
  setEditingCreative: (index: number | null) => void;
  setWebsiteData: (data: WebsiteData) => void;
  setBrandDNA: (dna: BrandDNA) => void;
  updateBrandDNA: (updates: Partial<BrandDNA>) => void;
  setCampaigns: (campaigns: CampaignStrategy[]) => void;
  setSelectedCampaign: (campaign: CampaignStrategy | null) => void;
  setCreatives: (creatives: SocialCreative[]) => void;
  updateCreative: (index: number, creative: Partial<SocialCreative>) => void;
  setImagePrompts: (prompts: ImagePrompt[]) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  updateGeneratedImage: (index: number, imageUrl: string) => void;
  setError: (error: string | null) => void;
  setWebsiteExtras: (extras: { colors?: string[]; fonts?: string[]; logo?: string; tagline?: string; aboutSection?: string; heroText?: string }) => void;
  updateWebsiteExtras: (field: string, value: string | string[]) => void;
  setUserPlan: (plan: PlanId) => void;

  // Layout management
  setCreativeLayout: (index: number, layout: CreativeLayoutTemplate) => void;
  cycleCreativeLayout: (index: number) => void;

  // Step 1: Extract Brand DNA only (preserveBrandPage: keep DNA on screen while re-running Layer 1)
  runPipeline: (url: string, options?: { preserveBrandPage?: boolean }) => Promise<void>;

  // Step 2: Generate campaigns from Brand DNA
  generateCampaigns: (userPrompt?: string) => Promise<void>;

  // Regenerate campaigns with optional user prompt
  regenerateCampaigns: (userPrompt?: string, previousContext?: { titles: string[]; hooks: string[]; angles: string[] }) => Promise<void>;
}

// Layout templates array
const LAYOUT_TEMPLATES_LIST: CreativeLayoutTemplate[] = [
  'collage-4',
  'split-left',
  'split-right',
  'full-bleed',
  'product-hero',
  'minimal',
  'bold-text',
  'gradient-card',
];

const initialState: ExtendedPipelineState = {
  status: 'idle',
  currentLayer: 0,
  currentPage: 'home',
  editingCreativeIndex: null,
  projectId: null,
  websiteData: null,
  brandDNA: null,
  campaigns: [],
  selectedCampaign: null,
  creatives: [],
  imagePrompts: [],
  generatedImages: [],
  error: null,
  websiteColors: [],
  websiteFonts: [],
  websiteLogo: null,
  tagline: null,
  aboutSection: null,
  heroText: null,
  creativeLayouts: {},
  userPlan: 'free',
};

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  setStatus: (status) => set({ status }),

  setCurrentLayer: (currentLayer) => set({ currentLayer }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setEditingCreative: (editingCreativeIndex) => set({ editingCreativeIndex }),

  setWebsiteData: (websiteData) => set({ websiteData }),

  setBrandDNA: (brandDNA) => set({ brandDNA }),

  setProjectId: (projectId) => set({ projectId }),

  updateBrandDNA: (updates) => set((state) => ({
    brandDNA: state.brandDNA ? { ...state.brandDNA, ...updates } : null,
  })),

  setCampaigns: (campaigns) => set({ campaigns }),

  setSelectedCampaign: (selectedCampaign) => set({ selectedCampaign }),

  setCreatives: (creatives) => set({ creatives }),

  updateCreative: (index, updates) => set((state) => {
    const newCreatives = [...state.creatives];
    newCreatives[index] = { ...newCreatives[index], ...updates };
    return { creatives: newCreatives };
  }),

  setImagePrompts: (imagePrompts) => set({ imagePrompts }),

  setGeneratedImages: (generatedImages) => set({ generatedImages }),

  updateGeneratedImage: (index, imageUrl) => set((state) => {
    const newImages = [...state.generatedImages];
    const existingIndex = newImages.findIndex(img => img.creativeIndex === index);
    if (existingIndex >= 0) {
      newImages[existingIndex] = { creativeIndex: index, imageUrl };
    } else {
      newImages.push({ creativeIndex: index, imageUrl });
    }
    return { generatedImages: newImages };
  }),

  setError: (error) => set({ error, status: error ? 'error' : get().status }),

  setWebsiteExtras: (extras) => set({
    websiteColors: extras.colors ?? get().websiteColors,
    websiteFonts: extras.fonts ?? get().websiteFonts,
    websiteLogo: extras.logo ?? get().websiteLogo,
    tagline: extras.tagline ?? get().tagline,
    aboutSection: extras.aboutSection ?? get().aboutSection,
    heroText: extras.heroText ?? get().heroText,
  }),

  updateWebsiteExtras: (field, value) => set((state) => ({
    ...(field === 'websiteColors' && { websiteColors: value as string[] }),
    ...(field === 'websiteFonts' && { websiteFonts: value as string[] }),
    ...(field === 'websiteLogo' && { websiteLogo: value as string }),
    ...(field === 'tagline' && { tagline: value as string }),
    ...(field === 'aboutSection' && { aboutSection: value as string }),
    ...(field === 'heroText' && { heroText: value as string }),
  })),

  setUserPlan: (userPlan) => set({ userPlan }),

  setCreativeLayout: (index, layout) => set((state) => ({
    creativeLayouts: { ...state.creativeLayouts, [index]: layout },
  })),

  cycleCreativeLayout: (index) => set((state) => {
    const currentLayout = state.creativeLayouts[index] || 'full-bleed';
    const currentIndex = LAYOUT_TEMPLATES_LIST.indexOf(currentLayout);
    const nextIndex = (currentIndex + 1) % LAYOUT_TEMPLATES_LIST.length;
    const nextLayout = LAYOUT_TEMPLATES_LIST[nextIndex];
    return {
      creativeLayouts: { ...state.creativeLayouts, [index]: nextLayout },
    };
  }),

  runPipeline: async (url: string, options?: { preserveBrandPage?: boolean }) => {
    const {
      setStatus,
      setCurrentLayer,
      setWebsiteData,
      setBrandDNA,
      setError,
      setWebsiteExtras,
      reset,
    } = get();

    if (options?.preserveBrandPage) {
      set((state) => ({
        ...state,
        campaigns: [],
        selectedCampaign: null,
        creatives: [],
        imagePrompts: [],
        generatedImages: [],
        creativeLayouts: {},
        error: null,
      }));
    } else {
      reset();
    }
    setStatus('extracting');
    setCurrentLayer(1);

    try {
      // Only run Layer 1: Brand DNA Extraction
      const response = await fetch('/api/layer1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 403) {
          throw new Error(`${result.error || 'Plan limit reached'} Upgrade at ${result.upgradeUrl || '/pricing'}`);
        }
        throw new Error(result.error || 'Brand DNA extraction failed');
      }

      const { data } = result;

      // Store projectId for future API calls
      if (data.projectId) {
        set((state) => ({ ...state, projectId: data.projectId }));
      }

      // Update state with Layer 1 results only
      setWebsiteData(data.websiteData);

      // Extract colors, fonts, logo from website data
      if (data.websiteData) {
        const wd = data.websiteData;
        setWebsiteExtras({
          colors: wd.colors || [],
          fonts: wd.fonts || [],
          logo: wd.logo || wd.images?.[0] || null,
          tagline: wd.tagline || wd.heroText || null,
          aboutSection: wd.aboutSection || null,
          heroText: wd.heroText || null,
        });
      }

      setBrandDNA(data.brandDNA);
      setCurrentLayer(1);
      setStatus('complete');

      // Navigation will be handled by the component via useEffect watching status

    } catch (error) {
      console.error('Pipeline error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(message);
      throw error;
    }
  },

  generateCampaigns: async (userPrompt?: string) => {
    const {
      brandDNA,
      websiteData,
      projectId,
      setCampaigns,
      setSelectedCampaign,
      setError,
      setStatus,
      setCurrentPage,
    } = get();

    if (!brandDNA || !websiteData) {
      setError('Brand DNA and website data are required to generate campaigns');
      return;
    }

    if (!projectId) {
      setError('Project ID is required. Please run pipeline first.');
      return;
    }

    setStatus('strategizing');

    try {
      // Build structured business overview from scraped fields
      const businessOverview = [
        websiteData.brandName ? `Brand: ${websiteData.brandName}` : '',
        websiteData.tagline ? `Tagline: ${websiteData.tagline}` : '',
        websiteData.description ? `About: ${websiteData.description}` : '',
        websiteData.heroText ? `Hero: ${websiteData.heroText}` : '',
        websiteData.aboutSection ? `Details: ${websiteData.aboutSection}` : '',
        websiteData.textContent?.slice(0, 800) || '',
      ].filter(Boolean).join('\n');

      const response = await fetch('/api/layer2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          brandDNA,
          businessOverview,
          userPrompt,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 403) {
          throw new Error(`${result.error || 'Plan limit reached'} Upgrade at ${result.upgradeUrl || '/pricing'}`);
        }
        throw new Error(result.error || 'Failed to generate campaigns');
      }

      setCampaigns(result.data.campaigns);
      setSelectedCampaign(null);
      setStatus('complete');

      // Navigation will be handled by the component via useEffect watching campaigns

    } catch (error) {
      console.error('Campaign generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate campaigns');
    }
  },

  regenerateCampaigns: async (userPrompt?: string, previousContext?: { titles: string[]; hooks: string[]; angles: string[] }) => {
    const {
      brandDNA,
      websiteData,
      projectId,
      setCampaigns,
      setSelectedCampaign,
      setError,
      setStatus,
    } = get();

    if (!brandDNA || !websiteData) {
      setError('Brand DNA and website data are required to regenerate campaigns');
      return;
    }

    if (!projectId) {
      setError('Project ID is required. Please run pipeline first.');
      return;
    }

    setStatus('strategizing');

    try {
      // Build structured business overview from scraped fields
      const businessOverview = [
        websiteData.brandName ? `Brand: ${websiteData.brandName}` : '',
        websiteData.tagline ? `Tagline: ${websiteData.tagline}` : '',
        websiteData.description ? `About: ${websiteData.description}` : '',
        websiteData.heroText ? `Hero: ${websiteData.heroText}` : '',
        websiteData.aboutSection ? `Details: ${websiteData.aboutSection}` : '',
        websiteData.textContent?.slice(0, 800) || '',
      ].filter(Boolean).join('\n');

      const response = await fetch('/api/layer2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          brandDNA,
          businessOverview,
          userPrompt,
          previousContext,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 403) {
          throw new Error(`${result.error || 'Plan limit reached'} Upgrade at ${result.upgradeUrl || '/pricing'}`);
        }
        throw new Error(result.error || 'Failed to generate campaigns');
      }

      setCampaigns(result.data.campaigns);
      setSelectedCampaign(null);  // Clear selection so user picks new one
      setStatus('complete');

    } catch (error) {
      console.error('Regenerate campaigns error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate campaigns');
    }
  },
}));

// Type for creative layout template
type CreativeLayoutTemplate =
  | 'collage-4'
  | 'split-left'
  | 'split-right'
  | 'full-bleed'
  | 'product-hero'
  | 'minimal'
  | 'bold-text'
  | 'gradient-card';

// Selector hooks
export const useIsLoading = () =>
  usePipelineStore((state) =>
    ['scraping', 'extracting', 'analyzing', 'strategizing', 'architecting', 'prompting', 'generating'].includes(state.status)
  );

export const useCurrentStep = () =>
  usePipelineStore((state) => {
    switch (state.status) {
      case 'scraping': return 'Reading your website...';
      case 'extracting': return 'Capturing brand visuals...';
      case 'analyzing': return 'Analyzing brand identity...';
      case 'strategizing': return 'Generating Campaign Strategies...';
      case 'architecting': return 'Architecting Creatives...';
      case 'prompting': return 'Building Image Prompts...';
      case 'generating': return 'Generating Images...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  });
