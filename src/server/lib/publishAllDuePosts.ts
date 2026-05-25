import type { PrismaClient } from "@prisma/client";
import { publishDueInstagramPosts } from "./publishDueInstagramPosts";

/**
 * Runs the publish-due job for EVERY user who currently has at least one
 * scheduled post whose time has arrived. This is what a cron should call —
 * `publishDueInstagramPosts(db, userId)` only covers a single user and was
 * originally wired to the logged-in session, so posts never fired when the
 * author was offline.
 *
 * Strategy:
 *  1. Find the distinct set of userIds with status=scheduled and scheduledAt<=now.
 *  2. For each user, delegate to the existing single-user publisher.
 *  3. Aggregate counts and return a summary for observability.
 *
 * We intentionally process users sequentially to stay well under the
 * Instagram Graph API's per-token rate limits. With the default `take: 5`
 * inside `publishDueInstagramPosts`, a run of 100 users still completes in
 * under a couple of minutes.
 */
export async function publishAllDuePosts(db: PrismaClient): Promise<{
  usersProcessed: number;
  attempted: number;
  published: number;
  failed: number;
  skippedNoToken: number;
}> {
  const now = new Date();

  const dueUserRows = await db.scheduledSocialPost.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
      platform: { in: ["instagram", "facebook"] },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const userIds = dueUserRows.map((r) => r.userId);

  let usersProcessed = 0;
  let attempted = 0;
  let published = 0;
  let failed = 0;
  let skippedNoToken = 0;

  for (const userId of userIds) {
    try {
      const result = await publishDueInstagramPosts(db, userId);
      attempted += result.attempted;
      published += result.published;
      failed += result.failed;
      if (result.attempted === 0) {
        skippedNoToken += 1;
      }
      usersProcessed += 1;
    } catch (e) {
      console.error(`[cron:publish-due] user=${userId} crashed`, e);
      failed += 1;
    }
  }

  return { usersProcessed, attempted, published, failed, skippedNoToken };
}
