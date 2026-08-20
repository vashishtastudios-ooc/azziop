import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getModel } from "~/lib/gemini";
import {
  LAYER2_RESPONSE_SCHEMA,
  buildLayer2UserPrompt,
  type PreviousCampaignContext,
} from "~/lib/prompts/layer2-campaign-strategy";
import { getActivePromptBody } from "~/lib/promptRuntime";
import type { BrandDNA, CampaignStrategy, WebsiteData } from "~/types";

const generatedCampaignSchema = z.object({
  title: z.string().default("Untitled Campaign"),
  goal: z.enum(["awareness", "consideration", "conversion"]).default("awareness"),
  strategicAngle: z.string().default(""),
  narrativeHook: z.string().default(""),
  audiencePainPoint: z.string().default(""),
  emotionalLever: z
    .enum([
      "aspiration",
      "fear",
      "belonging",
      "curiosity",
      "pride",
      "relief",
      "urgency",
      "trust",
    ])
    .default("trust"),
  ctaStyle: z.enum(["soft", "medium", "strong"]).default("medium"),
  visualDirection: z.string().default(""),
  bestPlatforms: z.array(z.string()).default([]),
  strategicLens: z
    .enum([
      "product-led",
      "audience-identity",
      "category-contrast",
      "cultural-moment",
      "problem-solution",
      "origin-story",
    ])
    .optional(),
  hookArchetype: z
    .enum([
      "provocative-question",
      "bold-statement",
      "social-proof",
      "contrast-reveal",
      "micro-story",
      "data-shock",
    ])
    .optional(),
});

export const generatedCampaignSetSchema = z.array(generatedCampaignSchema).length(3);
export type GeneratedCampaign = z.infer<typeof generatedCampaignSchema>;

