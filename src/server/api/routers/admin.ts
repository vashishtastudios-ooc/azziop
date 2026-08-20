import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

import { createTRPCRouter, adminProcedure } from "../trpc";
import { isAdminAccount } from "~/lib/admin";
import {
  getAiRuntimeSettings,
  saveAiRuntimeSettings,
  TEXT_MODEL_OPTIONS,
  IMAGE_MODEL_OPTIONS,
  IMAGE_SIZE_OPTIONS,
} from "~/lib/aiRuntimeSettings";
import { grantCredits, spendCredits } from "~/lib/credits";
import { isPlanId, PRICING_PLANS, CREDIT_COSTS } from "~/lib/pricing";
import {
  getBillingRuntime,
  saveBillingRuntime,
  codeDefaultPlans,
  getCreditCosts,
} from "~/lib/billingRuntime";
import { getFeatureFlags, saveFeatureFlags } from "~/lib/featureFlags";
import {
  PROMPT_LAYERS,
  defaultPromptBody,
  getActivePromptBody,
  listPromptVersions,
  savePromptVersion,
  activatePromptVersion,
  restoreCodeDefault,
  type PromptLayer,
} from "~/lib/promptRuntime";

const planIdSchema = z.enum(["free", "starter", "pro", "agency"]);

export const adminRouter = createTRPCRouter({
  me: adminProcedure.query(({ ctx }) => ({
    id: ctx.admin.id,
    email: ctx.admin.email,
    role: ctx.admin.role,
  })),

  overview: adminProcedure.query(async ({ ctx }) => {
    const [userCount, adminCount, settings] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "admin" } }),
      getAiRuntimeSettings(),
    ]);

    return {
      userCount,
      adminCount,
      settings,
    };
  }),

  getModels: adminProcedure.query(async () => {
    const settings = await getAiRuntimeSettings();
    return {
      settings,
      textModelOptions: TEXT_MODEL_OPTIONS,
      imageModelOptions: IMAGE_MODEL_OPTIONS,
      imageSizeOptions: IMAGE_SIZE_OPTIONS,
      envFallback: {
        textModel: process.env.OPENROUTER_TEXT_MODEL || "google/gemini-2.5-flash",
        imageModel: process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-image-2",
        imageSize: process.env.OPENROUTER_IMAGE_SIZE || "2K",
      },
    };
  }),

  updateModels: adminProcedure
    .input(
      z.object({
        textModel: z.string().min(1).max(120).optional(),
        imageModel: z.string().min(1).max(120).optional(),
        imageSize: z.enum(["512", "1K", "2K", "4K"]).optional(),
        generationPaused: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return saveAiRuntimeSettings(input);
    }),

  listUsers: adminProcedure
    .input(
      z.object({
        query: z.string().trim().optional(),
        take: z.number().int().min(1).max(50).default(25),
        skip: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const q = input.query?.trim();
      const where = q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
              { mobile: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: input.skip,
          take: input.take,
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            planId: true,
            creditBalance: true,
            subscriptionStatus: true,
            createdAt: true,
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        total,
        users: users.map((u) => ({
          ...u,
          isAdmin: isAdminAccount(u),
        })),
      };
    }),

  grantCredits: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        amount: z.number().int().min(1).max(100_000),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const balance = await grantCredits({
        userId: input.userId,
        amount: input.amount,
        reason: "admin_grant",
        sourceId: `admin-grant:${input.userId}:${randomUUID()}`,
        metadata: {
          by: ctx.admin.id,
          note: input.note || undefined,
        },
      });

      return { balance };
    }),

  deductCredits: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        amount: z.number().int().min(1).max(100_000),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await spendCredits({
        userId: input.userId,
        amount: input.amount,
        reason: "admin_adjust",
        metadata: { by: ctx.admin.id, note: input.note || undefined },
      });
      if (!result.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Not enough credits (balance ${result.balance}).`,
        });
      }
      return { balance: result.balance };
    }),

  setPlan: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        planId: planIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPlanId(input.planId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan" });
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          planId: input.planId,
          subscriptionStatus: "active",
        },
        select: {
          id: true,
          planId: true,
          creditBalance: true,
        },
      });

      return user;
    }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["user", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.admin.id && input.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove your own admin access.",
        });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true, email: true, name: true },
      });
    }),

  planOptions: adminProcedure.query(() =>
    PRICING_PLANS.map((p) => ({ id: p.id, name: p.name })),
  ),

  getBilling: adminProcedure.query(async () => {
    const runtime = await getBillingRuntime();
    return {
      runtime,
      codeDefaults: {
        creditCosts: { image: CREDIT_COSTS.image, campaign: CREDIT_COSTS.campaign },
        plans: codeDefaultPlans(),
      },
    };
  }),

  updateBilling: adminProcedure
    .input(
      z.object({
        creditCosts: z
          .object({
            image: z.number().int().min(1).max(10_000).optional(),
            campaign: z.number().int().min(1).max(10_000).optional(),
          })
          .optional(),
        planId: z.enum(["free", "starter", "pro", "agency"]).optional(),
        planLimits: z
          .object({
            monthlyCredits: z.number().int().min(0).max(1_000_000).optional(),
            aiLayers: z.number().int().min(1).max(6).nullable().optional(),
            projects: z.number().int().min(1).max(10_000).nullable().optional(),
            scheduling: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const current = await getBillingRuntime();
      const plans = { ...current.plans };
      if (input.planId && input.planLimits) {
        plans[input.planId] = { ...plans[input.planId], ...input.planLimits };
      }
      return saveBillingRuntime({
        creditCosts: input.creditCosts
          ? { ...current.creditCosts, ...input.creditCosts }
          : current.creditCosts,
        plans,
      });
    }),

  getFlags: adminProcedure.query(() => getFeatureFlags()),

  updateFlags: adminProcedure
    .input(
      z.object({
        generateImages: z.boolean().optional(),
        cloneCreative: z.boolean().optional(),
        productInfographic: z.boolean().optional(),
        scheduling: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => saveFeatureFlags(input)),

  getPrompt: adminProcedure
    .input(z.object({ layer: z.enum(PROMPT_LAYERS) }))
    .query(async ({ input }) => {
      const [active, versions] = await Promise.all([
        getActivePromptBody(input.layer),
        listPromptVersions(input.layer),
      ]);
      return {
        layer: input.layer,
        activeBody: active,
        codeDefault: defaultPromptBody(input.layer),
        usingCodeDefault: active === defaultPromptBody(input.layer),
        versions: versions.map((v) => ({
          ...v,
          preview: v.body.slice(0, 160),
        })),
      };
    }),

  savePrompt: adminProcedure
    .input(
      z.object({
        layer: z.enum(PROMPT_LAYERS),
        body: z.string().min(40).max(40_000),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return savePromptVersion({
        layer: input.layer as PromptLayer,
        body: input.body,
        note: input.note,
        createdBy: ctx.admin.email ?? ctx.admin.id,
      });
    }),

  activatePrompt: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => activatePromptVersion(input.id)),

  restorePromptDefault: adminProcedure
    .input(z.object({ layer: z.enum(PROMPT_LAYERS) }))
    .mutation(async ({ ctx, input }) =>
      restoreCodeDefault(input.layer, ctx.admin.email ?? ctx.admin.id),
    ),

  getUserDetail: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          planId: true,
          creditBalance: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const [campaigns, ledger, costs] = await Promise.all([
        ctx.db.campaign.findMany({
          where: { project: { userId: input.userId } },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            title: true,
            createdAt: true,
            projectId: true,
            creatives: {
              orderBy: { createdAt: "asc" },
              take: 6,
              select: {
                id: true,
                headline: true,
                imageIntent: true,
                imagePrompt: { select: { prompt: true } },
                generatedImage: { select: { imageUrl: true, createdAt: true } },
              },
            },
          },
        }),
        ctx.db.creditLedger.findMany({
          where: { userId: input.userId },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amount: true,
            reason: true,
            balanceAfter: true,
            createdAt: true,
          },
        }),
        getCreditCosts(),
      ]);

      return {
        user: { ...user, isAdmin: isAdminAccount(user) },
        campaigns,
        ledger,
        costs,
      };
    }),

  refundImages: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        imageCount: z.number().int().min(1).max(50),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const costs = await getCreditCosts();
      const amount = costs.image * input.imageCount;
      const balance = await grantCredits({
        userId: input.userId,
        amount,
        reason: "refund",
        sourceId: `admin-refund-images:${input.userId}:${randomUUID()}`,
        metadata: {
          by: ctx.admin.id,
          imageCount: input.imageCount,
          note: input.note || undefined,
        },
      });
      return { balance, amount };
    }),

  schedulerHealth: adminProcedure.query(async ({ ctx }) => {
    const [scheduled, failed, published, failedRows] = await Promise.all([
      ctx.db.scheduledSocialPost.count({ where: { status: "scheduled" } }),
      ctx.db.scheduledSocialPost.count({ where: { status: "failed" } }),
      ctx.db.scheduledSocialPost.count({ where: { status: "published" } }),
      ctx.db.scheduledSocialPost.findMany({
        where: { status: "failed" },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          platform: true,
          scheduledAt: true,
          errorMessage: true,
          userId: true,
          caption: true,
        },
      }),
    ]);
    return { scheduled, failed, published, failedRows };
  }),
});
