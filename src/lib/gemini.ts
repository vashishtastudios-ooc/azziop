// ============================================
// Gemini API Client
// Handles all interactions with Google's Gemini models
// ============================================

import {
  GoogleGenerativeAI,
  GenerativeModel,
  type ResponseSchema,
} from '@google/generative-ai';
import { env } from '~/env';

// Initialize the Gemini client
const getGeminiClient = () => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Model configurations for each layer
// See: https://ai.google.dev/gemini-api/docs/models
export const MODEL_CONFIGS = {
  layer1: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.2,
    maxOutputTokens: 4096,
  },
  layer2: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.85,
    maxOutputTokens: 4096,
  },
  layer3: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.6,
    maxOutputTokens: 8192,
  },
  layer4: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.4,
    maxOutputTokens: 2048,
  },
  /** One-shot large JSON: N creatives + N image prompts (needs high output budget). */
  productInfographic: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.35,
    maxOutputTokens: 8192,
  },
  vision: {
    model: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-flash',
    temperature: 0.1,
    maxOutputTokens: 8192,
  },
  image: {
    // gemini-3-pro-image-preview is the only model with image generation support
    model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
  },
};

/** Optional overrides for structured output (Gemini JSON mode). */
export interface GetModelOptions {
  /** When set, Gemini returns schema-validated JSON — no markdown/regex parsing needed. */
  responseSchema?: ResponseSchema;
  responseMimeType?: 'application/json' | 'text/plain';
}

// Get a configured model for a specific layer
export const getModel = (
  layer: keyof typeof MODEL_CONFIGS,
  options?: GetModelOptions,
): GenerativeModel => {
  const client = getGeminiClient();
  const config = MODEL_CONFIGS[layer];

  const hasTuning = 'temperature' in config;
  const generationConfig =
    hasTuning || options?.responseSchema || options?.responseMimeType
      ? {
          ...(hasTuning
            ? {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
              }
            : {}),
          ...(options?.responseMimeType
            ? { responseMimeType: options.responseMimeType }
            : options?.responseSchema
              ? { responseMimeType: 'application/json' as const }
              : {}),
          ...(options?.responseSchema
            ? { responseSchema: options.responseSchema }
            : {}),
        }
      : undefined;

  return client.getGenerativeModel({
    model: config.model,
    generationConfig,
  });
};

// Generic function to call Gemini with a prompt
export async function callGemini(
  layer: keyof typeof MODEL_CONFIGS,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = getModel(layer);

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt },
  ]);

  const response = result.response;
  const text = response.text();

  return text;
}

// Call Gemini with image(s) + text prompt (for vision-based analysis)
export async function callGeminiWithImage(
  images: { base64: string; mimeType: string }[],
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = getModel('vision');

  // Build parts: system prompt → images → user prompt
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: systemPrompt },
    ...images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    })),
    { text: userPrompt },
  ];

  const result = await model.generateContent(parts);

  const response = result.response;
  return response.text();
}

// Attempt to repair truncated JSON
function repairTruncatedJSON(json: string): string {
  let repaired = json.trim();

  // Count brackets
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // If truncated in a string, close the string
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // We're inside an unclosed string — truncate back to the last complete key-value pair
    // Find the last complete value (ends with ", or a number, or true/false/null, or ] or })
    const lastCompleteEntry = repaired.lastIndexOf(',\n');
    const lastCompleteEntry2 = repaired.lastIndexOf(',\r\n');
    const lastComplete = Math.max(lastCompleteEntry, lastCompleteEntry2);
    if (lastComplete > repaired.length * 0.5) {
      // Truncate to the last complete entry
      repaired = repaired.substring(0, lastComplete);
    } else {
      // Fallback: just close the dangling string
      repaired += '"';
    }
  }

  // Remove any trailing commas before we close brackets
  repaired = repaired.replace(/,\s*$/, '');

  // Close any unclosed brackets/braces
  const remainingOpenBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
  const remainingOpenBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;

  // Add closing brackets first, then braces
  for (let i = 0; i < remainingOpenBrackets; i++) {
    repaired = repaired.replace(/,\s*$/, '');
    repaired += ']';
  }

  for (let i = 0; i < remainingOpenBraces; i++) {
    repaired = repaired.replace(/,\s*$/, '');
    repaired += '}';
  }

  return repaired;
}

// Parse JSON from Gemini response (handles markdown code blocks and truncated JSON)
export function parseGeminiJSON<T>(response: string): T {
  let cleaned = response.trim();

  // Handle ```json ... ``` or ``` ... ``` blocks
  // Use greedy match to get everything between first ``` and last ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // Also try to find JSON without closing ```
    const partialCodeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*)/);
    if (partialCodeBlock) {
      cleaned = partialCodeBlock[1].trim();
    }
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    // Try to repair truncated JSON
    try {
      const repaired = repairTruncatedJSON(cleaned);
      return JSON.parse(repaired) as T;
    } catch {
      // Continue to other methods
    }

    // Try to extract JSON object
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Try to repair
        try {
          const repaired = repairTruncatedJSON(objectMatch[0]);
          return JSON.parse(repaired) as T;
        } catch {
          // Continue
        }
      }
    }

    // Try to extract JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch {
        // Try to repair truncated array
        try {
          const repaired = repairTruncatedJSON(arrayMatch[0]);
          return JSON.parse(repaired) as T;
        } catch {
          // Continue to error
        }
      }
    }

    // All repair attempts failed
    throw new Error(`Failed to parse JSON from response: ${cleaned.slice(0, 200)}...`);
  }
}

// Generate image using Gemini's image generation model
export async function generateImage(prompt: string): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: MODEL_CONFIGS.image.model,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // @ts-expect-error - Image generation specific config
      responseModalities: ['image', 'text'],
    },
  });

  const response = result.response;

  // Extract image from response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inlineData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (inlineData.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${inlineData.inlineData.mimeType};base64,${inlineData.inlineData.data}`;
      }
    }
  }

  throw new Error('No image generated in response');
}

// Generate image with reference product images as multi-modal input.
// The AI sees the actual product photos and can faithfully reproduce
// shape, logo, label, and packaging while changing only background/composition.
export async function generateImageWithReferences(
  prompt: string,
  referenceImages: { base64: string; mimeType: string }[]
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: MODEL_CONFIGS.image.model,
  });

  // Build parts: text prompt first, then product reference images
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: prompt },
    ...referenceImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    })),
  ];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      // @ts-expect-error - Image generation specific config
      responseModalities: ['image', 'text'],
    },
  });

  const response = result.response;

  // Extract image from response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inlineData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (inlineData.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${inlineData.inlineData.mimeType};base64,${inlineData.inlineData.data}`;
      }
    }
  }

  throw new Error('No image generated in response');
}
