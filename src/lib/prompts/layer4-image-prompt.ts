// ============================================
// LAYER 4: Image Prompt Builder
// Model: Gemini Pro | Temperature: 0.5
// ============================================

import type { BrandDNA, SocialCreative, CampaignStrategy } from '@/types';
import {
   getIndustryArchetype,
   getSceneVocabularyPrompt,
   getQualityBoostersPrompt,
   getNegativeElementsPrompt,
} from './industry-archetypes';

// Base system prompt — industry-specific sections are injected dynamically
const BASE_SYSTEM_PROMPT = `You are an expert image-prompt writer for brand social media creatives. You turn a creative brief into a single, clear image generation prompt.

YOUR MISSION: Write ONE image prompt that produces a scroll-stopping, brand-authentic visual. Give the scene real variety — don't force every image into the same "luxury editorial" look.

CRITICAL RULES:
1. NO text rendering instructions (the model can't render text reliably).
2. NO pixel dimensions or layout math.
3. Be specific and concrete, not generic.
4. Output a SINGLE prompt string (no JSON, no markdown, no explanations).
5. Keep prompts between 60-120 words.
6. End with a short "Avoid:" clause listing elements that would cheapen the result.

WHAT TO INCLUDE (naturally, not as rigid sections):
- Subject and where it sits in the frame.
- The scene/setting and a few concrete props or textures.
- Lighting and overall mood.
- Camera feel (angle, depth of field) where it helps.
- 3-5 colors that fit the brand.

BRAND GUARDRAILS (never break):
- Match the brand's tone, values, and positioning; respect the avoid-list.
- Only go premium/cinematic if the brand is actually premium.

COMMERCIAL SAFETY:
- Professional advertising imagery only. Subjects fully clothed and tasteful.
- No sexual, suggestive, violent, or otherwise unsafe content.

BRAND REFERENCE IMAGES:
You will receive the brand's own product/logo photos as reference images alongside this prompt.
- PRESERVE the exact product shape, packaging, label design, logo placement, and visual identity from the references.
- DO NOT redesign the product itself.
- CHANGE only the scene: background, lighting, camera angle, atmosphere, and composition to match the brief.`;

export function buildLayer4SystemPrompt(
   brandDNA: BrandDNA,
   basePrompt: string = BASE_SYSTEM_PROMPT,
): string {
   const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

   return `${basePrompt}

SCENE VOCABULARY (suggestions — use what fits):
${getSceneVocabularyPrompt(archetype)}

QUALITY CUES (optional, ${archetype.label}):
${getQualityBoostersPrompt(archetype)}

AVOID: ${getNegativeElementsPrompt(archetype)}

REFERENCE (tone/detail only — do not copy):
"${archetype.exampleImageIntent}"`;
}

// Keep backward-compatible export
export const LAYER4_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT;

const aspectRatioGuidance: Record<string, string> = {
   '9:16':
      '9:16 vertical story/Reels frame — tall canvas. Place the hero along a strong vertical flow; leave intentional top/bottom breathing room safe for UI overlays.',
   '1:1':
      '1:1 square feed frame — balanced centered composition with equal visual weight on all sides.',
   '4:5':
      '4:5 portrait feed frame — slightly taller than square; optimize for Instagram portrait posts with vertical emphasis without extreme letterboxing.',
   '16:9':
      '16:9 landscape wide frame — cinematic horizontal composition with left-to-right or wide environmental storytelling.',
};

export const buildLayer4UserPrompt = (
   creative: SocialCreative,
   brandDNA: BrandDNA,
   creativeIndex: number,
   campaign?: CampaignStrategy,
   aspectRatio: keyof typeof aspectRatioGuidance = '1:1'
) => {
   const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

   // Build rich context
   const headline = creative?.headline || 'Product showcase';
   const imageIntent = creative?.imageIntent || 'Professional brand imagery';
   const layout = creative?.layout || 'hero-center';
   const colorMood = (creative as { colorMood?: string })?.colorMood || 'premium';
   const photographyStyle = (creative as { photographyStyle?: string })?.photographyStyle || 'commercial photography';
   const sceneElements = (creative as { sceneElements?: string[] })?.sceneElements || [];

   const brandAesthetic = brandDNA?.brandAesthetic || 'Modern, clean, professional';
   const brandValues = Array.isArray(brandDNA?.brandValues) ? brandDNA.brandValues.join(', ') : 'Quality, Trust';
   const positioning = brandDNA?.positioning || 'mid';

   // Campaign context if available
   const emotionalLever = campaign?.emotionalLever || 'trust';
   const visualDirection = campaign?.visualDirection || '';
   const campaignGoal = campaign?.goal || 'awareness';

   const frameGuide = aspectRatioGuidance[aspectRatio] ?? aspectRatioGuidance['1:1'];

   // Build scene elements section if available
   const sceneElementsSection = sceneElements.length > 0
      ? `\nScene elements to include: ${sceneElements.join(', ')}\n`
      : '';

   return `Write ONE image prompt for creative #${creativeIndex + 1}.

CREATIVE BRIEF:
- Headline: "${headline}"
- Image Intent: ${imageIntent}
- Photography Style: ${photographyStyle}
- Color Mood: ${colorMood}
- Layout: ${layout}
${sceneElementsSection}
BRAND CONTEXT:
- Industry: ${archetype.label}
- Product Type: ${brandDNA.productType || 'General'}
- Aesthetic: ${brandAesthetic}
- Values: ${brandValues}
- Positioning: ${positioning} (only go premium/cinematic if this is "premium")

CAMPAIGN CONTEXT:
- Goal: ${campaignGoal}
- Emotional Lever: ${emotionalLever}
${visualDirection ? `- Visual Direction: ${visualDirection}` : ''}

ASPECT RATIO:
- Compose for ${aspectRatio}. ${frameGuide}

REFERENCE IMAGE USAGE:
- You will be given the brand's actual product/logo photos as input.
- Keep the product appearance, packaging, and logo EXACTLY as shown.
- Design a fresh scene (background, props, lighting, atmosphere) that fits the brief and the brand's positioning.

REQUIREMENTS:
1. A SINGLE image prompt, 60-120 words.
2. Follow the image intent — give the scene genuine variety, don't default to luxury unless the brand is premium.
3. Faithfully reproduce the product from the reference photos.
4. Keep it commercially safe (professional advertising imagery, subjects fully clothed, nothing suggestive).
5. Compose for ${aspectRatio}.
6. End with a short "Avoid:" clause.

Output ONLY the prompt text. No explanations, no markdown, no JSON.`;
};
