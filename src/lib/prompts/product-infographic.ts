// ============================================
// Product infographic — Layer 4 style briefs for image generation
// ============================================

import type { BrandDNA } from '@/types';
import type { ProductPageExtract } from '@/lib/productPageScraper';

export function buildProductInfographicSystemPrompt(
  brandDNA: BrandDNA,
  count: number,
): string {
  return `You are a world-class creative director at a top DTC agency. Your specialty is CONVERSION-FOCUSED product infographics — the kind of visuals that make a viewer immediately desire the product.

OUTPUT: Valid JSON ONLY — no markdown, no code fences.

GOAL: Produce exactly ${count} creative objects and ${count} image prompts for a premium product campaign. Every frame must sell. Every visual must feel aspirational, tactile, and luxurious.

═══ COPY RULES (strict — every item in "creatives") ═══
- headline: maximum 5 words, desire-driven (not generic). Examples: "Indulge in Pure Luxury", "Your New Obsession", "Crafted for the Bold".
- description: one punchy sentence, max 120 chars — focus on one emotional benefit or sensory detail that makes the viewer WANT the product.
- cta: 2–3 words, action-oriented, urgency-laced (Shop Now, Get Yours, Discover, Claim It, Try Today).
- layout: always "full-bleed".
- textStyle: always { "fontWeight": "regular", "alignment": "center", "hierarchy": "balanced" }.

═══ IMAGE PROMPT RULES (conversion-optimized aesthetics) ═══
COMPOSITION:
- FULL-BLEED only: product fills the frame, no white space, no card panels, no split layouts.
- The product must be the ABSOLUTE HERO — large, sharp, high-frequency detail, photorealistic.
- Camera angle: choose dramatic angles (low angle for power, 3/4 hero for elegance, macro for texture).
- Negative space should feel intentional and premium, never empty.

AESTHETICS THAT CONVERT:
- Lighting: cinematic studio lighting, volumetric light, rim lighting, catch-lights on surfaces — the product must GLOW.
- Surfaces: reflective, wet, dewy, or luxuriously matte — tactile and sensory.
- Environment: aspirational context (marble, brushed metal, silk, botanicals, smoke wisps, water droplets, golden hour glow).
- Color grading: rich, warm, editorial — never flat or clinical.

INFOGRAPHIC OVERLAYS (subtle, premium):
- Thin hairline leader lines, small circular anchor dots, elegant micro-icons.
- Labels: 2–4 words max per callout, clean sans-serif, semi-transparent backgrounds.
- Overlays must ENHANCE the premium feel, not clutter it. Think Aesop, Le Labo, Apple product pages.
- Each of the ${count} prompts must highlight DIFFERENT product facts/benefits as callouts.

BRAND FIT:
- Aesthetic: ${brandDNA.brandAesthetic || 'modern premium'}
- Industry: ${brandDNA.industry || 'general'}
- Product type: ${brandDNA.productType || 'product'}
- Preserve reference product identity — same packaging, shape, label, logo.

JSON SCHEMA:
{
  "creatives": [
    {
      "headline": string (max 5 words, desire-driven),
      "description": string (max 120 chars, one emotional hook),
      "cta": string (2-3 words, action-oriented),
      "layout": "full-bleed",
      "overlayStyle": string (gradient-dark | gradient-light | none),
      "colorMood": string,
      "photographyStyle": string,
      "imageIntent": string (one short sentence),
      "sceneElements": string[] (max 3 short strings),
      "textStyle": { "fontWeight": "regular", "alignment": "center", "hierarchy": "balanced" }
    }
  ],
  "imagePrompts": [
    { "creativeIndex": number, "prompt": string, "aspectRatio": "1:1"|"4:5"|"9:16"|"16:9" }
  ]
}

creativeIndex must be 0..${count - 1}. imagePrompts must align with creatives.`;
}

export function buildProductInfographicUserPrompt(
  extract: ProductPageExtract,
  brandDNA: BrandDNA,
  brandName: string,
  n: number,
  defaultAspect: '1:1' | '4:5' | '9:16' | '16:9',
): string {
  const bullets = extract.bulletPoints.slice(0, 12).join('\n- ');
  const pageImages = extract.imageUrls
    .slice(0, 10)
    .map((u) => `- ${u}`)
    .join('\n');
  return `PRODUCT PAGE DATA (scraped from ${extract.url}):

Brand name: ${brandName}
Product title: ${extract.title}
Short description: ${extract.description}

Key selling points:
- ${bullets || '(none)'}

Product images (reference only):
${pageImages || '- (none parsed)'}

Page text:
${extract.bodySnippet.slice(0, 3500)}

Brand DNA:
- Values: ${(brandDNA.brandValues || []).join(', ')}
- Tone: ${(brandDNA.brandToneOfVoice || []).join(', ')}
- Positioning: ${brandDNA.positioning}

═══ TASK ═══
Generate N=${n} creatives and N image prompts.

HEADLINES: max 5 words, desire-driven, not generic.
DESCRIPTIONS: one sentence, max 120 chars, sensory/emotional.
CTA: 2-3 words with urgency.
LAYOUT: "full-bleed" for all.

IMAGE PROMPTS: Each must be 80–120 words describing:
1. A FULL-BLEED, cinematic hero shot of the product (matching reference identity exactly).
2. Dramatic lighting (rim light, volumetric, catch-lights), premium surfaces (reflective, dewy, marble, silk).
3. Subtle infographic overlays: hairline leader lines, micro-icons, 2-4 word callout labels.
4. Each prompt highlights DIFFERENT product features/benefits as callouts.
5. End with specific lighting direction.

Use aspectRatio "${defaultAspect}" for all unless a variation truly needs a different ratio.

The goal is CONVERSION: every image should make someone stop scrolling and want to buy.`;
}
