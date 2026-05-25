import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { getModel } from '~/lib/gemini';
import { buildLayer3SystemPrompt, buildLayer3UserPrompt } from '~/lib/prompts/layer3-creative-architect';
import { ALLOWED_LAYOUTS, ALLOWED_OVERLAYS } from '~/types';
import type { BrandDNA, CampaignStrategy } from '~/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, campaignId, campaign, brandDNA } = await req.json();

    if (!projectId || !campaign || !brandDNA) {
      return NextResponse.json(
        { error: 'projectId, campaign, and brandDNA are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find campaign if campaignId provided, otherwise use provided campaign data
    let campaignRecord;
    if (campaignId) {
      campaignRecord = await db.campaign.findFirst({
        where: {
          id: campaignId,
          projectId,
        },
      });
      if (!campaignRecord) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }

    // Generate creatives using Gemini
    const model = getModel('layer3');
    const systemPrompt = buildLayer3SystemPrompt(brandDNA as BrandDNA);
    const userPrompt = buildLayer3UserPrompt(
      campaign as CampaignStrategy,
      brandDNA as BrandDNA,
      ALLOWED_LAYOUTS,
      ALLOWED_OVERLAYS
    );

    const response = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const result = response.response.text();
    let creatives;
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        creatives = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (error) {
      console.error('Failed to parse creatives JSON:', error);
      return NextResponse.json(
        { error: 'Failed to parse creative generation response' },
        { status: 500 }
      );
    }

    // Use campaignId from database or create campaign if needed
    let targetCampaignId = campaignRecord?.id || campaignId;
    if (!targetCampaignId) {
      // Create campaign if it doesn't exist
      const newCampaign = await db.campaign.create({
        data: {
          projectId,
          title: campaign.title || 'New Campaign',
          goal: campaign.goal || 'awareness',
          strategicAngle: campaign.strategicAngle || '',
          narrativeHook: campaign.narrativeHook || '',
          audiencePainPoint: campaign.audiencePainPoint || '',
          emotionalLever: campaign.emotionalLever || 'trust',
          ctaStyle: campaign.ctaStyle || 'medium',
          visualDirection: campaign.visualDirection || '',
          bestPlatforms: Array.isArray(campaign.bestPlatforms) ? campaign.bestPlatforms : [],
          setIndex: 0,
        },
      });
      campaignRecord = newCampaign;
      targetCampaignId = newCampaign.id;
    }

    // Save creatives to database
    const savedCreatives = await Promise.all(
      creatives.map((creative: any) =>
        db.creative.create({
          data: {
            campaignId: targetCampaignId,
            headline: creative.headline || '',
            description: creative.description || '',
            cta: creative.cta || '',
            layout: creative.layout || 'hero-center',
            overlayStyle: creative.overlayStyle || 'none',
            colorMood: creative.colorMood || 'premium',
            photographyStyle: creative.photographyStyle || 'commercial product',
            imageIntent: creative.imageIntent || '',
            sceneElements: Array.isArray(creative.sceneElements) ? creative.sceneElements : [],
            layoutTemplate: creative.layoutTemplate || null,
            fontWeight: creative.textStyle?.fontWeight || null,
            textAlignment: creative.textStyle?.alignment || null,
            textHierarchy: creative.textStyle?.hierarchy || null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        creatives: savedCreatives.map(c => ({
          headline: c.headline,
          description: c.description,
          cta: c.cta,
          layout: c.layout,
          overlayStyle: c.overlayStyle,
          colorMood: c.colorMood,
          photographyStyle: c.photographyStyle,
          imageIntent: c.imageIntent,
          sceneElements: c.sceneElements,
          textStyle: {
            fontWeight: c.fontWeight,
            alignment: c.textAlignment,
            hierarchy: c.textHierarchy,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Layer 3 error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate creatives' },
      { status: 500 }
    );
  }
}

