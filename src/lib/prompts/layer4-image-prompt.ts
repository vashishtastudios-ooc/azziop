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
const BASE_SYSTEM_PROMPT = `You are the world's top image prompt engineer, specializing in premium brand campaigns across every industry. Your prompts consistently produce images that rival real commercial campaign photography for any product category.

YOUR MISSION: Write a precise, rich, cinematic image generation prompt that produces ultra-premium social media visuals indistinguishable from a real brand campaign — tailored to the specific industry.

CRITICAL RULES:
1. NO text rendering instructions (AI can't render text reliably)
2. NO pixel dimensions or layout math
3. NO generic descriptions — be SPECIFIC, SENSORY, and INDUSTRY-AUTHENTIC
4. Output a SINGLE prompt string (no JSON, no markdown, no explanations)
5. Keep prompts between 120-200 words for optimal detail
6. Always end with industry-appropriate quality boosters
7. Always end with "Avoid:" section

PROMPT ARCHITECTURE (follow this order meticulously):

1. HERO SUBJECT & PLACEMENT (what is the focus, where is it placed)
   - Describe the product/subject in specific material detail
   - Specify the surface/environment appropriate to the industry
   - If people: describe pose, expression, attire in sensory detail

2. INDUSTRY SCENE BUILDING (the world around the subject)
   - Use industry-appropriate props, textures, and materials
   - Build a scene that feels authentic to the product category
   - Include detailed environmental context

3. LIGHTING RIG (the most critical element)
   - Direction: specify exact light direction and type
   - Quality: soft diffused, hard dramatic, warm atmospheric
   - Color temperature: match the industry mood
   - Special effects: rim-light, volumetric rays, reflections

4. PHOTOGRAPHY STYLE & CAMERA (how it's shot)
   - Lens: specific focal length and aperture
   - Camera angle: low, eye-level, overhead — with intention
   - Photography type: industry-specific campaign style
   - Depth of field: shallow bokeh, selective focus, deep environmental

5. COLOR PALETTE & MOOD (emotional resonance)
   - 3-5 SPECIFIC colors (not just "warm" or "dark")
   - Overall mood matching the industry and brand
   - Color harmony: complementary, monochromatic, etc.

6. ATMOSPHERIC EFFECTS (finishing touches)
   - Industry-appropriate atmospheric details
   - Particles, smoke, mist, reflections, motion blur as appropriate

7. QUALITY BOOSTERS (always include 5-7 industry-relevant ones)

8. NEGATIVE ELEMENTS (always include "Avoid:" section)

BRAND REFERENCE IMAGES:
You will receive the brand's own product/logo photos as reference images alongside this prompt.
- PRESERVE the exact product shape, packaging, label design, logo placement, and key visual identity from the reference images.
- DO NOT redesign or reimagine the product itself — keep it faithful to the references.
- CHANGE only the scene: background environment, lighting setup, camera angle, atmospheric effects, and composition to match the campaign brief.
- Treat the reference images as the ground truth for the product — your job is to place that product into a new, campaign-appropriate setting.`;

