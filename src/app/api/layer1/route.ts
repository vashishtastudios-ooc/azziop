import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { wipeProjectCampaignData } from '~/server/lib/wipeProjectCampaignData';
import { scrapeWebsite } from '~/lib/scraper';
import { screenshotExtract } from '~/lib/screenshotExtractor';
import { getModel } from '~/lib/gemini';
import { LAYER1_SYSTEM_PROMPT, buildLayer1UserPrompt } from '~/lib/prompts/layer1-brand-dna';
import { checkProjectLimit } from '~/lib/quota';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const existingProject = await db.project.findFirst({
      where: {
        userId: session.user.id,
        url: normalizedUrl,
      },
      select: { id: true },
    });

    if (!existingProject) {
      const projectLimit = await checkProjectLimit(session.user.id);
      if (!projectLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Project limit reached for your plan',
            limit: projectLimit.limit,
            used: projectLimit.used,
            plan: projectLimit.planId,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        );
      }
    }

    // Step 1: Scrape website
    const websiteData = await scrapeWebsite(normalizedUrl);

    // Step 2: Extract Brand DNA via screenshots + Gemini Vision
    const visualBrandDNA = await screenshotExtract(normalizedUrl, websiteData.textContent);

    // Step 3: Generate Brand DNA via text analysis
    const model = getModel('layer1');
    const userPrompt = buildLayer1UserPrompt({
      url: normalizedUrl,
      textContent: websiteData.textContent || '',
      title: websiteData.title || '',
      description: websiteData.description || '',
      keywords: websiteData.keywords || [],
    });

    const textResponse = await model.generateContent([
      { text: LAYER1_SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const textResult = textResponse.response.text();
    let textBrandDNA;
    try {
      // Try to parse JSON from response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        textBrandDNA = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse Brand DNA JSON:', error);
      // Fallback to visual DNA
      textBrandDNA = {
        brandValues: visualBrandDNA.brandValues || [],
        brandAesthetic: visualBrandDNA.brandAesthetic || '',
        brandToneOfVoice: visualBrandDNA.brandToneOfVoice || [],
        marketingBias: visualBrandDNA.marketingBias || [],
        avoidList: visualBrandDNA.avoidList || [],
        positioning: visualBrandDNA.positioning || 'mid',
        audienceMindset: visualBrandDNA.audienceMindset || 'emotional',
        industry: visualBrandDNA.industry || 'general',
        productType: visualBrandDNA.productType || '',
      };
    }

    // Merge visual and text DNA (visual takes priority for colors/fonts)
    const mergedBrandDNA = {
      brandValues: [...new Set([...visualBrandDNA.brandValues, ...(textBrandDNA.brandValues || [])])].slice(0, 5),
      brandAesthetic: textBrandDNA.brandAesthetic || visualBrandDNA.brandAesthetic || '',
      brandToneOfVoice: [...new Set([...visualBrandDNA.brandToneOfVoice, ...(textBrandDNA.brandToneOfVoice || [])])].slice(0, 3),
      marketingBias: [...new Set([...visualBrandDNA.marketingBias, ...(textBrandDNA.marketingBias || [])])].slice(0, 3),
      avoidList: [...new Set([...visualBrandDNA.avoidList, ...(textBrandDNA.avoidList || [])])].slice(0, 5),
      positioning: textBrandDNA.positioning || visualBrandDNA.positioning || 'mid',
      audienceMindset: textBrandDNA.audienceMindset || visualBrandDNA.audienceMindset || 'emotional',
      industry: textBrandDNA.industry || visualBrandDNA.industry || 'general',
      productType: textBrandDNA.productType || visualBrandDNA.productType || '',
    };

    // Find existing project or create new one
    let project = await db.project.findFirst({
      where: {
        userId: session.user.id,
        url: normalizedUrl,
      },
      include: {
        websiteData: true,
        brandDNA: true,
      },
    });

    if (project) {
      await wipeProjectCampaignData(db, project.id);

      // Update existing project
      await db.project.update({
        where: { id: project.id },
        data: { status: 'extracting' },
      });

      // Update or create websiteData
      if (project.websiteData) {
        await db.websiteData.update({
          where: { projectId: project.id },
          data: {
            url: normalizedUrl,
            title: websiteData.title || null,
            description: websiteData.description || null,
            brandName: visualBrandDNA.brandName || websiteData.brandName || null,
            logo: websiteData.logo || null,
            tagline: websiteData.tagline || visualBrandDNA.tagline || null,
            heroText: websiteData.heroText || null,
            aboutSection: websiteData.aboutSection || null,
            textContent: websiteData.textContent || null,
            contactEmail: websiteData.contactEmail || null,
            keywords: websiteData.keywords || [],
            images: websiteData.images || [],
            colors: visualBrandDNA.colors || websiteData.colors || [],
            fonts: visualBrandDNA.fonts || websiteData.fonts || [],
            socialLinks: websiteData.socialLinks || [],
          },
        });
      } else {
        await db.websiteData.create({
          data: {
            projectId: project.id,
            url: normalizedUrl,
            title: websiteData.title || null,
            description: websiteData.description || null,
            brandName: visualBrandDNA.brandName || websiteData.brandName || null,
            logo: websiteData.logo || null,
            tagline: websiteData.tagline || visualBrandDNA.tagline || null,
            heroText: websiteData.heroText || null,
            aboutSection: websiteData.aboutSection || null,
            textContent: websiteData.textContent || null,
            contactEmail: websiteData.contactEmail || null,
            keywords: websiteData.keywords || [],
            images: websiteData.images || [],
            colors: visualBrandDNA.colors || websiteData.colors || [],
            fonts: visualBrandDNA.fonts || websiteData.fonts || [],
            socialLinks: websiteData.socialLinks || [],
          },
        });
      }

      // Update or create brandDNA
      if (project.brandDNA) {
        await db.brandDNA.update({
          where: { projectId: project.id },
          data: {
            brandValues: mergedBrandDNA.brandValues,
            brandAesthetic: mergedBrandDNA.brandAesthetic,
            brandToneOfVoice: mergedBrandDNA.brandToneOfVoice,
            marketingBias: mergedBrandDNA.marketingBias,
            avoidList: mergedBrandDNA.avoidList,
            positioning: mergedBrandDNA.positioning,
            audienceMindset: mergedBrandDNA.audienceMindset,
            industry: mergedBrandDNA.industry || null,
            productType: mergedBrandDNA.productType || null,
          },
        });
      } else {
        await db.brandDNA.create({
          data: {
            projectId: project.id,
            brandValues: mergedBrandDNA.brandValues,
            brandAesthetic: mergedBrandDNA.brandAesthetic,
            brandToneOfVoice: mergedBrandDNA.brandToneOfVoice,
            marketingBias: mergedBrandDNA.marketingBias,
            avoidList: mergedBrandDNA.avoidList,
            positioning: mergedBrandDNA.positioning,
            audienceMindset: mergedBrandDNA.audienceMindset,
            industry: mergedBrandDNA.industry || null,
            productType: mergedBrandDNA.productType || null,
          },
        });
      }
    } else {
      // Create new project
      project = await db.project.create({
        data: {
          userId: session.user.id,
          url: normalizedUrl,
          status: 'extracting',
          websiteData: {
            create: {
              url: normalizedUrl,
              title: websiteData.title || null,
              description: websiteData.description || null,
              brandName: visualBrandDNA.brandName || websiteData.brandName || null,
              logo: websiteData.logo || null,
              tagline: websiteData.tagline || visualBrandDNA.tagline || null,
              heroText: websiteData.heroText || null,
              aboutSection: websiteData.aboutSection || null,
              textContent: websiteData.textContent || null,
              contactEmail: websiteData.contactEmail || null,
              keywords: websiteData.keywords || [],
              images: websiteData.images || [],
              colors: visualBrandDNA.colors || websiteData.colors || [],
              fonts: visualBrandDNA.fonts || websiteData.fonts || [],
              socialLinks: websiteData.socialLinks || [],
            },
          },
          brandDNA: {
            create: {
              brandValues: mergedBrandDNA.brandValues,
              brandAesthetic: mergedBrandDNA.brandAesthetic,
              brandToneOfVoice: mergedBrandDNA.brandToneOfVoice,
              marketingBias: mergedBrandDNA.marketingBias,
              avoidList: mergedBrandDNA.avoidList,
              positioning: mergedBrandDNA.positioning,
              audienceMindset: mergedBrandDNA.audienceMindset,
              industry: mergedBrandDNA.industry || null,
              productType: mergedBrandDNA.productType || null,
            },
          },
        },
      });
    }

    // Update project status
    await db.project.update({
      where: { id: project.id },
      data: { status: 'complete' },
    });

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        websiteData: {
          ...websiteData,
          colors: visualBrandDNA.colors || websiteData.colors || [],
          fonts: visualBrandDNA.fonts || websiteData.fonts || [],
          brandName: visualBrandDNA.brandName || websiteData.brandName,
          tagline: websiteData.tagline || visualBrandDNA.tagline,
        },
        brandDNA: mergedBrandDNA,
      },
    });
  } catch (error) {
    console.error('Layer 1 error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract brand DNA' },
      { status: 500 }
    );
  }
}

