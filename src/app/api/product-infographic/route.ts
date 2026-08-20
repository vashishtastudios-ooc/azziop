import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { getModel, parseGeminiJSON } from '~/lib/gemini';
import {
  scrapeProductPage,
  isAllowedProductUrl,
} from '~/lib/productPageScraper';
import {
  buildProductInfographicSystemPrompt,
  buildProductInfographicUserPrompt,
} from '~/lib/prompts/product-infographic';
import type { BrandDNA, ImagePrompt, SocialCreative } from '~/types';
import { getFeatureFlags } from '~/lib/featureFlags';

/** Marks creatives that use full-bleed infographic grid (not the 5 rotating Pomelli layouts). */
const PRODUCT_INFOGRAPHIC_LAYOUT_TEMPLATE = 'product-infographic';

function clampInfographicHeadline(raw: string, maxWords = 7): string {
  const w = raw.trim().split(/\s+/).filter(Boolean);
  if (w.length <= maxWords) return w.join(' ');
  return w.slice(0, maxWords).join(' ');
}

function clampInfographicDescription(raw: string, maxChars = 160): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1).trimEnd()}…`;
}

type GeminiOut = {
  creatives: Array<
    SocialCreative & {
      textStyle?: SocialCreative['textStyle'];
    }
  >;
  imagePrompts: ImagePrompt[];
};

async function generateAndParseInfographicJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<GeminiOut> {
  const model = getModel('productInfographic');
  let lastRaw = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await model.generateContent([
      { text: systemPrompt },
      {
        text:
          attempt === 1
            ? userPrompt
            : `${userPrompt}

