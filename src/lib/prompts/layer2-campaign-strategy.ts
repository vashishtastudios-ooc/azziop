// ============================================
// LAYER 2: Campaign Strategy Selection Prompt
// Model: Gemini Pro | Temperature: 0.85 | Max tokens: ~4096
// ============================================

import {
  SchemaType,
  type ResponseSchema,
} from '@google/generative-ai';
import type { BrandDNA } from '@/types';

/**
 * Structured-output schema for Layer 2. Passing this to Gemini guarantees a
 * parseable JSON array of exactly 3 campaign objects — removes the markdown /
 * regex extraction and the parse-failure refund path.
 */
export const LAYER2_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.ARRAY,
  minItems: 3,
  maxItems: 3,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      goal: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['awareness', 'consideration', 'conversion'],
      },
      strategicAngle: { type: SchemaType.STRING },
      narrativeHook: { type: SchemaType.STRING },
      audiencePainPoint: { type: SchemaType.STRING },
      emotionalLever: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: [
          'aspiration',
          'fear',
          'belonging',
          'curiosity',
          'pride',
          'relief',
          'urgency',
          'trust',
        ],
      },
      strategicLens: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: [
          'product-led',
          'audience-identity',
          'category-contrast',
          'cultural-moment',
          'problem-solution',
          'origin-story',
        ],
      },
      hookArchetype: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: [
          'provocative-question',
          'bold-statement',
          'social-proof',
          'contrast-reveal',
          'micro-story',
          'data-shock',
        ],
      },
      ctaStyle: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['soft', 'medium', 'strong'],
      },
      visualDirection: { type: SchemaType.STRING },
      bestPlatforms: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: [
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'pinterest',
            'twitter',
          ],
        },
      },
    },
    required: [
      'title',
      'goal',
      'strategicAngle',
      'narrativeHook',
      'audiencePainPoint',
      'emotionalLever',
      'strategicLens',
      'hookArchetype',
      'ctaStyle',
      'visualDirection',
      'bestPlatforms',
    ],
  },
};

