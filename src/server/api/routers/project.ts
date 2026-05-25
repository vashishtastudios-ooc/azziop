import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { wipeProjectCampaignData } from "~/server/lib/wipeProjectCampaignData";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        websiteData: true,
        brandDNA: true,
        campaigns: {
          select: {
            id: true,
            title: true,
            setIndex: true,
            createdAt: true,
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

    return projects.map((project: {
      id: string;
      url: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      websiteData: unknown;
      brandDNA: unknown;
      campaigns: Array<{ title: string; setIndex: number }>;
    }) => {
      const campaignSetCount = new Set(
        project.campaigns.map((campaign: { setIndex: number }) => campaign.setIndex),
      ).size;
      return {
        id: project.id,
        url: project.url,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        hasWebsiteData: Boolean(project.websiteData),
        hasBrandDNA: Boolean(project.brandDNA),
        campaignCount: project.campaigns.length,
        campaignSetCount,
        latestCampaignTitle: project.campaigns[0]?.title ?? null,
      };
    });
  }),

  getDetails: protectedProcedure
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

      const campaignSetCount = new Set(
        project.campaigns.map((campaign: { setIndex: number }) => campaign.setIndex),
      ).size;

      return {
        id: project.id,
        url: project.url,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        websiteData: project.websiteData,
        brandDNA: project.brandDNA,
        campaigns: project.campaigns,
        campaignCount: project.campaigns.length,
        campaignSetCount,
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await wipeProjectCampaignData(ctx.db, existing.id);

      await ctx.db.project.delete({
        where: { id: existing.id },
      });

      return { success: true };
    }),

  updateBrandDNA: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        brandValues: z.array(z.string()).optional(),
        brandAesthetic: z.string().optional(),
        brandToneOfVoice: z.array(z.string()).optional(),
        marketingBias: z.array(z.string()).optional(),
        avoidList: z.array(z.string()).optional(),
        positioning: z.string().optional(),
        audienceMindset: z.string().optional(),
        industry: z.string().nullable().optional(),
        productType: z.string().nullable().optional(),
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
        },
      });

      if (!project?.brandDNA) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project or Brand DNA not found",
        });
      }

      const updated = await ctx.db.brandDNA.update({
        where: {
          id: project.brandDNA.id,
        },
        data: {
          ...(input.brandValues !== undefined ? { brandValues: input.brandValues } : {}),
          ...(input.brandAesthetic !== undefined ? { brandAesthetic: input.brandAesthetic } : {}),
          ...(input.brandToneOfVoice !== undefined ? { brandToneOfVoice: input.brandToneOfVoice } : {}),
          ...(input.marketingBias !== undefined ? { marketingBias: input.marketingBias } : {}),
          ...(input.avoidList !== undefined ? { avoidList: input.avoidList } : {}),
          ...(input.positioning !== undefined ? { positioning: input.positioning } : {}),
          ...(input.audienceMindset !== undefined ? { audienceMindset: input.audienceMindset } : {}),
          ...(input.industry !== undefined ? { industry: input.industry } : {}),
          ...(input.productType !== undefined ? { productType: input.productType } : {}),
        },
      });

      return updated;
    }),

  updateWebsiteData: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        brandName: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        tagline: z.string().nullable().optional(),
        heroText: z.string().nullable().optional(),
        aboutSection: z.string().nullable().optional(),
        textContent: z.string().nullable().optional(),
        contactEmail: z.string().nullable().optional(),
        keywords: z.array(z.string()).optional(),
        images: z.array(z.string()).optional(),
        colors: z.array(z.string()).optional(),
        fonts: z.array(z.string()).optional(),
        socialLinks: z.array(z.string()).optional(),
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
        },
      });

      if (!project?.websiteData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project or WebsiteData not found",
        });
      }

      const updated = await ctx.db.websiteData.update({
        where: {
          id: project.websiteData.id,
        },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.brandName !== undefined ? { brandName: input.brandName } : {}),
          ...(input.logo !== undefined ? { logo: input.logo } : {}),
          ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
          ...(input.heroText !== undefined ? { heroText: input.heroText } : {}),
          ...(input.aboutSection !== undefined ? { aboutSection: input.aboutSection } : {}),
          ...(input.textContent !== undefined ? { textContent: input.textContent } : {}),
          ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
          ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
          ...(input.images !== undefined ? { images: input.images } : {}),
          ...(input.colors !== undefined ? { colors: input.colors } : {}),
          ...(input.fonts !== undefined ? { fonts: input.fonts } : {}),
          ...(input.socialLinks !== undefined ? { socialLinks: input.socialLinks } : {}),
        },
      });

      return updated;
    }),
});
