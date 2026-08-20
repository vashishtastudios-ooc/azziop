import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { getModel } from '~/lib/gemini';
import { buildLayer4SystemPrompt, buildLayer4UserPrompt } from '~/lib/prompts/layer4-image-prompt';
import { getActivePromptBody } from '~/lib/promptRuntime';
import { canAccessLayer } from '~/lib/quota';
import type { BrandDNA, SocialCreative, CampaignStrategy } from '~/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, creatives, brandDNA, campaign, aspectRatio: rawAspect = '1:1' } = await req.json();
    const allowedAspect = ['1:1', '4:5', '9:16', '16:9'] as const;
    const aspectRatio = allowedAspect.includes(rawAspect as (typeof allowedAspect)[number])
      ? (rawAspect as (typeof allowedAspect)[number])
      : '1:1';

    if (!projectId || !creatives || !brandDNA) {
      return NextResponse.json(
        { error: 'projectId, creatives, and brandDNA are required' },
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

    const layerAccess = await canAccessLayer(session.user.id, 4);
    if (!layerAccess.allowed) {
      return NextResponse.json(
        {
          error: 'Your current plan does not include this layer',
          plan: layerAccess.planId,
          maxLayer: layerAccess.maxLayer,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // Generate image prompts for each creative
    const model = getModel('layer4');
    const systemPrompt = buildLayer4SystemPrompt(
      brandDNA as BrandDNA,
      await getActivePromptBody('layer4'),
    );
    const imagePrompts = [];

    for (let i = 0; i < creatives.length; i++) {
      const creative = creatives[i] as SocialCreative;
      const userPrompt = buildLayer4UserPrompt(
        creative,
        brandDNA as BrandDNA,
        i,
        campaign as CampaignStrategy | undefined,
        aspectRatio
      );

      const response = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const promptText = response.response.text().trim();

      // Find the creative in database by matching headline or index
      // For now, we'll need to get creative IDs from the creatives array
      // This assumes creatives were just created and we have their IDs
      let creativeRecord;
      if (creative.id) {
        creativeRecord = await db.creative.findUnique({
          where: { id: creative.id },
        });
      } else {
        // Try to find by headline if no ID
        creativeRecord = await db.creative.findFirst({
          where: {
            headline: creative.headline,
            campaign: {
              projectId,
            },
          },
        });
      }

      if (creativeRecord) {
        // Update or create image prompt
        await db.imagePrompt.upsert({
          where: { creativeId: creativeRecord.id },
          create: {
            creativeId: creativeRecord.id,
            prompt: promptText,
            aspectRatio,
          },
          update: {
            prompt: promptText,
            aspectRatio,
          },
        });

        imagePrompts.push({
          creativeIndex: i,
          prompt: promptText,
          aspectRatio,
        });
      } else {
        // If creative not found, still return the prompt
        imagePrompts.push({
          creativeIndex: i,
          prompt: promptText,
          aspectRatio,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imagePrompts,
      },
    });
  } catch (error) {
    console.error('Layer 4 error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image prompts' },
      { status: 500 }
    );
  }
}

