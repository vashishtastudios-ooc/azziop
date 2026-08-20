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
const BASE_SYSTEM_PROMPT = `You are a creative director designing social media creatives for a brand. You create scroll-stopping visuals that feel authentic to the brand — not generic, not formulaic.

YOUR MISSION: Create 5 VISUALLY DISTINCT social media creatives. Give yourself real creative freedom on scene, mood, and style — but every creative must stay true to the brand's identity.

BRAND ANCHORS (never break these):
- Preserve the brand's tone, values, and positioning.
- Never violate the brand's avoid-list.
- Match the audience's mindset and the campaign's intent.
- Do NOT default to luxury / cinematic / "ultra-premium" styling unless the brand's positioning is actually premium. A budget brand should feel approachable; a playful brand should feel fun.

CREATIVE FREEDOM (vary these across the 5 creatives):
- Choose a DIFFERENT concept territory for each creative:
  product-hero, lifestyle-moment, problem-solution, sensory-metaphor,
  community, founder-story, cultural-angle, before-after, witty-contrast
- Vary the scene, setting, metaphor, mood, and photography approach — no two creatives should look alike.

CRITICAL RULES:
1. Output VALID JSON ONLY - no markdown code blocks, no explanations.
2. Each creative must have a genuinely different visual concept.
3. Headlines: <=10 words, punchy, specific to the brand (no generic marketing-speak).
4. Descriptions: <=25 words, benefit-focused.
5. imageIntent: 40-80 words — a clear, specific visual scene (subject, setting, mood, light). Vivid but not a rigid cinematic essay.
6. sceneElements: 3-5 concrete props, textures, or effects that fit the concept.
7. Choose a layout and overlayStyle that genuinely fit each concept (these drive how text sits on the image).

LAYOUTS: hero-center | split-left | split-right | minimal-bottom | full-bleed | card-stack | diagonal-split
OVERLAYS: gradient-dark | gradient-light | solid-dark | solid-light | blur-heavy | blur-light | duotone | none

OUTPUT FORMAT (JSON array only):
[
  {
    "headline": "Scroll-stopping headline",
    "description": "Benefit-focused description",
    "cta": "Action text",
    "layout": "layout-name",
    "overlayStyle": "overlay-name",
    "colorMood": "color palette name that fits the brand",
    "photographyStyle": "photography style that fits the concept",
    "textStyle": {
      "fontWeight": "light|regular|bold",
      "alignment": "left|center",
      "hierarchy": "headline-dominant|balanced"
    },
    "imageIntent": "Clear, specific 40-80 word visual scene: subject, setting, mood, lighting",
    "sceneElements": ["prop/texture 1", "effect 2", "material 3"]
  }
]`;

export function buildLayer3SystemPrompt(
  brandDNA: BrandDNA,
  basePrompt: string = BASE_SYSTEM_PROMPT,
): string {
  const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

  return `${basePrompt}

CONCEPT INSPIRATION (optional — draw from these, do not copy verbatim):
${getCreativeArchetypesPrompt(archetype)}

PHOTOGRAPHY STYLES TO VARY BETWEEN (suggestions):
${getPhotographyStylesPrompt(archetype)}

COLOR PALETTES THAT FIT THIS BRAND (suggestions):
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

AVAILABLE OPTIONS (choose the ones that fit each concept):
- Layouts: ${allowedLayouts.join(', ')}
- Overlays: ${allowedOverlays.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATIVE DIRECTION FOR ${archetype.label.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Optional quality cues to draw from (use only where they fit the brand — do not force premium styling on a non-premium brand):
${getPremiumMandatesPrompt(archetype)}

REFERENCE (for tone/detail only — do not copy):
"${archetype.exampleImageIntent}"

TASK: Generate 5 VISUALLY DISTINCT creatives as a JSON array.

Remember:
1. Each creative uses a DIFFERENT concept territory and looks clearly different from the others.
2. imageIntent = a clear 40-80 word scene (subject, setting, mood, lighting).
3. Include sceneElements (3-5 concrete props/textures/effects).
4. Vary the photography approach across the 5.
5. Match the emotional lever (${emotionalLever}) in mood — without defaulting to luxury unless the brand is premium.
6. Headlines connect to the narrative hook and stay authentic to the brand.
7. Never violate the brand avoid-list.

Output JSON only. No markdown.`;
};
