import type { PrismaClient } from "@prisma/client";

/**
 * Removes all campaigns for a project plus nested creatives, image prompts, and generated images.
 * Used when re-running Layer 1 (reset Brand DNA) and before deleting a project, so MongoDB
 * stays consistent even if relation cascades are not applied for batch deletes.
 */
export async function wipeProjectCampaignData(db: PrismaClient, projectId: string) {
  const creativeIds = (
    await db.creative.findMany({
      where: { campaign: { projectId } },
      select: { id: true },
    })
  ).map((c) => c.id);

  if (creativeIds.length > 0) {
    await db.imagePrompt.deleteMany({ where: { creativeId: { in: creativeIds } } });
    await db.generatedImage.deleteMany({ where: { creativeId: { in: creativeIds } } });
    await db.creative.deleteMany({ where: { id: { in: creativeIds } } });
  }

  await db.campaign.deleteMany({ where: { projectId } });
}