IMPORTANT RETRY RULES:
- Your previous answer was truncated or invalid JSON.
- Return STRICT JSON ONLY with double-quoted strings (no markdown fences).
- Keep each image "prompt" under 120 words so the full JSON fits.
- Ensure overlayStyle/layout are complete strings; no trailing commas.`,
      },
    ]);

    lastRaw = response.response.text().trim();
    try {
      return parseGeminiJSON<GeminiOut>(lastRaw);
    } catch {
      console.error(
        `[product-infographic] JSON parse failed (attempt ${attempt}):`,
        lastRaw.slice(0, 700),
      );
    }
  }

  throw new Error('Failed to parse AI response — try again');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flags = await getFeatureFlags();
    if (!flags.productInfographic) {
      return NextResponse.json(
        { error: 'Product Infographic is temporarily disabled.' },
        { status: 503 },
      );
    }

    const body = await req.json();
    const productUrl = typeof body.productUrl === 'string' ? body.productUrl.trim() : '';
    const projectId = body.projectId as string | undefined;
    const campaignId = body.campaignId as string | undefined;

    if (!productUrl || !isAllowedProductUrl(productUrl)) {
      return NextResponse.json(
        { error: 'Enter a valid http(s) product URL' },
        { status: 400 },
      );
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await db.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      include: {
        brandDNA: true,
        campaigns: {
          where: campaignId ? { id: campaignId } : undefined,
          include: {
            creatives: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const campaign =
      (campaignId
        ? project.campaigns.find((c) => c.id === campaignId)
        : project.campaigns[0]) ?? null;

    if (!campaign || campaign.creatives.length === 0) {
      return NextResponse.json(
        { error: 'No campaign with creatives found' },
        { status: 400 },
      );
    }

    const dbCreatives = campaign.creatives;
    const n = Math.min(5, dbCreatives.length);

    const existingAspect =
      (await db.imagePrompt.findFirst({
        where: { creativeId: dbCreatives[0]!.id },
        select: { aspectRatio: true },
      }))?.aspectRatio ?? '9:16';

    const allowedAspect = ['1:1', '4:5', '9:16', '16:9'] as const;
    const defaultAspect = allowedAspect.includes(
      existingAspect as (typeof allowedAspect)[number],
    )
      ? (existingAspect as (typeof allowedAspect)[number])
      : '9:16';

    const brandDNA = project.brandDNA as BrandDNA | null;
    if (!brandDNA) {
      return NextResponse.json(
        { error: 'Brand DNA is missing — complete Brand DNA first' },
        { status: 400 },
      );
    }

    const brandName =
      project.websiteData?.brandName ||
      project.websiteData?.title ||
      'Brand';

    let extract;
    try {
      extract = await scrapeProductPage(productUrl);
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error ? e.message : 'Failed to fetch product page',
        },
        { status: 400 },
      );
    }

    const systemPrompt = buildProductInfographicSystemPrompt(brandDNA, n);
    const userPrompt = buildProductInfographicUserPrompt(
      extract,
      brandDNA,
      brandName,
      n,
      defaultAspect,
    );
    let parsed: GeminiOut;
    try {
      parsed = await generateAndParseInfographicJson(systemPrompt, userPrompt);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Failed to parse AI response — try again' },
        { status: 500 },
      );
    }

    if (parsed.creatives.length !== n || parsed.imagePrompts.length !== n) {
      return NextResponse.json(
        { error: 'AI returned wrong number of creatives — try again' },
        { status: 500 },
      );
    }

    const imagePromptsOut: ImagePrompt[] = [];
    const creativesOut: SocialCreative[] = [];

    for (let i = 0; i < n; i++) {
      const creativeRow = dbCreatives[i]!;
      const genCreative = parsed.creatives[i]!;
      const genPrompt = parsed.imagePrompts.find(
        (p) => p.creativeIndex === i,
      );
      if (!genPrompt?.prompt) {
        return NextResponse.json(
          { error: `Missing image prompt for creative ${i}` },
          { status: 500 },
        );
      }

      const aspectRatio =
        allowedAspect.includes(genPrompt.aspectRatio as (typeof allowedAspect)[number])
          ? genPrompt.aspectRatio
          : defaultAspect;

      const social: SocialCreative = {
        headline: clampInfographicHeadline(
          genCreative.headline || creativeRow.headline,
        ),
        description: clampInfographicDescription(
          genCreative.description || creativeRow.description,
        ),
        cta: genCreative.cta || creativeRow.cta,
        layout: 'full-bleed',
        overlayStyle:
          (genCreative.overlayStyle as SocialCreative['overlayStyle']) ||
          creativeRow.overlayStyle,
        colorMood: (genCreative.colorMood as SocialCreative['colorMood']) || creativeRow.colorMood,
        photographyStyle:
          (genCreative.photographyStyle as SocialCreative['photographyStyle']) ||
          creativeRow.photographyStyle,
        imageIntent: genCreative.imageIntent || creativeRow.imageIntent,
        sceneElements: genCreative.sceneElements?.length
          ? genCreative.sceneElements.slice(0, 3)
          : (creativeRow.sceneElements ?? []).slice(0, 3),
        textStyle: {
          fontWeight: 'regular',
          alignment: 'center',
          hierarchy: 'balanced',
        },
        layoutTemplate: PRODUCT_INFOGRAPHIC_LAYOUT_TEMPLATE,
      };

      creativesOut.push(social);

      await db.creative.update({
        where: { id: creativeRow.id },
        data: {
          headline: social.headline,
          description: social.description,
          cta: social.cta,
          layout: social.layout,
          overlayStyle: social.overlayStyle,
          colorMood: social.colorMood,
          photographyStyle: social.photographyStyle,
          imageIntent: social.imageIntent,
          sceneElements: social.sceneElements ?? [],
          layoutTemplate: PRODUCT_INFOGRAPHIC_LAYOUT_TEMPLATE,
          fontWeight: social.textStyle.fontWeight,
          textAlignment: social.textStyle.alignment,
          textHierarchy: social.textStyle.hierarchy,
        },
      });

      await db.imagePrompt.upsert({
        where: { creativeId: creativeRow.id },
        create: {
          creativeId: creativeRow.id,
          prompt: genPrompt.prompt,
          aspectRatio,
        },
        update: {
          prompt: genPrompt.prompt,
          aspectRatio,
        },
      });

      imagePromptsOut.push({
        creativeIndex: i,
        prompt: genPrompt.prompt,
        aspectRatio: aspectRatio as ImagePrompt['aspectRatio'],
      });
    }

    const affectedCreativeIds = dbCreatives.slice(0, n).map((c) => c.id);
    await db.generatedImage.deleteMany({
      where: { creativeId: { in: affectedCreativeIds } },
    });

    return NextResponse.json({
      success: true,
      data: {
        creatives: creativesOut,
        imagePrompts: imagePromptsOut,
        productSummary: {
          title: extract.title,
          url: extract.url,
          imageUrls: extract.imageUrls,
        },
      },
    });
  } catch (error) {
    console.error('product-infographic error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Product infographic failed',
      },
      { status: 500 },
    );
  }
}
