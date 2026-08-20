import "server-only";

import { db } from "~/server/db";

const SETTINGS_KEY = "ai";
const CACHE_TTL_MS = 10_000;

export type ImageSize = "512" | "1K" | "2K" | "4K";

export const TEXT_MODEL_OPTIONS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.0-flash",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1",
  "anthropic/claude-sonnet-4",
] as const;

export const IMAGE_MODEL_OPTIONS = [
  "openai/gpt-image-2",
  "openai/gpt-image-1",
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux-1.1-pro",
] as const;

export const IMAGE_SIZE_OPTIONS = ["512", "1K", "2K", "4K"] as const;

export type AiRuntimeSettings = {
  textModel: string;
  imageModel: string;
  imageSize: ImageSize;
  generationPaused: boolean;
};

function envDefaults(): AiRuntimeSettings {
  const size = process.env.OPENROUTER_IMAGE_SIZE;
  const imageSize = (IMAGE_SIZE_OPTIONS as readonly string[]).includes(size ?? "")
    ? (size as ImageSize)
    : "2K";

  return {
    textModel: process.env.OPENROUTER_TEXT_MODEL || "google/gemini-2.5-flash",
    imageModel: process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-image-2",
    imageSize,
    generationPaused: false,
  };
}

function parseStored(raw: string | null | undefined): Partial<AiRuntimeSettings> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<AiRuntimeSettings>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

let cache: { value: AiRuntimeSettings; loadedAt: number } | null = null;

export function invalidateAiRuntimeSettingsCache() {
  cache = null;
}

function merge(stored: Partial<AiRuntimeSettings>): AiRuntimeSettings {
  const defaults = envDefaults();
  const imageSize =
    stored.imageSize && (IMAGE_SIZE_OPTIONS as readonly string[]).includes(stored.imageSize)
      ? stored.imageSize
      : defaults.imageSize;

  return {
    textModel: stored.textModel?.trim() || defaults.textModel,
    imageModel: stored.imageModel?.trim() || defaults.imageModel,
    imageSize,
    generationPaused: Boolean(stored.generationPaused),
  };
}

export async function getAiRuntimeSettings(): Promise<AiRuntimeSettings> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.value;
  }

  const row = await db.appSetting.findUnique({
    where: { key: SETTINGS_KEY },
    select: { value: true },
  });
  const value = merge(parseStored(row?.value));
  cache = { value, loadedAt: Date.now() };
  return value;
}

export async function saveAiRuntimeSettings(
  patch: Partial<AiRuntimeSettings>,
): Promise<AiRuntimeSettings> {
  const current = await getAiRuntimeSettings();
  const next = merge({ ...current, ...patch });

  await db.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });

  cache = { value: next, loadedAt: Date.now() };
  return next;
}
