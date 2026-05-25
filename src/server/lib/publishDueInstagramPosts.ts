import type { PrismaClient } from '@prisma/client';
import { publishInstagramImage, publishFacebookPost } from './instagramMeta';

function buildCaption(caption: string, hashtags: string[]): string {
  const tags = hashtags.length ? `\n\n${hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}` : '';
  return `${caption}${tags}`.trim();
}

function resolvePublishableImageUrl(postId: string, imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith('data:image/')) {
    throw new Error('Unsupported image URL format for publishing.');
  }
  const base = process.env.NEXTAUTH_URL;
  if (!base) {
    throw new Error('NEXTAUTH_URL is required to publish generated images.');
  }
  return `${base.replace(/\/+$/, '')}/api/scheduler/post-image/${postId}`;
}

export async function publishDueInstagramPosts(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      metaAccessToken: true,
      instagramBusinessAccountId: true,
      facebookPageId: true,
    },
  });

  if (!user?.metaAccessToken) {
    return { attempted: 0, published: 0, failed: 0 };
  }

  const duePosts = await db.scheduledSocialPost.findMany({
    where: {
      userId,
      platform: { in: ['instagram', 'facebook'] },
      status: 'scheduled',
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });

  let published = 0;
  let failed = 0;

  for (const post of duePosts) {
    try {
      const imageUrl = resolvePublishableImageUrl(post.id, post.imageUrl);
      const caption = buildCaption(post.caption, post.hashtags);
      let mediaId: string;

      if (post.platform === 'facebook') {
        if (!user.facebookPageId) {
          throw new Error('No Facebook Page connected. Reconnect your account.');
        }
        mediaId = await publishFacebookPost({
          userAccessToken: user.metaAccessToken,
          pageId: user.facebookPageId,
          imageUrl,
          caption,
        });
      } else {
        if (!user.instagramBusinessAccountId) {
          throw new Error('No Instagram Business account connected. Reconnect your account.');
        }
        mediaId = await publishInstagramImage({
          accessToken: user.metaAccessToken,
          igUserId: user.instagramBusinessAccountId,
          imageUrl,
          caption,
        });
      }

      await db.scheduledSocialPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          instagramMediaId: mediaId,
          errorMessage: null,
        },
      });
      published++;
    } catch (e) {
      await db.scheduledSocialPost.update({
        where: { id: post.id },
        data: {
          status: 'failed',
          errorMessage: e instanceof Error ? e.message.slice(0, 1000) : 'Publish failed',
        },
      });
      failed++;
    }
  }

  return { attempted: duePosts.length, published, failed };
}
