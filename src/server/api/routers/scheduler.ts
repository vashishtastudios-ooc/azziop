import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../trpc';
import { publishDueInstagramPosts } from '~/server/lib/publishDueInstagramPosts';
import { publishInstagramImage, publishFacebookPost } from '~/server/lib/instagramMeta';
import { getFeatureFlags } from '~/lib/featureFlags';

const platformSchema = z.enum(['instagram', 'facebook']);

function buildCaption(caption: string, hashtags: string[]) {
  const tags = hashtags.length ? `\n\n${hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}` : '';
  return `${caption}${tags}`.trim();
}

function resolvePublishableImageUrl(postId: string, imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith('data:image/')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unsupported image URL format for Instagram publish.',
    });
  }
  const base = process.env.NEXTAUTH_URL;
  if (!base) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'NEXTAUTH_URL is required for Instagram publishing.',
    });
  }
  return `${base.replace(/\/+$/, '')}/api/scheduler/post-image/${postId}`;
}

export const schedulerRouter = createTRPCRouter({
  instagramConnection: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        instagramBusinessAccountId: true,
        instagramUsername: true,
        facebookPageId: true,
        metaAccessToken: true,
        metaTokenExpiresAt: true,
      },
    });
    return {
      connected: Boolean(user?.instagramBusinessAccountId),
      instagramUsername: user?.instagramUsername ?? null,
      facebookConnected: Boolean(user?.facebookPageId && user?.metaAccessToken),
      facebookPageId: user?.facebookPageId ?? null,
      tokenExpiresAt: user?.metaTokenExpiresAt ?? null,
    };
  }),

  publishDue: protectedProcedure.mutation(async ({ ctx }) => {
    return publishDueInstagramPosts(ctx.db, ctx.session.user.id);
  }),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      await publishDueInstagramPosts(ctx.db, ctx.session.user.id);

      return ctx.db.scheduledSocialPost.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          campaign: { select: { title: true } },
          creative: { select: { headline: true } },
        },
      });
    }),

  publishNow: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.scheduledSocialPost.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scheduled post not found' });
      }
      if (post.platform !== 'instagram' && post.platform !== 'facebook') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unsupported platform: ${post.platform}` });
      }
      if (post.status !== 'scheduled' && post.status !== 'failed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Cannot publish post in status: ${post.status}` });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { metaAccessToken: true, instagramBusinessAccountId: true, facebookPageId: true },
      });
      if (!user?.metaAccessToken) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Connect your social account first' });
      }

      const imageUrl = resolvePublishableImageUrl(post.id, post.imageUrl);
      const caption = buildCaption(post.caption, post.hashtags);
      let mediaId: string;

      if (post.platform === 'facebook') {
        if (!user.facebookPageId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No Facebook Page connected. Reconnect your account.' });
        }
        mediaId = await publishFacebookPost({
          userAccessToken: user.metaAccessToken,
          pageId: user.facebookPageId,
          imageUrl,
          caption,
        });
      } else {
        if (!user.instagramBusinessAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Connect your Instagram business account first' });
        }
        mediaId = await publishInstagramImage({
          accessToken: user.metaAccessToken,
          igUserId: user.instagramBusinessAccountId,
          imageUrl,
          caption,
        });
      }

      return ctx.db.scheduledSocialPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          instagramMediaId: mediaId,
          errorMessage: null,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        campaignId: z.string().min(1),
        creativeId: z.string().min(1),
        platform: platformSchema.default('instagram'),
        imageUrl: z.string().min(1),
        caption: z.string().min(1).max(2200),
        hashtags: z.array(z.string()).max(30).default([]),
        firstComment: z.string().max(2200).optional().nullable(),
        scheduledAt: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const flags = await getFeatureFlags();
      if (!flags.scheduling) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Scheduling is temporarily disabled.',
        });
      }

      const creative = await ctx.db.creative.findFirst({
        where: {
          id: input.creativeId,
          campaignId: input.campaignId,
          campaign: {
            projectId: input.projectId,
            project: { userId: ctx.session.user.id },
          },
        },
        select: { id: true },
      });
      if (!creative) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creative not found for this project',
        });
      }

      return ctx.db.scheduledSocialPost.create({
        data: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
          campaignId: input.campaignId,
          creativeId: input.creativeId,
          platform: input.platform,
          imageUrl: input.imageUrl,
          caption: input.caption.trim(),
          hashtags: input.hashtags.map((h) => h.replace(/^#/, '').trim()).filter(Boolean),
          firstComment: input.firstComment?.trim() || null,
          scheduledAt: input.scheduledAt,
          status: 'scheduled',
        },
        include: {
          campaign: { select: { title: true } },
          creative: { select: { headline: true } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        caption: z.string().min(1).max(2200).optional(),
        hashtags: z.array(z.string()).max(30).optional(),
        firstComment: z.string().max(2200).optional().nullable(),
        scheduledAt: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.scheduledSocialPost.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scheduled post not found' });
      }
      if (existing.status !== 'scheduled' && existing.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only scheduled or draft posts can be edited',
        });
      }

      const { id, ...rest } = input;
      const data: Record<string, unknown> = {};
      if (rest.caption !== undefined) data.caption = rest.caption.trim();
      if (rest.hashtags !== undefined) {
        data.hashtags = rest.hashtags.map((h) => h.replace(/^#/, '').trim()).filter(Boolean);
      }
      if (rest.firstComment !== undefined) data.firstComment = rest.firstComment?.trim() || null;
      if (rest.scheduledAt !== undefined) data.scheduledAt = rest.scheduledAt;

      return ctx.db.scheduledSocialPost.update({
        where: { id },
        data,
        include: {
          campaign: { select: { title: true } },
          creative: { select: { headline: true } },
        },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.scheduledSocialPost.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scheduled post not found' });
      }
      return ctx.db.scheduledSocialPost.update({
        where: { id: input.id },
        data: { status: 'cancelled', errorMessage: null },
      });
    }),

  disconnectInstagram: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        metaAccessToken: null,
        metaTokenExpiresAt: null,
        instagramBusinessAccountId: null,
        instagramUsername: null,
        facebookPageId: null,
      },
    });
    return { ok: true as const };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.scheduledSocialPost.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scheduled post not found' });
      }
      await ctx.db.scheduledSocialPost.delete({ where: { id: input.id } });
      return { ok: true as const };
    }),
});
