import type {
  BrandDNA,
  CampaignStrategy,
  SocialCreative,
  WebsiteData,
} from "../../../types";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const creativeRouter = createTRPCRouter({
  getLatestProjectCreatives: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().min(1).optional(),
          campaignId: z.string().min(1).optional(),
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
            include: {
              creatives: {
                include: {
                  imagePrompt: true,
                  generatedImage: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (!project) {
        return {
          projectId: null,
          websiteData: null,
          brandDNA: null,
          selectedCampaign: null,
          creatives: [],
          creativeIds: [],
          imagePrompts: [],
          generatedImages: [],
        };
      }

      const selectedCampaign =
        (input?.campaignId
          ? project.campaigns.find(
              (campaign: { id: string }) => campaign.id === input.campaignId,
            ) ?? null
          : null) ??
        project.campaigns.find(
          (campaign: { creatives: Array<unknown> }) => campaign.creatives.length > 0,
        ) ??
        project.campaigns[0] ??
        null;

      if (!selectedCampaign) {
        return {
          projectId: project.id,
          websiteData: project.websiteData,
          brandDNA: project.brandDNA,
          selectedCampaign: null,
          creatives: [],
          creativeIds: [],
          imagePrompts: [],
          generatedImages: [],
        };
      }

      const creativeIds = selectedCampaign.creatives.map(
        (creative: { id: string }) => creative.id,
      );

      const creatives = selectedCampaign.creatives.map(
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
          layoutTemplate: string | null;
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
          layoutTemplate: creative.layoutTemplate ?? null,
          textStyle: {
            fontWeight: creative.fontWeight,
            alignment: creative.textAlignment,
            hierarchy: creative.textHierarchy,
          },
        }),
      );

      const imagePrompts = selectedCampaign.creatives
        .map(
          (
            creative: { imagePrompt: { prompt: string; aspectRatio: string } | null },
            creativeIndex: number,
          ) => {
            if (!creative.imagePrompt) return null;
            return {
              creativeIndex,
              prompt: creative.imagePrompt.prompt,
              aspectRatio: creative.imagePrompt.aspectRatio,
            };
          },
        )
        .filter(
          (
            prompt: { creativeIndex: number; prompt: string; aspectRatio: string } | null,
          ): prompt is { creativeIndex: number; prompt: string; aspectRatio: string } =>
            Boolean(prompt),
        );

      const generatedImages = selectedCampaign.creatives
        .map(
          (
            creative: { generatedImage: { imageUrl: string } | null },
            creativeIndex: number,
          ) => {
            if (!creative.generatedImage) return null;
            return {
              creativeIndex,
              imageUrl: creative.generatedImage.imageUrl,
            };
          },
        )
        .filter(
          (image: { creativeIndex: number; imageUrl: string } | null): image is {
            creativeIndex: number;
            imageUrl: string;
          } => Boolean(image),
        );

      const selectedCampaignOutput: CampaignStrategy = {
        title: selectedCampaign.title,
        goal: selectedCampaign.goal as CampaignStrategy["goal"],
        strategicAngle: selectedCampaign.strategicAngle,
        narrativeHook: selectedCampaign.narrativeHook,
        audiencePainPoint: selectedCampaign.audiencePainPoint,
        emotionalLever: selectedCampaign.emotionalLever as CampaignStrategy["emotionalLever"],
        ctaStyle: selectedCampaign.ctaStyle as CampaignStrategy["ctaStyle"],
        visualDirection: selectedCampaign.visualDirection,
        bestPlatforms: selectedCampaign.bestPlatforms as CampaignStrategy["bestPlatforms"],
      };

      return {
        projectId: project.id,
        websiteData: project.websiteData as WebsiteData | null,
        brandDNA: project.brandDNA as BrandDNA | null,
        selectedCampaign: selectedCampaignOutput,
        creatives: creatives as SocialCreative[],
        creativeIds,
        imagePrompts,
        generatedImages,
      };
    }),

  updateCreativeCopy: protectedProcedure
    .input(
      z.object({
        creativeId: z.string().min(1),
        headline: z.string().optional(),
        description: z.string().optional(),
        cta: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const creative = await ctx.db.creative.findFirst({
        where: {
          id: input.creativeId,
          campaign: {
            project: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!creative) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creative not found",
        });
      }

      const updated = await ctx.db.creative.update({
        where: { id: input.creativeId },
        data: {
          ...(input.headline !== undefined ? { headline: input.headline } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.cta !== undefined ? { cta: input.cta } : {}),
        },
      });

      return {
        id: updated.id,
        headline: updated.headline,
        description: updated.description,
        cta: updated.cta,
      };
    }),
});
