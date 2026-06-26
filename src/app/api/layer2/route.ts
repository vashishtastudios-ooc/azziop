import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { z } from 'zod';
import type { BrandDNA, WebsiteData } from '~/types';
import { canAccessLayer } from '~/lib/quota';
import { spendForAction, refundForAction, costForAction } from '~/lib/credits';
import { CREDIT_COSTS } from '~/lib/pricing';
import {
  buildBusinessOverview,
  generateLayer2Campaigns,
  saveLayer2CampaignSuggestions,
  toCampaignStrategy,
} from '~/server/lib/layer2CampaignService';

const inputSchema = z.object({
  projectId: z.string().min(1),
  userPrompt: z.string().trim().optional(),
  // Kept for backward compatibility with older callers.
  previousTitles: z.array(z.string()).optional(),
  previousContext: z
    .object({
      titles: z.array(z.string()).default([]),
      hooks: z.array(z.string()).default([]),
      angles: z.array(z.string()).default([]),
    })
    .optional(),
  businessOverview: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let reservedCredits = false;
  let userId = '';
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = session.user.id;

    const parsed = inputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { projectId, userPrompt, previousContext, previousTitles, businessOverview } =
      parsed.data;

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        brandDNA: true,
        websiteData: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (!project.brandDNA) {
      return NextResponse.json({ error: 'Brand DNA is required' }, { status: 400 });
    }

    const layerAccess = await canAccessLayer(userId, 2);
    if (!layerAccess.allowed) {
      return NextResponse.json(
        { error: 'Your plan does not include campaign generation', plan: layerAccess.planId, upgradeUrl: '/pricing' },
        { status: 403 }
      );
    }

    // Reserve credits up front (atomic) so concurrent requests can't overspend.
    const reserve = await spendForAction(userId, 'campaign', 1);
    if (!reserve.ok) {
      return NextResponse.json(
        {
          error: 'Not enough credits',
          required: costForAction('campaign', 1),
          balance: reserve.balance,
          creditCost: CREDIT_COSTS.campaign,
          upgradeUrl: '/pricing',
        },
        { status: 402 }
      );
    }
    reservedCredits = true;

    const resolvedContext = previousContext ?? (
      previousTitles && previousTitles.length > 0
        ? { titles: previousTitles, hooks: [], angles: [] }
        : undefined
    );

    const canonicalBusinessOverview = buildBusinessOverview(
      project.websiteData as WebsiteData | null,
    );

    const { campaigns: generatedCampaigns } = await generateLayer2Campaigns({
      brandDNA: project.brandDNA as BrandDNA,
      businessOverview: canonicalBusinessOverview || businessOverview || '',
      userPrompt,
      previousContext: resolvedContext,
      maxAttempts: 2,
    });

    const { savedCampaigns, setIndex } = await saveLayer2CampaignSuggestions({
      db,
      projectId,
      campaigns: generatedCampaigns,
      replacePending: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns: savedCampaigns.map((campaign) =>
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
            strategicLens: campaign.strategicLens,
            hookArchetype: campaign.hookArchetype,
          }),
        ),
        setIndex,
      },
    });
  } catch (error) {
    console.error('Layer 2 error:', error);
    if (reservedCredits && userId) {
      await refundForAction(userId, 'campaign', 1, { reason: 'generation_failed' });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate campaigns' },
      { status: 500 }
    );
  }
}

