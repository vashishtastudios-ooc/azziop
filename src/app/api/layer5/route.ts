import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/server/auth';
import { db } from '~/server/db';
import { generateImage, generateImageWithReferences } from '~/lib/gemini';
import { canAccessLayer, checkQuota, incrementUsage } from '~/lib/quota';

/** MIME types Gemini image generation accepts as inline references (not SVG). */
const GEMINI_REFERENCE_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
]);

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const mimeType = match[1]!.trim().toLowerCase();
    if (!mimeType.startsWith('image/')) return null;
    return { mimeType, base64: match[2]!.trim() };
}

/** Avoid static `import sharp` — it fails at module load on Node < 20.3 and breaks the whole route. */
async function rasterizeWithSharp(base64: string): Promise<Buffer | null> {
    try {
        const { default: sharp } = await import('sharp');
        return await sharp(Buffer.from(base64, 'base64')).png().toBuffer();
    } catch (e) {
        console.warn(
            '[layer5] sharp unavailable or rasterize failed (use Node ^20.3+ for SVG refs):',
            e instanceof Error ? e.message : e
        );
        return null;
    }
}

/**
 * Gemini rejects some image/* types (e.g. image/svg+xml). Rasterize or drop so generation still works.
 */
async function toGeminiReferenceImage(
    img: { mimeType: string; base64: string }
): Promise<{ mimeType: string; base64: string } | null> {
    const mt = img.mimeType.split(';')[0]!.trim().toLowerCase();
    const normalized = mt === 'image/jpg' ? 'image/jpeg' : mt;

    if (GEMINI_REFERENCE_MIME.has(normalized)) {
        return { mimeType: normalized, base64: img.base64 };
    }

    const png = await rasterizeWithSharp(img.base64);
    if (png) {
        return { mimeType: 'image/png', base64: png.toString('base64') };
    }

    console.warn('[layer5] Skipping unsupported reference type (no rasterizer):', normalized);
    return null;
}

async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; base64: string } | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const mimeType = contentType.split(';')[0]!.trim();
        if (!mimeType.startsWith('image/')) return null;
        const buffer = await res.arrayBuffer();
        return { mimeType, base64: Buffer.from(buffer).toString('base64') };
    } catch {
        return null;
    }
}

async function resolveImage(src: string): Promise<{ mimeType: string; base64: string } | null> {
    if (src.startsWith('data:image/')) return parseDataUrl(src);
    if (src.startsWith('http://') || src.startsWith('https://')) return fetchImageAsBase64(src);
    return null;
}

const LAYER5_ASPECT_HINT: Record<string, string> = {
    '9:16':
        '\n\n[Output: vertical 9:16 story-style image — full-height mobile frame; compose for tall aspect, safe zones top/bottom.]',
    '1:1': '\n\n[Output: square 1:1 image — balanced centered composition.]',
    '4:5': '\n\n[Output: portrait 4:5 feed image — taller-than-wide Instagram portrait proportion.]',
    '16:9': '\n\n[Output: landscape 16:9 wide image.]',
};

function appendAspectToImagePrompt(prompt: string, aspectRatio?: string): string {
    if (!aspectRatio || !LAYER5_ASPECT_HINT[aspectRatio]) return prompt;
    return prompt + LAYER5_ASPECT_HINT[aspectRatio];
}

const EDIT_EXISTING_PREFIX = `IMAGE EDITING INSTRUCTION:
The FIRST image provided is the EXISTING creative. You must EDIT this image — do NOT create an entirely new image.
Keep the product, subject, shape, form, logo, and core composition EXACTLY as they are.
Only modify: background environment, lighting, color grading, atmospheric effects, and styling.
The result must look like a refined, re-lit, re-styled version of the same image — not a new creation.

`;

