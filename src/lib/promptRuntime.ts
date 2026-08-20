import "server-only";

import { db } from "~/server/db";
import { LAYER1_SYSTEM_PROMPT } from "~/lib/prompts/layer1-brand-dna";
import { LAYER2_SYSTEM_PROMPT } from "~/lib/prompts/layer2-campaign-strategy";
import { LAYER3_SYSTEM_PROMPT } from "~/lib/prompts/layer3-creative-architect";
import { LAYER4_SYSTEM_PROMPT } from "~/lib/prompts/layer4-image-prompt";

export const PROMPT_LAYERS = ["layer1", "layer2", "layer3", "layer4"] as const;
export type PromptLayer = (typeof PROMPT_LAYERS)[number];

const CACHE_TTL_MS = 10_000;
const cache = new Map<PromptLayer, { body: string; loadedAt: number }>();

export function defaultPromptBody(layer: PromptLayer): string {
  switch (layer) {
    case "layer1":
      return LAYER1_SYSTEM_PROMPT;
    case "layer2":
      return LAYER2_SYSTEM_PROMPT;
    case "layer3":
      return LAYER3_SYSTEM_PROMPT;
    case "layer4":
      return LAYER4_SYSTEM_PROMPT;
  }
}

export function invalidatePromptCache(layer?: PromptLayer) {
  if (layer) cache.delete(layer);
  else cache.clear();
}

export async function getActivePromptBody(layer: PromptLayer): Promise<string> {
  const hit = cache.get(layer);
  if (hit && Date.now() - hit.loadedAt < CACHE_TTL_MS) return hit.body;

  const active = await db.promptVersion.findFirst({
    where: { layer, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { body: true },
  });
  const body = active?.body?.trim() || defaultPromptBody(layer);
  cache.set(layer, { body, loadedAt: Date.now() });
  return body;
}

export async function listPromptVersions(layer: PromptLayer, take = 20) {
  return db.promptVersion.findMany({
    where: { layer },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      note: true,
      isActive: true,
      createdBy: true,
      createdAt: true,
      body: true,
    },
  });
}

export async function savePromptVersion(input: {
  layer: PromptLayer;
  body: string;
  note?: string;
  createdBy?: string;
}) {
  const body = input.body.trim();
  if (body.length < 40) {
    throw new Error("Prompt body is too short.");
  }

  const created = await db.promptVersion.create({
    data: {
      layer: input.layer,
      body,
      note: input.note?.trim() || null,
      createdBy: input.createdBy || null,
      isActive: true,
    },
  });

  await db.promptVersion.updateMany({
    where: { layer: input.layer, id: { not: created.id }, isActive: true },
    data: { isActive: false },
  });

  invalidatePromptCache(input.layer);
  return created;
}

export async function activatePromptVersion(id: string) {
  const row = await db.promptVersion.findUnique({ where: { id } });
  if (!row) throw new Error("Prompt version not found");

  await db.promptVersion.updateMany({
    where: { layer: row.layer, isActive: true },
    data: { isActive: false },
  });
  await db.promptVersion.update({
    where: { id },
    data: { isActive: true },
  });
  invalidatePromptCache(row.layer as PromptLayer);
  return row;
}

export async function restoreCodeDefault(layer: PromptLayer, createdBy?: string) {
  await db.promptVersion.updateMany({
    where: { layer, isActive: true },
    data: { isActive: false },
  });
  invalidatePromptCache(layer);
  return {
    layer,
    body: defaultPromptBody(layer),
    restoredBy: createdBy ?? null,
  };
}
