import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getModel } from "../../../lib/gemini";
import {
  buildLayer3SystemPrompt,
  buildLayer3UserPrompt,
} from "../../../lib/prompts/layer3-creative-architect";
import {
  buildLayer4SystemPrompt,
  buildLayer4UserPrompt,
} from "../../../lib/prompts/layer4-image-prompt";
import {
  LAYER2_SYSTEM_PROMPT,
  buildLayer2UserPrompt,
  type PreviousCampaignContext,
} from "../../../lib/prompts/layer2-campaign-strategy";
import {
  ALLOWED_LAYOUTS,
  ALLOWED_OVERLAYS,
} from "../../../types";
import type {
  BrandDNA,
  CampaignStrategy,
  SocialCreative,
  WebsiteData,
} from "../../../types";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { spendForAction, grantCredits, costForAction } from "~/lib/credits";
import { randomUUID } from "crypto";

const campaignInputSchema = z.object({
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
});

const campaignStrategySchema = z.array(campaignInputSchema);

const creativeInputSchema = z.array(
  z.object({
    headline: z.string().default(""),
    description: z.string().default(""),
    cta: z.string().default(""),
    layout: z.string().default("hero-center"),
    overlayStyle: z.string().default("none"),
    colorMood: z.string().default("premium"),
    photographyStyle: z.string().default("commercial product"),
    imageIntent: z.string().default(""),
    sceneElements: z.array(z.string()).default([]),
    layoutTemplate: z.string().optional().nullable(),
    textStyle: z
      .object({
        fontWeight: z.string().optional().nullable(),
        alignment: z.string().optional().nullable(),
        hierarchy: z.string().optional().nullable(),
      })
      .optional(),
  }),
);

const toCampaignStrategy = (
  campaign: {
    title: string;
    goal: string;
    strategicAngle: string;
    narrativeHook: string;
    audiencePainPoint: string;
    emotionalLever: string;
    ctaStyle: string;
    visualDirection: string;
    bestPlatforms: string[];
  },
): CampaignStrategy => ({
  title: campaign.title,
  goal: (campaign.goal as CampaignStrategy["goal"]) ?? "awareness",
  strategicAngle: campaign.strategicAngle,
  narrativeHook: campaign.narrativeHook,
  audiencePainPoint: campaign.audiencePainPoint,
  emotionalLever: (campaign.emotionalLever as CampaignStrategy["emotionalLever"]) ?? "trust",
  ctaStyle: (campaign.ctaStyle as CampaignStrategy["ctaStyle"]) ?? "medium",
  visualDirection: campaign.visualDirection,
  bestPlatforms: campaign.bestPlatforms as CampaignStrategy["bestPlatforms"],
});

/** Fallback image for a creative slot when there is no GeneratedImage — mirrors CreativesPage.getImageForCreative. */
function defaultImageForCreativeIndex(
  creativeIndex: number,
  websiteData: WebsiteData | null | undefined,
): string | null {
  if (!websiteData) return null;
  const imgs = websiteData.images;
  if (imgs && imgs.length > 1) {
    const productShots = imgs.slice(1);
    const url = productShots[creativeIndex % productShots.length];
    if (url) return url;
  }
  if (imgs && imgs.length === 1 && imgs[0]) {
    return imgs[0];
  }
  const logo = websiteData.logo;
  return logo && logo.length > 0 ? logo : null;
}

/** Thumbnail for Past Campaigns: any generated image in the campaign, else default imagery for the first slot. */
function resolveCampaignPreviewUrl(
  creatives: Array<{ generatedImage: { imageUrl: string } | null }>,
  websiteData: WebsiteData | null | undefined,
): string | null {
  for (let i = 0; i < creatives.length; i++) {
    const url = creatives[i]?.generatedImage?.imageUrl;
    if (url) return url;
  }
  return defaultImageForCreativeIndex(0, websiteData ?? null);
}

/** Check that 3 campaigns are meaningfully different from each other. */
function checkDiversity(
  campaigns: Array<{
    goal: string;
    emotionalLever: string;
    narrativeHook: string;
    strategicAngle: string;
  }>,
): string[] {
  const issues: string[] = [];

  const goals = campaigns.map((c) => c.goal);
  if (new Set(goals).size < goals.length) {
    issues.push(`Duplicate goals: ${goals.join(", ")}`);
  }

  const levers = campaigns.map((c) => c.emotionalLever);
  if (new Set(levers).size < levers.length) {
    issues.push(`Duplicate emotional levers: ${levers.join(", ")}`);
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
        issues.push(
          `Strategic angles ${i + 1} and ${j + 1} overlap >40% key words`,
        );
      }
    }
  }

  return issues;
}

const buildBusinessOverview = (websiteData: WebsiteData | null) => {
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
};