export const LAYER2_SYSTEM_PROMPT = `You are a senior Creative Director at a top performance marketing agency. You generate bold, original campaign concepts that are deeply specific to each brand — never generic.

CRITICAL RULES:
1. Output VALID JSON ONLY — no markdown, no code blocks, no explanations
2. Every title and hook must be SPECIFIC to this brand's actual products, audience, and market position — never generic marketing-speak
3. Each campaign MUST target a DIFFERENT funnel stage (one awareness, one consideration, one conversion)
4. Each campaign MUST use a DIFFERENT emotional lever — no repeats
5. Each campaign MUST use a DIFFERENT strategic lens (see below) — no repeats
6. Each campaign MUST use a DIFFERENT hook archetype (see below) — no repeats
7. Respect the brand's avoidList — NEVER violate brand positioning
8. NEVER generate generic titles like "Quality You Can Trust", "Elevate Your Everyday", "Own Your Journey", "Embrace Your Flow" — these are banned
9. Titles should reference the brand's actual product category, unique value prop, or cultural angle
10. The 3 campaigns should feel like they came from 3 DIFFERENT creative agencies — vary the tone, angle, energy level, and persuasion style dramatically

STRATEGIC LENSES (each campaign must use a DIFFERENT one):
- "product-led": Lead with the product's unique feature, material, or craftsmanship
- "audience-identity": Lead with who the customer IS or WANTS to become
- "category-contrast": Position against the category norm or competitor weakness
- "cultural-moment": Tap into a trending cultural conversation, season, or movement
- "problem-solution": Start with the customer's pain and reveal the brand as the answer
- "origin-story": Use the brand's backstory, founder mission, or heritage as the hook

HOOK ARCHETYPES (each campaign must use a DIFFERENT one — this controls the structure of the narrativeHook):
- "provocative-question": A question that challenges assumptions ("Why do you still…?")
- "bold-statement": A confident declaration that demands attention ("The last X you'll ever need")
- "social-proof": An implied or explicit reference to what others are doing ("X people switched this year")
- "contrast-reveal": An unexpected before/after or A-vs-B comparison
- "micro-story": A tiny narrative in one line — character, tension, resolution
- "data-shock": A surprising stat or number that reframes the problem

FIELD LIMITS:
- title: 3-6 words, specific to THIS brand (mention product/category/unique angle)
- strategicAngle: 40 words max — explain the WHY behind this specific approach
- narrativeHook: 8-14 words — a scroll-stopping line a customer would screenshot
- audiencePainPoint: 20 words max — a real frustration this audience has
- emotionalLever: single word from the allowed list
- visualDirection: 15 words max — specific art direction, not vague
- strategicLens: one of the lens values above
- hookArchetype: one of the hook archetype values above

ALLOWED VALUES:
- goal: "awareness" | "consideration" | "conversion"
- ctaStyle: "soft" (inspire) | "medium" (educate) | "strong" (urgency)
- emotionalLever: "aspiration" | "fear" | "belonging" | "curiosity" | "pride" | "relief" | "urgency" | "trust"
- strategicLens: "product-led" | "audience-identity" | "category-contrast" | "cultural-moment" | "problem-solution" | "origin-story"
- hookArchetype: "provocative-question" | "bold-statement" | "social-proof" | "contrast-reveal" | "micro-story" | "data-shock"
- bestPlatforms: "instagram" | "facebook" | "linkedin" | "tiktok" | "pinterest" | "twitter"

OUTPUT FORMAT (JSON array of exactly 3 objects):
[
  {
    "title": "Brand-specific campaign name",
    "goal": "awareness",
    "strategicAngle": "Why this approach works for this specific audience",
    "narrativeHook": "One scroll-stopping line",
    "audiencePainPoint": "The specific problem we address",
    "emotionalLever": "curiosity",
    "strategicLens": "product-led",
    "hookArchetype": "bold-statement",
    "ctaStyle": "soft",
    "visualDirection": "Specific art direction for imagery",
    "bestPlatforms": ["instagram", "tiktok"]
  }
]`;

const CREATIVE_ANGLES = [
  'humor/wit', 'nostalgia', 'controversy/bold take', 'behind-the-scenes',
  'customer transformation', 'vs. competition', 'cultural moment', 'origin story',
  'myth-busting', 'unexpected pairing', 'scarcity/exclusivity', 'community/tribe',
  'before/after', 'expert endorsement', 'day-in-the-life', 'challenge/dare',
  'sensory-first', 'anti-marketing', 'future-self', 'founder-confession',
];