export function buildLayer4SystemPrompt(brandDNA: BrandDNA): string {
   const archetype = getIndustryArchetype(brandDNA.industry, brandDNA.productType);

   return `${BASE_SYSTEM_PROMPT}

${getSceneVocabularyPrompt(archetype)}

INDUSTRY QUALITY BOOSTERS (${archetype.label}):
${getQualityBoostersPrompt(archetype)}

INDUSTRY NEGATIVE ELEMENTS:
Avoid: ${getNegativeElementsPrompt(archetype)}

EXAMPLE PROMPT (${archetype.label}):
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

   // Position-specific quality descriptors
   const positioningHints: Record<string, string> = {
      budget: 'accessible, friendly, relatable, everyday, clean simple styling',
      mid: 'polished, professional, aspirational, quality, editorial photography',
      premium: 'ultra-luxurious, exclusive, powerful, cinematic editorial, designer campaign-level, opulent textures',
   };

   // Emotional lever to mood mapping
   const emotionToMood: Record<string, string> = {
      aspiration: 'aspirational, empowering, forward-looking, luminous golden light, soaring angles',
      fear: 'dramatic, urgent, high-contrast chiaroscuro, deep shadows, intense close-ups',
      belonging: 'warm, inclusive, ambient candlelight glow, intimate mood, rich earth tones',
      curiosity: 'intriguing, mysterious, atmospheric haze, unexpected angles, dramatic silhouettes',
      pride: 'bold, confident, celebratory, rich saturated colors, powerful low-angle shots',
      relief: 'calm, peaceful, soft diffused light, muted sage and cream, gentle elements',
      urgency: 'dynamic, energetic, bold contrasts, dramatic lighting, high-saturation tones',
      trust: 'clean, professional, natural warm lighting, honest textures, premium but approachable',
   };

   const qualityLevel = positioningHints[positioning] || positioningHints.mid;
   const moodGuidance = emotionToMood[emotionalLever] || emotionToMood.trust;
   const frameGuide = aspectRatioGuidance[aspectRatio] ?? aspectRatioGuidance['1:1'];

   // Build scene elements section if available
   const sceneElementsSection = sceneElements.length > 0
      ? `\nSCENE ELEMENTS TO INCLUDE:\n${sceneElements.map(el => `- ${el}`).join('\n')}\n`
      : '';

   return `CREATE AN ULTRA-PREMIUM IMAGE PROMPT FOR CREATIVE #${creativeIndex + 1}
INDUSTRY: ${archetype.label}

CREATIVE BRIEF:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Headline: "${headline}"
Image Intent: ${imageIntent}
Photography Style: ${photographyStyle}
Color Mood: ${colorMood}
Layout: ${layout}
${sceneElementsSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND CONTEXT:
- Industry: ${archetype.label}
- Product Type: ${brandDNA.productType || 'General'}
- Aesthetic: ${brandAesthetic}
- Values: ${brandValues}
- Quality Level: ${qualityLevel}

EMOTIONAL CONTEXT:
- Campaign Goal: ${campaignGoal}
- Emotional Lever: ${emotionalLever}
- Mood Guidance: ${moodGuidance}
${visualDirection ? `- Visual Direction: ${visualDirection}` : ''}

OUTPUT ASPECT RATIO (mandatory):
- Target proportion: ${aspectRatio}
- ${frameGuide}
- Frame every shot choice (camera distance, subject scale, negative space) for this exact aspect ratio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 ${archetype.label.toUpperCase()} COMPOSITION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${archetype.premiumMandates.map((m, i) => `${i + 1}. ${m}`).join('\n')}

REFERENCE IMAGE USAGE:
- You will be given the brand's actual product/logo photos as input.
- Keep the product appearance, packaging, and logo EXACTLY as shown in the reference images.
- Design the surrounding scene (background, props, lighting, atmosphere) to match this campaign's mood and goal.
- Think of it as an editorial reshoot: same product, new premium environment.

REQUIREMENTS:
1. Write a SINGLE image prompt (120-200 words)
2. Follow the full prompt architecture: Subject → Scene Building → Lighting → Camera → Colors → Atmospherics → Quality Boosters → Avoid
3. Use industry-appropriate scene vocabulary, materials, and props
4. Include at least 5 premium quality boosters at the end
5. Match the emotional lever (${emotionalLever}) and brand positioning (${positioning})
6. End with "Avoid:" followed by elements that would cheapen the result
7. The result should look like it belongs in a premium ${archetype.label} campaign
8. Instruct the image model to faithfully reproduce the product from the provided reference photos
9. Explicitly state in the prompt that the image must be composed for ${aspectRatio} output (no conflicting aspect ratios)

Output ONLY the prompt text. No explanations, no markdown, no JSON.`;
};