export const campaignRouter = createTRPCRouter({
  getProjectCampaignSets: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
    const project = await ctx.db.project.findFirst({
      where: {
        userId: ctx.session.user.id,
        ...(input?.projectId ? { id: input.projectId } : {}),
      },
      include: {
        websiteData: true,
        brandDNA: true,
        campaigns: {
          orderBy: [{ setIndex: "asc" }, { createdAt: "asc" }],
          include: {
            creatives: {
              take: 24,
              orderBy: { createdAt: "asc" },
              include: { generatedImage: true },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: input?.projectId ? "Project not found" : "No project found",
      });
    }

    const groupedBySet = new Map<number, CampaignStrategy[]>();

    for (const campaign of project.campaigns) {
      const currentSet = groupedBySet.get(campaign.setIndex) ?? [];
      currentSet.push(
        toCampaignStrategy({
          title: campaign.title,
          goal: campaign.goal,
          strategicAngle: campaign.strategicAngle,
          narrativeHook: campaign.narrativeHook,
          audiencePainPoint: campaign.audiencePainPoint,
          emotionalLever: campaign.emotionalLever,
          ctaStyle: campaign.ctaStyle,
          visualDirection: campaign.visualDirection,
          bestPlatforms: campaign.bestPlatforms,
        }),
      );
      groupedBySet.set(campaign.setIndex, currentSet);
    }

    const campaignSets = Array.from(groupedBySet.entries())
      .sort(([left], [right]) => left - right)
      .map(([setIndex, campaigns]) => ({ setIndex, campaigns }));

    const wd = project.websiteData as WebsiteData | null;

    const campaignPreviews = project.campaigns
      .filter((c: { creatives: Array<unknown> }) => c.creatives.length > 0)
      .map((c: {
        id: string;
        title: string;
        setIndex: number;
        creatives: Array<{ generatedImage: { imageUrl: string } | null }>;
      }) => ({
        id: c.id,
        title: c.title,
        setIndex: c.setIndex,
        firstImageUrl: resolveCampaignPreviewUrl(c.creatives, wd),
      }));

    // "Current suggestions" are campaigns that exist, but have no creatives generated yet.
    // This is the DB-backed source for the "Generated Campaigns" grid on the UI.
    const currentSuggestions = project.campaigns
      .filter((c: { creatives: Array<unknown> }) => c.creatives.length === 0)
      .sort((a: any, b: any) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0))
      .slice(0, 3)
      .map((c: any) =>
        toCampaignStrategy({
          title: c.title,
          goal: c.goal,
          strategicAngle: c.strategicAngle,
          narrativeHook: c.narrativeHook,
          audiencePainPoint: c.audiencePainPoint,
          emotionalLever: c.emotionalLever,
          ctaStyle: c.ctaStyle,
          visualDirection: c.visualDirection,
          bestPlatforms: c.bestPlatforms,
        }),
      );

    return {
      projectId: project.id,
      websiteData: project.websiteData,
      brandDNA: project.brandDNA,
      campaignSets,
      campaignPreviews,
      currentSuggestions,
    };
  }),

  generate: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        userPrompt: z.string().trim().optional(),
        previousContext: z
          .object({
            titles: z.array(z.string()).default([]),
            hooks: z.array(z.string()).default([]),
            angles: z.array(z.string()).default([]),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        include: {
          websiteData: true,
          brandDNA: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (!project.brandDNA) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Brand DNA is required before generating campaigns",
        });
      }

      const brandDNA = project.brandDNA as BrandDNA;
      const businessOverview = buildBusinessOverview(
        project.websiteData as WebsiteData | null,
      );
      const model = getModel("layer2");
      const MAX_ATTEMPTS = 2;

      // Reserve credits up front (atomic). Refunded below if generation fails.
      const reserve = await spendForAction(ctx.session.user.id, "campaign", 1);
      if (!reserve.ok) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Not enough credits. Generating campaigns costs ${costForAction(
            "campaign",
            1,
          )} credits — your balance is ${reserve.balance}. Top up or upgrade in Pricing.`,
        });
      }

      const refundCampaign = () =>
        grantCredits({
          userId: ctx.session.user.id,
          amount: costForAction("campaign", 1),
          reason: "refund",
          sourceId: `refund:campaign:${randomUUID()}`,
          metadata: { reason: "generation_failed" },
        });

      try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const prevCtx: PreviousCampaignContext | undefined =
          input.previousContext &&
          (input.previousContext.titles.length > 0 ||
            input.previousContext.hooks.length > 0 ||
            input.previousContext.angles.length > 0)
            ? input.previousContext
            : undefined;

        const userPromptText = buildLayer2UserPrompt(
          brandDNA,
          businessOverview,
          input.userPrompt,
          prevCtx,
        );

        const response = await model.generateContent([
          { text: LAYER2_SYSTEM_PROMPT },
          { text: userPromptText },
        ]);

        const llmText = response.response.text();
        const jsonMatch = llmText.match(/\[[\s\S]*\]/);

        if (!jsonMatch) {
          if (attempt < MAX_ATTEMPTS - 1) continue;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Campaign generation returned invalid JSON",
          });
        }

        let parsedCampaigns: z.infer<typeof campaignStrategySchema>;
        try {
          parsedCampaigns = campaignStrategySchema.parse(
            JSON.parse(jsonMatch[0]),
          );
        } catch {
          if (attempt < MAX_ATTEMPTS - 1) continue;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to parse generated campaigns",
          });
        }

        const diversityIssues = checkDiversity(parsedCampaigns);
        if (diversityIssues.length > 0 && attempt < MAX_ATTEMPTS - 1) {
          console.warn(
            `[campaign.generate] Diversity check failed (attempt ${attempt + 1}):`,
            diversityIssues,
          );
          continue;
        }

        if (diversityIssues.length > 0) {
          console.warn(
            `[campaign.generate] Accepting after ${MAX_ATTEMPTS} attempts despite issues:`,
            diversityIssues,
          );
        }

        // Replace current suggestions in DB:
        // - delete campaigns that have no creatives yet (they never reached "Generate Creatives")
        // - insert the freshly generated suggestions
        await ctx.db.campaign.deleteMany({
          where: {
            projectId: input.projectId,
            creatives: { none: {} },
          },
        });

        const existing = await ctx.db.campaign.findMany({
          where: { projectId: input.projectId },
          select: { setIndex: true },
        });

        const maxSetIndex = existing.length
          ? Math.max(...existing.map((c: { setIndex: number }) => c.setIndex))
          : 0;
        const nextSetIndex = maxSetIndex + 1;

        const savedCampaigns = await Promise.all(
          parsedCampaigns.map((campaign, index) =>
            ctx.db.campaign.create({
              data: {
                projectId: input.projectId,
                title: campaign.title || `Campaign ${index + 1}`,
                goal: campaign.goal,
                strategicAngle: campaign.strategicAngle,
                narrativeHook: campaign.narrativeHook,
                audiencePainPoint: campaign.audiencePainPoint,
                emotionalLever: campaign.emotionalLever,
                ctaStyle: campaign.ctaStyle,
                visualDirection: campaign.visualDirection,
                bestPlatforms: campaign.bestPlatforms,
                setIndex: nextSetIndex,
              },
            }),
          ),
        );

        return {
          campaigns: savedCampaigns.map((campaign: any) =>
            toCampaignStrategy({
              title: campaign.title,
              goal: campaign.goal,
              strategicAngle: campaign.strategicAngle,
              narrativeHook: campaign.narrativeHook,
              audiencePainPoint: campaign.audiencePainPoint,
              emotionalLever: campaign.emotionalLever,
              ctaStyle: campaign.ctaStyle,
              visualDirection: campaign.visualDirection,
              bestPlatforms: campaign.bestPlatforms,
            }),
          ),
        };
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Campaign generation failed after retries",
      });
      } catch (e) {
        await refundCampaign();
        throw e;
      }
    }),

  generateCreatives: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        campaign: campaignInputSchema,
        aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]).default("1:1"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        include: {
          brandDNA: true,
          campaigns: {
            select: { setIndex: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (!project.brandDNA) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Brand DNA is required before generating creatives",
        });
      }

      const campaignData = input.campaign;

      let campaignRecord = await ctx.db.campaign.findFirst({
        where: {
          projectId: input.projectId,
          title: campaignData.title,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!campaignRecord) {
        const maxSetIndex = project.campaigns.length
          ? Math.max(
              ...project.campaigns.map((campaign: { setIndex: number }) => campaign.setIndex),
            )
          : 0;

        campaignRecord = await ctx.db.campaign.create({
          data: {
            projectId: input.projectId,
            title: campaignData.title,
            goal: campaignData.goal,
            strategicAngle: campaignData.strategicAngle,
            narrativeHook: campaignData.narrativeHook,
            audiencePainPoint: campaignData.audiencePainPoint,
            emotionalLever: campaignData.emotionalLever,
            ctaStyle: campaignData.ctaStyle,
            visualDirection: campaignData.visualDirection,
            bestPlatforms: campaignData.bestPlatforms,
            setIndex: maxSetIndex,
          },
        });
      }

      const brandDNA = project.brandDNA as BrandDNA;

      const layer3Model = getModel("layer3");
      const layer3SystemPrompt = buildLayer3SystemPrompt(brandDNA);
      const layer3UserPrompt = buildLayer3UserPrompt(
        campaignData as CampaignStrategy,
        brandDNA,
        ALLOWED_LAYOUTS,
        ALLOWED_OVERLAYS,
      );

      const layer3Response = await layer3Model.generateContent([
        { text: layer3SystemPrompt },
        { text: layer3UserPrompt },
      ]);

      const layer3Text = layer3Response.response.text();
      const layer3JsonMatch = layer3Text.match(/\[[\s\S]*\]/);

      if (!layer3JsonMatch) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Creative generation returned invalid JSON",
        });
      }

      let parsedCreatives: z.infer<typeof creativeInputSchema>;
      try {
        parsedCreatives = creativeInputSchema.parse(JSON.parse(layer3JsonMatch[0]));
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to parse generated creatives",
        });
      }

      const savedCreatives = await Promise.all(
        parsedCreatives.map((creative) =>
          ctx.db.creative.create({
            data: {
              campaignId: campaignRecord.id,
              headline: creative.headline,
              description: creative.description,
              cta: creative.cta,
              layout: creative.layout,
              overlayStyle: creative.overlayStyle,
              colorMood: creative.colorMood,
              photographyStyle: creative.photographyStyle,
              imageIntent: creative.imageIntent,
              sceneElements: creative.sceneElements,
              layoutTemplate: creative.layoutTemplate ?? null,
              fontWeight: creative.textStyle?.fontWeight ?? null,
              textAlignment: creative.textStyle?.alignment ?? null,
              textHierarchy: creative.textStyle?.hierarchy ?? null,
            },
          }),
        ),
      );

      const layer4Model = getModel("layer4");
      const layer4SystemPrompt = buildLayer4SystemPrompt(brandDNA);

      const savedImagePrompts = await Promise.all(
        savedCreatives.map(
          async (
            creative: {
              id: string;
              headline: string;
              description: string;
              cta: string;
              layout: string;
              overlayStyle: string;
              colorMood: string;
              photographyStyle: string;
              imageIntent: string;
              sceneElements: string[];
              fontWeight: string | null;
              textAlignment: string | null;
              textHierarchy: string | null;
            },
            index: number,
          ) => {
          const creativeForPrompt: SocialCreative = {
            headline: creative.headline,
            description: creative.description,
            cta: creative.cta,
            layout: creative.layout as SocialCreative["layout"],
            overlayStyle: creative.overlayStyle as SocialCreative["overlayStyle"],
            colorMood: creative.colorMood,
            photographyStyle: creative.photographyStyle,
            imageIntent: creative.imageIntent,
            sceneElements: creative.sceneElements,
            textStyle: {
              fontWeight: (creative.fontWeight as "light" | "regular" | "bold") ?? "regular",
              alignment: (creative.textAlignment as "left" | "center") ?? "center",
              hierarchy:
                (creative.textHierarchy as "headline-dominant" | "balanced") ?? "balanced",
            },
          };

          const layer4UserPrompt = buildLayer4UserPrompt(
            creativeForPrompt,
            brandDNA,
            index,
            campaignData as CampaignStrategy,
            input.aspectRatio,
          );

          const layer4Response = await layer4Model.generateContent([
            { text: layer4SystemPrompt },
            { text: layer4UserPrompt },
          ]);

          const promptText = layer4Response.response.text().trim();

          const promptRecord = await ctx.db.imagePrompt.upsert({
            where: { creativeId: creative.id },
            create: {
              creativeId: creative.id,
              prompt: promptText,
              aspectRatio: input.aspectRatio,
            },
            update: {
              prompt: promptText,
              aspectRatio: input.aspectRatio,
            },
          });

          return {
            creativeIndex: index,
            prompt: promptRecord.prompt,
            aspectRatio: promptRecord.aspectRatio,
          };
          },
        ),
      );

      return {
        campaignId: campaignRecord.id,
        creatives: savedCreatives.map(
          (creative: {
            headline: string;
            description: string;
            cta: string;
            layout: string;
            overlayStyle: string;
            colorMood: string;
            photographyStyle: string;
            imageIntent: string;
            sceneElements: string[];
            fontWeight: string | null;
            textAlignment: string | null;
            textHierarchy: string | null;
          }) => ({
            headline: creative.headline,
            description: creative.description,
            cta: creative.cta,
            layout: creative.layout,
            overlayStyle: creative.overlayStyle,
            colorMood: creative.colorMood,
            photographyStyle: creative.photographyStyle,
            imageIntent: creative.imageIntent,
            sceneElements: creative.sceneElements,
            textStyle: {
              fontWeight: creative.fontWeight,
              alignment: creative.textAlignment,
              hierarchy: creative.textHierarchy,
            },
          }),
        ),
        imagePrompts: savedImagePrompts,
      };
    }),
});