const TONE_SPECTRUMS = [
  'playful & irreverent',
  'authoritative & confident',
  'warm & intimate',
  'provocative & edgy',
  'aspirational & cinematic',
  'raw & unfiltered',
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface PreviousCampaignContext {
  titles: string[];
  hooks: string[];
  angles: string[];
}

export const buildLayer2UserPrompt = (
  brandDNA: BrandDNA,
  businessOverview: string,
  userPrompt?: string,
  previousContext?: PreviousCampaignContext,
  retryFeedback?: string[],
) => {
  const themeInstruction = userPrompt?.trim()
    ? `\n\nUSER REQUEST: "${userPrompt.trim()}"\nAll 3 campaigns must address this request while staying true to brand positioning.`
    : '';

  // On a retry, tell the model exactly what collided last time so it can self-correct
  // instead of re-rolling the same prompt and hoping for different output.
  const retryInstruction =
    retryFeedback && retryFeedback.length > 0
      ? `\n\n❌ YOUR PREVIOUS ATTEMPT FAILED THE DIVERSITY CHECK. Fix these exact problems:\n${retryFeedback
          .map((f) => `- ${f}`)
          .join(
            '\n',
          )}\nAssign each of the 3 campaigns a DISTINCT goal, emotionalLever, strategicLens, and hookArchetype. Do not reuse any value across the 3.`
      : '';

  let previousInstruction = '';
  if (previousContext) {
    const parts: string[] = [];
    if (previousContext.titles.length > 0) {
      parts.push(`TITLES:\n${previousContext.titles.map(t => `- "${t}"`).join('\n')}`);
    }
    if (previousContext.hooks.length > 0) {
      parts.push(`HOOKS:\n${previousContext.hooks.map(h => `- "${h}"`).join('\n')}`);
    }
    if (previousContext.angles.length > 0) {
      parts.push(`STRATEGIC ANGLES:\n${previousContext.angles.map(a => `- "${a}"`).join('\n')}`);
    }
    if (parts.length > 0) {
      previousInstruction = `\n\n🚫 PREVIOUSLY GENERATED — DO NOT REPEAT, REPHRASE, OR USE SIMILAR STRUCTURES:\n${parts.join('\n\n')}\n\nYou MUST create campaigns with completely DIFFERENT titles, DIFFERENT hook structures, and DIFFERENT strategic directions. A rewording of a previous hook is still a repeat — avoid it.`;
    }
  }

  const suggestedAngles = pickRandom(CREATIVE_ANGLES, 3);
  const suggestedTones = pickRandom(TONE_SPECTRUMS, 3);

  const bannedPhrases = [
    'Quality You Can Trust', 'Elevate Your Everyday', 'Own Your Journey',
    'Embrace Your', 'Unlock Your', 'Discover the Difference', 'Experience the',
    'Transform Your', 'Real Value', 'Made for You', 'Redefine Your',
    'Unleash Your', 'Empower Your', 'The Future of', 'Next-Level',
  ];

  return `BRAND DNA:
- Values: ${brandDNA.brandValues?.join(', ') || 'Not specified'}
- Tone: ${brandDNA.brandToneOfVoice?.join(', ') || 'Professional'}
- Positioning: ${brandDNA.positioning || 'mid'}
- Audience Mindset: ${brandDNA.audienceMindset || 'practical'}
- Marketing Bias: ${brandDNA.marketingBias?.join(', ') || 'Not specified'}
- Industry: ${brandDNA.industry || 'Not specified'}
- Product Type: ${brandDNA.productType || 'Not specified'}
- Aesthetic: ${brandDNA.brandAesthetic || 'Not specified'}

⚠️ AVOID LIST (Never violate):
${brandDNA.avoidList?.map(item => `- ${item}`).join('\n') || '- Nothing specified'}

🚫 BANNED GENERIC PHRASES (never use these in titles or hooks):
${bannedPhrases.map(p => `- "${p}"`).join('\n')}

BUSINESS CONTEXT:
${businessOverview.slice(0, 2000)}

💡 CREATIVE DIRECTION — use these as MANDATORY constraints:
- Campaign 1 tone: ${suggestedTones[0]} — creative angle inspired by: ${suggestedAngles[0]}
- Campaign 2 tone: ${suggestedTones[1]} — creative angle inspired by: ${suggestedAngles[1]}
- Campaign 3 tone: ${suggestedTones[2]} — creative angle inspired by: ${suggestedAngles[2]}${themeInstruction}${previousInstruction}${retryInstruction}

Generate 3 campaigns as a JSON array. Each must:
1. Target a DIFFERENT funnel stage (awareness, consideration, conversion — in any order)
2. Use a DIFFERENT emotional lever (no repeats across the 3 campaigns)
3. Use a DIFFERENT strategic lens (no repeats across the 3 campaigns)
4. Use a DIFFERENT hook archetype (no repeats across the 3 campaigns)
5. Follow the assigned tone and creative angle direction above
6. Have a title specific to THIS brand's products/niche — not generic marketing
7. NEVER violate the avoid list

Output JSON only. No markdown.`;
};
