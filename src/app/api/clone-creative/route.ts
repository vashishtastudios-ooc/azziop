import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { auth } from '~/server/auth';
import { generateImageWithReferences } from '~/lib/openrouter';
import { getFeatureFlags } from '~/lib/featureFlags';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const flags = await getFeatureFlags();
        if (!flags.cloneCreative) {
            return NextResponse.json(
                { error: 'Clone & Copy is temporarily disabled.' },
                { status: 503 },
            );
        }

        const {
            referenceImage,
            productImages,
            brandLogo,
            brandName,
            brandAesthetic,
            brandColors,
            brandFonts,
            industry,
            productType,
            campaignHeadline,
            campaignDescription,
            campaignCta,
            visualDirection
        } = await req.json();

        if (!referenceImage) {
            return NextResponse.json(
                { error: 'referenceImage is required' },
                { status: 400 }
            );
        }

        const hasLogo = Boolean(brandLogo);
        const hasProducts = Array.isArray(productImages) && productImages.length > 0;

        // Build the cloning prompt with precise reference roles
        const refGuide: string[] = ['Image 1 = REFERENCE (style, composition, mood, lighting to replicate).'];
        let idx = 2;
        if (hasLogo) {
            refGuide.push(`Image ${idx} = BRAND LOGO for "${brandName || 'Brand'}" — replicate this logo exactly everywhere a logo/wordmark appears in the scene (on apparel, packaging, bottles, signage, etc.).`);
            idx += 1;
        }
        if (hasProducts) {
            refGuide.push(`Images ${idx}${(productImages as unknown[]).length > 1 ? `–${idx + (productImages as unknown[]).length - 1}` : ''} = BRAND PRODUCT SHOTS — substitute any hero product/object from the reference with these.`);
        }

        const prompt = `CLONE & COPY — photorealistic brand substitution task.

REFERENCE IMAGES PROVIDED (in order):
${refGuide.map((l) => `• ${l}`).join('\n')}

BRAND CONTEXT:
- Brand Name: ${brandName || 'Brand'}
- Industry: ${industry || 'General'}
- Product Type: ${productType || 'Generic'}
- Aesthetic: ${brandAesthetic || 'Modern'}
- Brand Colors: ${brandColors ? (brandColors as string[]).join(', ') : 'Natural'}
- Brand Fonts: ${brandFonts && (brandFonts as string[]).length ? (brandFonts as string[]).join(', ') : 'Clean modern sans-serif'}

CREATIVE BRIEF:
- Headline: "${campaignHeadline || ''}"
- Description: "${campaignDescription || ''}"
- CTA: "${campaignCta || 'Shop Now'}"
- Visual Direction: ${visualDirection || 'Follow reference exactly'}

HARD RULES:
1. Preserve the EXACT composition, pose, framing, lighting, color grading, and photography style of the REFERENCE (image 1).
2. Re-brand every visible piece of branding in the scene to "${brandName || 'Brand'}":
   • Foreground product/apparel logos and wordmarks
   • Background products, bottles, packaging, jars, boxes, signage, wall art, mirror decals — anything that carries a brand name or logo in the reference MUST be replaced with "${brandName || 'Brand'}" or its logo.
   • Do NOT leave any competitor or original brand text/logo visible anywhere in the frame.
3. ${hasLogo ? `Render the provided BRAND LOGO accurately (shape, letterforms, proportions). Do not guess — copy it.` : `Render the brand name "${brandName || 'Brand'}" in a clean, premium wordmark consistent with the brand fonts listed above.`}
4. ${hasProducts ? `Replace the hero product with the provided BRAND PRODUCT SHOTS, keeping the same scale, angle, and placement as the reference.` : `Keep the hero product silhouette but re-skin/re-brand it as a ${productType || 'product'} for "${brandName || 'Brand'}".`}
5. Keep people/models, environment, props, and lighting identical to the reference — only branding changes.
6. Output must be photorealistic, crisp, and indistinguishable from a real commercial photograph.

Output ONLY the final image — no text, no watermarks, no borders.`;

        const processImg = (dataUrl: string) => {
            const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
            if (match) {
                return { mimeType: match[1]!, base64: match[2]! };
            }
            return null;
        };

        async function resolveLocalOrDataUrl(src: string): Promise<{ mimeType: string; base64: string } | null> {
            if (src.startsWith('data:image/')) return processImg(src);
            if (src.startsWith('/templates/') || src.startsWith('templates/')) {
                const clean = src.startsWith('/') ? src.slice(1) : src;
                const filePath = path.join(process.cwd(), 'public', clean);
                try {
                    const buffer = await readFile(filePath);
                    const ext = path.extname(filePath).slice(1).toLowerCase();
                    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                    return { mimeType, base64: buffer.toString('base64') };
                } catch { return null; }
            }
            if (src.startsWith('http://') || src.startsWith('https://')) {
                try {
                    const res = await fetch(src, { signal: AbortSignal.timeout(10_000) });
                    if (!res.ok) return null;
                    const ct = res.headers.get('content-type') || 'image/jpeg';
                    const mimeType = ct.split(';')[0]!.trim();
                    if (!mimeType.startsWith('image/')) return null;
                    const buffer = await res.arrayBuffer();
                    return { mimeType, base64: Buffer.from(buffer).toString('base64') };
                } catch { return null; }
            }
            return null;
        }

        const ref = await resolveLocalOrDataUrl(referenceImage);
        if (!ref) {
            return NextResponse.json({ error: 'Invalid reference image format' }, { status: 400 });
        }

        const refs: { mimeType: string; base64: string }[] = [ref];

        if (brandLogo) {
            const logoRef = await resolveLocalOrDataUrl(brandLogo);
            if (logoRef) refs.push(logoRef);
        }

        if (productImages && Array.isArray(productImages)) {
            for (const img of productImages) {
                const processed = await resolveLocalOrDataUrl(img);
                if (processed) refs.push(processed);
            }
        }

        const generatedImageUrl = await generateImageWithReferences(prompt, refs);

        return NextResponse.json({
            success: true,
            data: {
                generatedImageUrl,
            },
        });
    } catch (error) {
        console.error('Clone-creative error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to clone creative' },
            { status: 500 }
        );
    }
}
