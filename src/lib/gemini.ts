// ============================================
// Gemini-compatible text generation
// Routes Gemini model calls through OpenRouter (~/lib/openrouter) so the
// underlying model stays Gemini while removing the direct Google API key.
// The returned shim preserves the `model.generateContent(parts)` /
// `response.response.text()` interface used across the app.
// ============================================

import { callOpenRouterChat, type ChatPart } from '~/lib/openrouter';

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
};

/**
 * Optional overrides kept for backwards compatibility with callers that passed
 * a Gemini response schema. Structured output is no longer enforced at the API
 * level (callers extract/parse JSON from the text), so these are accepted but
 * not forwarded.
 */
export interface GetModelOptions {
  responseSchema?: unknown;
  responseMimeType?: 'application/json' | 'text/plain';
}

/** Minimal Gemini-compatible model surface backed by OpenRouter. */
export interface GeminiCompatibleModel {
  generateContent: (
    parts: ChatPart[],
  ) => Promise<{ response: { text: () => string } }>;
}

// Get a configured model for a specific layer.
export const getModel = (
  layer: keyof typeof MODEL_CONFIGS,
  _options?: GetModelOptions,
): GeminiCompatibleModel => {
  const config = MODEL_CONFIGS[layer];
  const hasTuning = 'temperature' in config;

  return {
    generateContent: async (parts: ChatPart[]) => {
      const text = await callOpenRouterChat(parts, {
        temperature: hasTuning ? config.temperature : undefined,
        maxOutputTokens: hasTuning ? config.maxOutputTokens : undefined,
      });
      return { response: { text: () => text } };
    },
  };
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
