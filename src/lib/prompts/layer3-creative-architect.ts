// ============================================
// LAYER 3: Creative Architect Prompt
// Model: Gemini Pro | Temperature: 0.7 | Max tokens: ~1500
// ============================================

import type { BrandDNA, CampaignStrategy, LayoutType, OverlayStyle } from '@/types';
import {
  getIndustryArchetype,
  getCreativeArchetypesPrompt,
  getPhotographyStylesPrompt,
  getColorPalettesPrompt,
  getPremiumMandatesPrompt,
} from './industry-archetypes';

// Base system prompt — industry-specific sections are injected dynamically
const BASE_SYSTEM_PROMPT = `You are the Executive Creative Director at a world-class brand agency. You design ultra-premium social media creatives that rival the world's most iconic brand campaigns.

YOUR MISSION: Create 5 VISUALLY DISTINCT social media creatives that form a cinematic campaign narrative — each one a world-class visual story tailored to the brand's specific industry.

CRITICAL RULES:
1. Output VALID JSON ONLY - no markdown code blocks, no explanations
2. Each creative MUST have a UNIQUE visual concept - no two images should look similar
3. Headlines: ≤10 words, punchy, scroll-stopping
4. Descriptions: ≤25 words, benefit-focused, aspirational
5. imageIntent: 60-100 words — RICH, SPECIFIC, CINEMATIC visual scene descriptions
6. sceneElements: 3-5 specific visual textures, props, or effects for each scene

NARRATIVE ARC (each creative serves a purpose):
1. HOOK → Stop the scroll with visual drama
2. STORY → Create sensory immersion and emotional resonance
3. DESIRE → Show the aspirational transformation/world
4. ACTION → Drive action with premium urgency
5. VALIDATE → Build trust through social proof or lifestyle context

IMAGE INTENT GUIDELINES (be EXTREMELY specific and cinematic):
❌ BAD: "Person wearing activewear"
✅ GOOD: "Confident woman mid-yoga pose in sleek black leggings, morning light streaming through floor-to-ceiling windows, minimalist loft studio"

❌ BAD: "Product on background"
✅ GOOD: "Product on dark marble pedestal with dramatic golden backlight, surrounded by floating saffron threads and amber resin chunks, warm incense smoke wisps, deep bronze palette, 85mm f/1.4, cinematic editorial"

LAYOUTS: hero-center | split-left | split-right | minimal-bottom | full-bleed | card-stack | diagonal-split
OVERLAYS: gradient-dark | gradient-light | solid-dark | solid-light | blur-heavy | blur-light | duotone | none

OUTPUT FORMAT (JSON array only):
[
  {
    "headline": "Scroll-stopping headline",
    "description": "Benefit-focused aspirational description",
    "cta": "Action text",
    "layout": "layout-name",
    "overlayStyle": "overlay-name",
    "colorMood": "industry-appropriate color palette name",
    "photographyStyle": "specific photography style from the industry list",
    "textStyle": {
      "fontWeight": "light|regular|bold",
      "alignment": "left|center",
      "hierarchy": "headline-dominant|balanced"
    },
    "imageIntent": "Rich, cinematic, 60-100 word visual scene description with industry-specific materials, textures, lighting, atmospheric effects, and camera details",
    "sceneElements": ["specific texture/prop 1", "specific effect 2", "specific material 3", "specific atmosphere 4"]
  }
]`;

export function buildLayer3SystemPrompt(brandDNA: BrandDNA): string {
  const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

  return `${BASE_SYSTEM_PROMPT}

${getCreativeArchetypesPrompt(archetype)}

INDUSTRY PHOTOGRAPHY STYLES TO VARY:
${getPhotographyStylesPrompt(archetype)}

INDUSTRY COLOR PALETTES:
${getColorPalettesPrompt(archetype)}`;
}

// Keep backward-compatible export for any code using the old constant
export const LAYER3_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT;

export const buildLayer3UserPrompt = (
  campaign: CampaignStrategy,
  brandDNA: BrandDNA,
  allowedLayouts: LayoutType[],
  allowedOverlays: OverlayStyle[]
) => {
  const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

  // Extract campaign details with fallbacks
  const campaignTitle = campaign.title || 'Brand Campaign';
  const campaignGoal = campaign.goal || 'awareness';
  const narrativeHook = campaign.narrativeHook || '';
  const strategicAngle = campaign.strategicAngle || '';
  const emotionalLever = campaign.emotionalLever || 'trust';
  const audiencePainPoint = campaign.audiencePainPoint || '';
  const visualDirection = campaign.visualDirection || '';
  const ctaStyle = campaign.ctaStyle || 'medium';

  return `CAMPAIGN BRIEF:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Campaign: "${campaignTitle}"
Goal: ${campaignGoal.toUpperCase()}
Emotional Lever: ${emotionalLever}
CTA Intensity: ${ctaStyle}
Industry: ${archetype.label}
Product Type: ${brandDNA.productType || 'General'}

Strategic Angle:
${strategicAngle}

Narrative Hook:
"${narrativeHook}"

${audiencePainPoint ? `Audience Pain Point:\n${audiencePainPoint}\n` : ''}
${visualDirection ? `Visual Direction Hint:\n${visualDirection}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND CONTEXT:
- Positioning: ${brandDNA.positioning || 'mid'}
- Audience Mindset: ${brandDNA.audienceMindset || 'practical'}
- Brand Values: ${brandDNA.brandValues?.join(', ') || 'Quality, Trust'}
- Brand Aesthetic: ${brandDNA.brandAesthetic || 'Modern, clean'}
- Tone: ${brandDNA.brandToneOfVoice?.join(', ') || 'Professional'}

⚠️ AVOID (brand guidelines):
${brandDNA.avoidList?.map(item => `- ${item}`).join('\n') || '- Nothing specified'}

AVAILABLE OPTIONS:
- Layouts: ${allowedLayouts.join(', ')}
- Overlays: ${allowedOverlays.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 PREMIUM CREATIVE MANDATES FOR ${archetype.label.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every imageIntent MUST include:
${getPremiumMandatesPrompt(archetype)}

REFERENCE IMAGE INTENT:
"${archetype.exampleImageIntent}"

Each imageIntent should read like a premium ${archetype.label} campaign brief — rich, sensory, and unmistakably high-end.

TASK: Generate 5 VISUALLY DISTINCT creatives as a JSON array.

Remember:
1. Each imageIntent must paint a UNIQUE, CINEMATIC, 60-100 word visual scene
2. Include the sceneElements array with 3-5 specific textures, props, and effects
3. Vary photography styles across the 5 creatives
4. Match the emotional lever (${emotionalLever}) in imagery and mood
5. Headlines should work with the narrative hook theme
6. Creatives MUST feel authentic to the ${archetype.label} industry

Output JSON only. No markdown.`;
};
