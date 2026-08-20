import "server-only";

import { db } from "~/server/db";

const SETTINGS_KEY = "flags";
const CACHE_TTL_MS = 10_000;

export type FeatureFlags = {
  generateImages: boolean;
  cloneCreative: boolean;
  productInfographic: boolean;
  scheduling: boolean;
};

const DEFAULTS: FeatureFlags = {
  generateImages: true,
  cloneCreative: true,
  productInfographic: true,
  scheduling: true,
};

function parseStored(raw: string | null | undefined): Partial<FeatureFlags> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

let cache: { value: FeatureFlags; loadedAt: number } | null = null;

function merge(stored: Partial<FeatureFlags>): FeatureFlags {
  return {
    generateImages: stored.generateImages ?? DEFAULTS.generateImages,
    cloneCreative: stored.cloneCreative ?? DEFAULTS.cloneCreative,
    productInfographic: stored.productInfographic ?? DEFAULTS.productInfographic,
    scheduling: stored.scheduling ?? DEFAULTS.scheduling,
  };
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.value;
  const row = await db.appSetting.findUnique({
    where: { key: SETTINGS_KEY },
    select: { value: true },
  });
  const value = merge(parseStored(row?.value));
  cache = { value, loadedAt: Date.now() };
  return value;
}

export async function saveFeatureFlags(
  patch: Partial<FeatureFlags>,
): Promise<FeatureFlags> {
  const current = await getFeatureFlags();
  const next = merge({ ...current, ...patch });
  await db.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { value: next, loadedAt: Date.now() };
  return next;
}

export async function isFeatureEnabled(
  flag: keyof FeatureFlags,
): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[flag];
}