function checkDiversity(campaigns: GeneratedCampaign[]): string[] {
  const issues: string[] = [];

  const goals = campaigns.map((c) => c.goal);
  if (new Set(goals).size < goals.length) {
    issues.push(
      `Duplicate goals (${goals.join(", ")}) — assign one awareness, one consideration, one conversion`,
    );
  }

  const levers = campaigns.map((c) => c.emotionalLever);
  if (new Set(levers).size < levers.length) {
    issues.push(
      `Duplicate emotional levers (${levers.join(", ")}) — give each campaign a different lever`,
    );
  }

  const lenses = campaigns.map((c) => c.strategicLens).filter((v): v is string => Boolean(v));
  if (lenses.length === campaigns.length && new Set(lenses).size < lenses.length) {
    issues.push(
      `Duplicate strategic lenses (${lenses.join(", ")}) — each campaign must use a different lens`,
    );
  }

  const archetypes = campaigns
    .map((c) => c.hookArchetype)
    .filter((v): v is string => Boolean(v));
  if (
    archetypes.length === campaigns.length &&
    new Set(archetypes).size < archetypes.length
  ) {
    issues.push(
      `Duplicate hook archetypes (${archetypes.join(", ")}) — each campaign must use a different archetype`,
    );
  }

  const hooks = campaigns.map((c) =>
    c.narrativeHook
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  for (let i = 0; i < hooks.length; i++) {
    for (let j = i + 1; j < hooks.length; j++) {
      const overlap = hooks[i]!.filter((w) => hooks[j]!.includes(w));
      const shorter = Math.min(hooks[i]!.length, hooks[j]!.length);
      if (shorter > 0 && overlap.length / shorter > 0.5) {
        issues.push(
          `Hooks ${i + 1} and ${j + 1} share >50% key words: "${campaigns[i]!.narrativeHook}" vs "${campaigns[j]!.narrativeHook}"`,
        );
      }
    }
  }

  const angles = campaigns.map((c) =>
    c.strategicAngle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  for (let i = 0; i < angles.length; i++) {
    for (let j = i + 1; j < angles.length; j++) {
      const overlap = angles[i]!.filter((w) => angles[j]!.includes(w));
      const shorter = Math.min(angles[i]!.length, angles[j]!.length);
      if (shorter > 0 && overlap.length / shorter > 0.4) {
        issues.push(`Strategic angles ${i + 1} and ${j + 1} overlap >40% key words`);
      }
    }
  }

  return issues;
}

export function buildBusinessOverview(websiteData: WebsiteData | null): string {
  if (!websiteData) return "";
  return [
    websiteData.brandName ? `Brand: ${websiteData.brandName}` : "",
    websiteData.tagline ? `Tagline: ${websiteData.tagline}` : "",
    websiteData.description ? `About: ${websiteData.description}` : "",
    websiteData.heroText ? `Hero: ${websiteData.heroText}` : "",
    websiteData.aboutSection ? `Details: ${websiteData.aboutSection}` : "",
    websiteData.textContent?.slice(0, 800) || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateLayer2Campaigns(params: {
  brandDNA: BrandDNA;
  businessOverview: string;
  userPrompt?: string;
  previousContext?: PreviousCampaignContext;
  maxAttempts?: number;
}): Promise<{ campaigns: GeneratedCampaign[]; diversityIssues: string[] }> {
  const { brandDNA, businessOverview, userPrompt, previousContext } = params;
  const maxAttempts = Math.max(1, params.maxAttempts ?? 2);
  const model = getModel("layer2", { responseSchema: LAYER2_RESPONSE_SCHEMA });
  let lastDiversityIssues: string[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const userPromptText = buildLayer2UserPrompt(
      brandDNA,
      businessOverview,
      userPrompt,
      previousContext,
      attempt > 0 ? lastDiversityIssues : undefined,
    );

    const response = await model.generateContent([
      { text: await getActivePromptBody("layer2") },
      { text: userPromptText },
    ]);

    const llmText = response.response.text();
    const jsonText = llmText.trim().startsWith("[")
      ? llmText
      : (llmText.match(/\[[\s\S]*\]/)?.[0] ?? "");

    if (!jsonText) {
      if (attempt < maxAttempts - 1) continue;
      throw new Error("Campaign generation returned invalid JSON");
    }

    let parsedCampaigns: GeneratedCampaign[];
    try {
      parsedCampaigns = generatedCampaignSetSchema.parse(JSON.parse(jsonText));
    } catch {
      if (attempt < maxAttempts - 1) continue;
      throw new Error("Unable to parse generated campaigns");
    }

    const diversityIssues = checkDiversity(parsedCampaigns);
    lastDiversityIssues = diversityIssues;

    if (diversityIssues.length > 0 && attempt < maxAttempts - 1) {
      continue;
    }

    return { campaigns: parsedCampaigns, diversityIssues };
  }

  throw new Error("Campaign generation failed after retries");
}

type DbClient = Pick<PrismaClient, "campaign">;

export async function saveLayer2CampaignSuggestions(params: {
  db: DbClient;
  projectId: string;
  campaigns: GeneratedCampaign[];
  replacePending?: boolean;
}): Promise<{ savedCampaigns: Awaited<ReturnType<DbClient["campaign"]["create"]>>[]; setIndex: number }> {
  const { db, projectId, campaigns, replacePending = true } = params;

  if (replacePending) {
    await db.campaign.deleteMany({
      where: {
        projectId,
        creatives: { none: {} },
      },
    });
  }

  const existing = await db.campaign.findMany({
    where: { projectId },
    select: { setIndex: true },
  });
  const maxSetIndex = existing.length
    ? Math.max(...existing.map((campaign) => campaign.setIndex))
    : 0;
  const nextSetIndex = maxSetIndex + 1;

  const savedCampaigns = await Promise.all(
    campaigns.map((campaign, index) =>
      db.campaign.create({
        data: {
          projectId,
          title: campaign.title || `Campaign ${index + 1}`,
          goal: campaign.goal,
          strategicAngle: campaign.strategicAngle,
          narrativeHook: campaign.narrativeHook,
          audiencePainPoint: campaign.audiencePainPoint,
          emotionalLever: campaign.emotionalLever,
          ctaStyle: campaign.ctaStyle,
          visualDirection: campaign.visualDirection,
          bestPlatforms: campaign.bestPlatforms,
          strategicLens: campaign.strategicLens ?? null,
          hookArchetype: campaign.hookArchetype ?? null,
          setIndex: nextSetIndex,
        },
      }),
    ),
  );

  return { savedCampaigns, setIndex: nextSetIndex };
}

export function toCampaignStrategy(campaign: {
  title: string;
  goal: string;
  strategicAngle: string;
  narrativeHook: string;
  audiencePainPoint: string;
  emotionalLever: string;
  ctaStyle: string;
  visualDirection: string;
  bestPlatforms: string[];
  strategicLens?: string | null;
  hookArchetype?: string | null;
}): CampaignStrategy {
  return {
    title: campaign.title,
    goal: (campaign.goal as CampaignStrategy["goal"]) ?? "awareness",
    strategicAngle: campaign.strategicAngle,
    narrativeHook: campaign.narrativeHook,
    audiencePainPoint: campaign.audiencePainPoint,
    emotionalLever:
      (campaign.emotionalLever as CampaignStrategy["emotionalLever"]) ?? "trust",
    ctaStyle: (campaign.ctaStyle as CampaignStrategy["ctaStyle"]) ?? "medium",
    visualDirection: campaign.visualDirection,
    bestPlatforms: campaign.bestPlatforms as CampaignStrategy["bestPlatforms"],
    strategicLens:
      (campaign.strategicLens as CampaignStrategy["strategicLens"]) ?? undefined,
    hookArchetype:
      (campaign.hookArchetype as CampaignStrategy["hookArchetype"]) ?? undefined,
  };
}
