// ============================================
// OpenRouter API Client
// Routes image generation through OpenRouter's dedicated Image API.
// Text/JSON generation stays on the Gemini SDK (see ~/lib/gemini).
// See: https://openrouter.ai/docs/api/api-reference/images/create-images
// ============================================

import { env } from '~/env';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_IMAGE_MODEL = 'openai/gpt-image-2';
// Text/JSON generation is routed through OpenRouter using a Gemini model slug,
// so the underlying model stays the same while removing the direct Google dependency.
const DEFAULT_TEXT_MODEL = 'google/gemini-2.5-flash';

function getImageModel(): string {
  return process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
}

function getTextModel(): string {
  return process.env.OPENROUTER_TEXT_MODEL || DEFAULT_TEXT_MODEL;
}

function getOpenRouterKey(): string {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }
  return apiKey;
}

/** Aspect ratios accepted by the OpenRouter Image API (providers clamp to their subset). */
export type ImageAspectRatio =
  | '1:1'
  | '1:4'
  | '1:8'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:1'
  | '4:3'
  | '4:5'
  | '5:4'
  | '8:1'
  | '9:16'
  | '16:9'
  | '21:9';

/** Output resolution tier. */
export type ImageSize = '512' | '1K' | '2K' | '4K';

export const DEFAULT_IMAGE_SIZE: ImageSize =
  (process.env.OPENROUTER_IMAGE_SIZE as ImageSize | undefined) ?? '2K';

const APP_ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9'] as const;
export type AppImageAspectRatio = (typeof APP_ASPECT_RATIOS)[number];

export function toImageAspectRatio(
  aspectRatio?: string,
): ImageAspectRatio | undefined {
  if (!aspectRatio) return undefined;
  if ((APP_ASPECT_RATIOS as readonly string[]).includes(aspectRatio)) {
    return aspectRatio as AppImageAspectRatio;
  }
  return undefined;
}

export interface ImageGenerationOptions {
  aspectRatio?: ImageAspectRatio;
  imageSize?: ImageSize;
  /** Request a higher-fidelity render (maps to `quality: high`). */
  useProModel?: boolean;
}

interface OpenRouterInputReference {
  type: 'image_url';
  image_url: { url: string };
}

interface OpenRouterImageRequest {
  model: string;
  prompt: string;
  aspect_ratio?: string;
  resolution?: string;
  quality?: 'auto' | 'low' | 'medium' | 'high';
  output_format?: 'png' | 'jpeg' | 'webp';
  input_references?: OpenRouterInputReference[];
}

interface OpenRouterImageResponse {
  created: number;
  data?: Array<{ b64_json?: string }>;
}

function buildRequestBody(
  prompt: string,
  options?: ImageGenerationOptions,
  inputReferences?: OpenRouterInputReference[],
): OpenRouterImageRequest {
  const body: OpenRouterImageRequest = {
    model: getImageModel(),
    prompt,
    output_format: 'png',
    resolution: options?.imageSize ?? DEFAULT_IMAGE_SIZE,
  };
  if (options?.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options?.useProModel) body.quality = 'high';
  if (inputReferences && inputReferences.length > 0) {
    body.input_references = inputReferences;
  }
  return body;
}

async function callOpenRouterImage(
  body: OpenRouterImageRequest,
): Promise<string> {
  const apiKey = getOpenRouterKey();

  const res = await fetch(`${OPENROUTER_BASE_URL}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = (await res.json()) as { error?: { message?: string } };
      detail = errJson.error?.message ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(
      `OpenRouter image generation failed (${res.status} ${res.statusText})${detail ? `: ${detail}` : ''}`,
    );
  }

  const json = (await res.json()) as OpenRouterImageResponse;
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('No image generated in OpenRouter response');
  }
  return `data:image/png;base64,${b64}`;
}

function toInputReference(ref: {
  base64: string;
  mimeType: string;
}): OpenRouterInputReference {
  return {
    type: 'image_url',
    image_url: { url: `data:${ref.mimeType};base64,${ref.base64}` },
  };
}

// Generate an image from a text prompt via OpenRouter.
export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions,
): Promise<string> {
  return callOpenRouterImage(buildRequestBody(prompt, options));
}

// Generate an image using reference product images (image-to-image) so the
// model can faithfully reproduce the product while changing composition.
export async function generateImageWithReferences(
  prompt: string,
  referenceImages: { base64: string; mimeType: string }[],
  options?: ImageGenerationOptions,
): Promise<string> {
  const inputReferences = referenceImages.map(toInputReference);
  return callOpenRouterImage(buildRequestBody(prompt, options, inputReferences));
}

// ─── Text / multimodal chat completions ─────────────────────

/** A single content part: text, or an inline image (base64) for vision. */
export type ChatPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface ChatCompletionOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

type OpenRouterChatContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function toChatContent(part: ChatPart): OpenRouterChatContent {
  if ('text' in part) {
    return { type: 'text', text: part.text };
  }
  return {
    type: 'image_url',
    image_url: {
      url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
    },
  };
}

// Call OpenRouter chat completions with an array of content parts (text and/or
// images). Returns the assistant message text. Used by the Gemini-compatible
// shim in ~/lib/gemini so existing callers keep their interface.
export async function callOpenRouterChat(
  parts: ChatPart[],
  options?: ChatCompletionOptions,
): Promise<string> {
  const apiKey = getOpenRouterKey();

  const body: Record<string, unknown> = {
    model: getTextModel(),
    messages: [{ role: 'user', content: parts.map(toChatContent) }],
  };
  if (options?.temperature !== undefined) body.temperature = options.temperature;
  if (options?.maxOutputTokens !== undefined) body.max_tokens = options.maxOutputTokens;

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = (await res.json()) as { error?: { message?: string } };
      detail = errJson.error?.message ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(
      `OpenRouter chat completion failed (${res.status} ${res.statusText})${detail ? `: ${detail}` : ''}`,
    );
  }

  const json = (await res.json()) as OpenRouterChatResponse;
  return json.choices?.[0]?.message?.content ?? '';
}
