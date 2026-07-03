// ============================================
// LAYER 1: Brand DNA Types
// ============================================
export interface BrandDNA {
  brandValues: string[];
  brandAesthetic: string;
  brandToneOfVoice: string[];
  marketingBias: string[];
  avoidList: string[];
  positioning: 'budget' | 'mid' | 'premium';
  audienceMindset: 'aspirational' | 'practical' | 'emotional' | 'status-driven';
  industry?: string;
  productType?: string;
}

// ============================================
// LAYER 2: Campaign Strategy Types
// ============================================
export type EmotionalLever =
  | 'aspiration'
  | 'fear'
  | 'belonging'
  | 'curiosity'
  | 'pride'
  | 'relief'
  | 'urgency'
  | 'trust';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'pinterest'
  | 'twitter';

/** Each of the 3 campaigns in a set must use a distinct lens. */
export type StrategicLens =
  | 'product-led'
  | 'audience-identity'
  | 'category-contrast'
  | 'cultural-moment'
  | 'problem-solution'
  | 'origin-story';

/** Each of the 3 campaigns in a set must use a distinct hook archetype. */
export type HookArchetype =
  | 'provocative-question'
  | 'bold-statement'
  | 'social-proof'
  | 'contrast-reveal'
  | 'micro-story'
  | 'data-shock';

export const STRATEGIC_LENSES: StrategicLens[] = [
  'product-led',
  'audience-identity',
  'category-contrast',
  'cultural-moment',
  'problem-solution',
  'origin-story',
];

export const HOOK_ARCHETYPES: HookArchetype[] = [
  'provocative-question',
  'bold-statement',
  'social-proof',
  'contrast-reveal',
  'micro-story',
  'data-shock',
];

export interface CampaignStrategy {
  title: string;
  goal: 'awareness' | 'consideration' | 'conversion';
  strategicAngle: string;
  narrativeHook: string;
  audiencePainPoint: string;
  emotionalLever: EmotionalLever;
  ctaStyle: 'soft' | 'medium' | 'strong';
  visualDirection: string;
  bestPlatforms: SocialPlatform[];
  strategicLens?: StrategicLens;
  hookArchetype?: HookArchetype;
}

// ============================================
// LAYER 3: Creative Types
// ============================================
export type LayoutType =
  | 'hero-center'
  | 'split-left'
  | 'split-right'
  | 'minimal-bottom'
  | 'full-bleed'
  | 'card-stack'
  | 'diagonal-split';

export type OverlayStyle =
  | 'gradient-dark'
  | 'gradient-light'
  | 'solid-dark'
  | 'solid-light'
  | 'blur-heavy'
  | 'blur-light'
  | 'duotone'
  | 'none';

export interface TextStyle {
  fontWeight: 'light' | 'regular' | 'bold';
  alignment: 'left' | 'center';
  hierarchy: 'headline-dominant' | 'balanced';
}

export type ColorMood =
  | 'energetic'
  | 'premium'
  | 'calm'
  | 'bold'
  | 'natural'
  | 'ultra-luxury'
  | 'arabian-nights'
  | 'modern-premium'
  | 'dark-opulence'
  | 'fresh-luxury'
  | 'royal'
  | string; // Allow custom luxury palettes

export type PhotographyStyle =
  | 'editorial fashion'
  | 'lifestyle documentary'
  | 'commercial product'
  | 'cinematic mood'
  | 'flat lay'
  | 'environmental portrait'
  | 'abstract texture'
  | string; // Allow custom styles

export interface SocialCreative {
  headline: string;
  description: string;
  cta: string;
  layout: LayoutType;
  overlayStyle: OverlayStyle;
  colorMood: ColorMood;
  photographyStyle: PhotographyStyle;
  textStyle: TextStyle;
  imageIntent: string;
  sceneElements?: string[];
  /** When set, creatives grid uses full-bleed infographic styling instead of rotating templates. */
  layoutTemplate?: string | null;
}

// ============================================
// LAYER 4: Image Prompt Types
// ============================================
export interface ImagePrompt {
  creativeIndex: number;
  prompt: string;
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
}

// ============================================
// LAYER 5: Generated Image Types
// ============================================
export interface GeneratedImage {
  creativeIndex: number;
  imageUrl: string;
  base64?: string;
}

// ============================================
// LAYER 6: Modification Types
// ============================================
export interface ImageModification {
  instruction: string;
  preserveElements: string[];
}

// ============================================
// Orchestration Types
// ============================================
export interface WebsiteData {
  url: string;
  textContent: string;
  title: string;
  description: string;
  keywords: string[];
  images: string[];
  // Extended fields
  brandName?: string;
  logo?: string | null;
  tagline?: string | null;
  heroText?: string | null;
  aboutSection?: string | null;
  colors?: string[];
  fonts?: string[];
  socialLinks?: string[];
  contactEmail?: string | null;
}

export interface PipelineState {
  status: 'idle' | 'scraping' | 'extracting' | 'analyzing' | 'strategizing' | 'architecting' | 'prompting' | 'generating' | 'complete' | 'error';
  currentLayer: number;
  websiteData: WebsiteData | null;
  brandDNA: BrandDNA | null;
  campaigns: CampaignStrategy[];
  selectedCampaign: CampaignStrategy | null;
  creatives: SocialCreative[];
  imagePrompts: ImagePrompt[];
  generatedImages: GeneratedImage[];
  error: string | null;
}

// ============================================
// API Response Types
// ============================================
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Config Types
// ============================================
export const ALLOWED_LAYOUTS: LayoutType[] = [
  'hero-center',
  'split-left',
  'split-right',
  'minimal-bottom',
  'full-bleed',
  'card-stack',
  'diagonal-split',
];

export const ALLOWED_OVERLAYS: OverlayStyle[] = [
  'gradient-dark',
  'gradient-light',
  'solid-dark',
  'solid-light',
  'blur-heavy',
  'blur-light',
  'duotone',
  'none',
];

