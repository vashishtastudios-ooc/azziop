import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { getModel } from '~/lib/gemini';
import { LAYER2_SYSTEM_PROMPT, buildLayer2UserPrompt } from '~/lib/prompts/layer2-campaign-strategy';
import { canAccessLayer } from '~/lib/quota';
import { spendForAction, grantCredits, costForAction } from '~/lib/credits';
import { CREDIT_COSTS } from '~/lib/pricing';
import { randomUUID } from 'crypto';
import type { BrandDNA } from '~/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, brandDNA, businessOverview, userPrompt, previousTitles, previousContext } = await req.json();

    if (!projectId || !brandDNA) {
      return NextResponse.json(
        { error: 'projectId and brandDNA are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        brandDNA: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const layerAccess = await canAccessLayer(session.user.id, 2);
    if (!layerAccess.allowed) {
      return NextResponse.json(
        { error: 'Your plan does not include campaign generation', plan: layerAccess.planId, upgradeUrl: '/pricing' },
        { status: 403 }
      );
    }

    // Reserve credits up front (atomic) so concurrent requests can't overspend.
    const reserve = await spendForAction(session.user.id, 'campaign', 1);
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

    // Generate campaigns using Gemini
    const model = getModel('layer2');
    const resolvedContext = previousContext ?? (
      previousTitles && previousTitles.length > 0
        ? { titles: previousTitles, hooks: [], angles: [] }
        : undefined
    );
    const userPromptText = buildLayer2UserPrompt(
      brandDNA as BrandDNA,
      businessOverview || '',
      userPrompt,
      resolvedContext
    );

    const response = await model.generateContent([
      { text: LAYER2_SYSTEM_PROMPT },
      { text: userPromptText },
    ]);

    const result = response.response.text();
    let campaigns;
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        campaigns = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (error) {
      console.error('Failed to parse campaigns JSON:', error);
      // Refund the reservation — nothing was produced.
      await grantCredits({
        userId: session.user.id,
        amount: costForAction('campaign', 1),
        reason: 'refund',
        sourceId: `refund:campaign:${randomUUID()}`,
        metadata: { reason: 'parse_failure' },
      });
      return NextResponse.json(
        { error: 'Failed to parse campaign generation response' },
        { status: 500 }
      );
    }

    // Get current max setIndex for this project
    const existingCampaigns = await db.campaign.findMany({
      where: { projectId },
      select: { setIndex: true },
    });
    const maxSetIndex = existingCampaigns.length > 0
      ? Math.max(...existingCampaigns.map(c => c.setIndex))
      : -1;
    const newSetIndex = maxSetIndex + 1;

    // Save campaigns to database
    const savedCampaigns = await Promise.all(
      campaigns.map((campaign: any, index: number) =>
        db.campaign.create({
          data: {
            projectId,
            title: campaign.title || `Campaign ${index + 1}`,
            goal: campaign.goal || 'awareness',
            strategicAngle: campaign.strategicAngle || '',
            narrativeHook: campaign.narrativeHook || '',
            audiencePainPoint: campaign.audiencePainPoint || '',
            emotionalLever: campaign.emotionalLever || 'trust',
            ctaStyle: campaign.ctaStyle || 'medium',
            visualDirection: campaign.visualDirection || '',
            bestPlatforms: Array.isArray(campaign.bestPlatforms)
              ? campaign.bestPlatforms
              : [],
            setIndex: newSetIndex,
          },
        })
      )
    );

    // If the model returned nothing usable, refund the reservation.
    if (savedCampaigns.length === 0) {
      await grantCredits({
        userId: session.user.id,
        amount: costForAction('campaign', 1),
        reason: 'refund',
        sourceId: `refund:campaign:${randomUUID()}`,
        metadata: { reason: 'no_campaigns' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: savedCampaigns.map(c => ({
          title: c.title,
          goal: c.goal,
          strategicAngle: c.strategicAngle,
          narrativeHook: c.narrativeHook,
          audiencePainPoint: c.audiencePainPoint,
          emotionalLever: c.emotionalLever,
          ctaStyle: c.ctaStyle,
          visualDirection: c.visualDirection,
          bestPlatforms: c.bestPlatforms,
        })),
        setIndex: newSetIndex,
      },
    });
  } catch (error) {
    console.error('Layer 2 error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate campaigns' },
      { status: 500 }
    );
  }
}