const PRODUCT_INFOGRAPHIC_PREFIX = `PRODUCT INFOGRAPHIC — CONVERSION-FOCUSED:
The reference image(s) are the REAL product. You MUST faithfully preserve its exact shape, label, packaging, logo, and color.

VISUAL DIRECTION:
- Create a stunning, full-bleed hero shot: the product must fill the frame, looking aspirational and desirable.
- Use dramatic cinematic lighting: rim light, volumetric haze, catch-lights on surfaces, warm color grading.
- Premium environment: reflective surfaces, subtle texture (marble, silk, water drops, botanical elements).
- Infographic overlays must be SUBTLE and ELEGANT: thin hairline leader lines, small circular anchor dots, clean micro-icons, short 2-4 word labels in light sans-serif.
- The result must look like a high-end DTC brand ad that makes viewers stop scrolling and want to buy.
- Do NOT substitute a different product. Do NOT create flat or clinical-looking images.

`;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imagePrompts, projectId, referenceImages, editExisting, productInfographic } =
            await req.json();

        if (!imagePrompts || !Array.isArray(imagePrompts)) {
            return NextResponse.json(
                { error: 'imagePrompts array is required' },
                { status: 400 }
            );
        }

        const layerAccess = await canAccessLayer(session.user.id, 5);
        if (!layerAccess.allowed) {
            return NextResponse.json(
                {
                    error: 'Your current plan does not include image generation',
                    plan: layerAccess.planId,
                    maxLayer: layerAccess.maxLayer,
                    upgradeUrl: '/pricing',
                },
                { status: 403 }
            );
        }

        const requestedCount = imagePrompts.length;
        const quota = await checkQuota(session.user.id, 'images', requestedCount);
        if (!quota.allowed) {
            return NextResponse.json(
                {
                    error: 'Plan limit reached',
                    limit: quota.limit,
                    used: quota.used,
                    plan: quota.planId,
                    upgradeUrl: '/pricing',
                },
                { status: 403 }
            );
        }

        // Resolve reference images: supports both data URLs and HTTP URLs
        const refs: { mimeType: string; base64: string }[] = [];
        if (Array.isArray(referenceImages)) {
            const resolved = await Promise.all(
                referenceImages.map((img: string) => resolveImage(img))
            );
            const normalized = await Promise.all(
                resolved.map(async (r) => (r ? toGeminiReferenceImage(r) : null))
            );
            for (const r of normalized) {
                if (r) refs.push(r);
            }
        }
        const useInfographic = productInfographic === true && !editExisting;
        if (useInfographic && refs.length === 0) {
            console.warn('[layer5] productInfographic requested but no reference images resolved — generation may not match your product');
        }
        console.log(
            `[layer5] Resolved ${refs.length} Gemini-compatible reference images from ${referenceImages?.length ?? 0} inputs, editExisting=${!!editExisting}, productInfographic=${productInfographic === true}`,
        );

        // Generate images for each prompt
        const generatedImages: Array<{ creativeIndex: number; imageUrl: string; creativeId?: string }> = [];
        for (const item of imagePrompts as Array<{
            prompt: string;
            creativeIndex: number;
            creativeId?: string;
            aspectRatio?: string;
        }>) {
            try {
                let basePrompt = appendAspectToImagePrompt(item.prompt, item.aspectRatio);
                if (useInfographic && refs.length > 0) {
                    basePrompt = PRODUCT_INFOGRAPHIC_PREFIX + basePrompt;
                }
                let imageUrl: string;
                if (refs.length > 0) {
                    const prompt = editExisting
                        ? EDIT_EXISTING_PREFIX + basePrompt
                        : basePrompt;
                    imageUrl = await generateImageWithReferences(prompt, refs);
                } else {
                    imageUrl = await generateImage(basePrompt);
                }
                generatedImages.push({
                    creativeIndex: item.creativeIndex,
                    imageUrl,
                    ...(item.creativeId ? { creativeId: item.creativeId } : {}),
                });
            } catch (error) {
                console.error(`Error generating image for index ${item.creativeIndex}:`, error);
            }
        }

        if (generatedImages.length > 0) {
            await incrementUsage(session.user.id, 'images', generatedImages.length);
        }

        // Persist to database if projectId is provided
        if (projectId && generatedImages.length > 0) {
            // Verify project belongs to user
            const project = await db.project.findFirst({
                where: { id: projectId, userId: session.user.id },
                select: { id: true },
            });
            if (project) for (const item of generatedImages) {
                let creativeIdToUpsert: string | null = null;

                if (item.creativeId) {
                    // Resolve by creativeId: ensure creative belongs to this project
                    const creative = await db.creative.findFirst({
                        where: {
                            id: item.creativeId,
                            campaign: { projectId },
                        },
                        select: { id: true },
                    });
                    if (creative) creativeIdToUpsert = creative.id;
                }

                if (!creativeIdToUpsert) {
                    // Fallback: resolve by index — match TRPC's selection
                    // (first campaign with creatives, ordered by createdAt desc)
                    const projectWithCampaigns = await db.project.findFirst({
                        where: { id: projectId, userId: session.user.id },
                        include: {
                            campaigns: {
                                orderBy: { createdAt: 'desc' },
                                include: { creatives: { orderBy: { createdAt: 'asc' } } }
                            }
                        }
                    });
                    const campaign = projectWithCampaigns?.campaigns.find(
                        c => c.creatives.length > 0
                    ) ?? projectWithCampaigns?.campaigns[0];
                    const creative = campaign?.creatives[item.creativeIndex];
                    if (creative) creativeIdToUpsert = creative.id;
                }

                if (creativeIdToUpsert) {
                    const upserted = await db.generatedImage.upsert({
                        where: { creativeId: creativeIdToUpsert },
                        update: { imageUrl: item.imageUrl },
                        create: { creativeId: creativeIdToUpsert, imageUrl: item.imageUrl }
                    });
                    console.log('[layer5] Persisted image:', { creativeId: creativeIdToUpsert, imageId: upserted.id, imageUrl: item.imageUrl.slice(0, 80) });
                } else {
                    console.warn('[layer5] Could not resolve creative for persist:', { creativeId: item.creativeId, creativeIndex: item.creativeIndex, projectId });
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                generatedImages,
            },
        });
    } catch (error) {
        console.error('Layer 5 error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate images' },
            { status: 500 }
        );
    }
}
