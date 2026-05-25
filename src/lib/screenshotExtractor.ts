// ============================================
// Unified Screenshot-Based Brand DNA Extractor
// Puppeteer captures 2 viewports → sends both
// to Gemini Vision → extracts ALL Brand DNA
// ============================================

import puppeteer from 'puppeteer';
import { callGeminiWithImage, parseGeminiJSON } from './gemini';

export interface VisualBrandDNA {
    // Visual identity
    brandName: string;
    tagline: string;
    colors: string[];
    fonts: string[];
    // Brand DNA fields
    brandValues: string[];
    brandAesthetic: string;
    brandToneOfVoice: string[];
    marketingBias: string[];
    avoidList: string[];
    positioning: 'budget' | 'mid' | 'premium';
    audienceMindset: 'aspirational' | 'practical' | 'emotional' | 'status-driven';
    industry: string;
    productType: string;
}

/**
 * Build the vision system prompt with anti-hallucination safeguards
 */
function buildVisionSystemPrompt(urlDomain: string): string {
    return `You are a senior brand strategist and visual identity expert with 20+ years of experience at top agencies like Wieden+Kennedy, Droga5, and IDEO. You specialize in extracting brand DNA from websites by analyzing their visual design, copy, and overall aesthetic.

You are looking at TWO screenshots of a website: the first is the above-the-fold view, the second is a scrolled-down view showing more content.

CRITICAL RULES:
1. Extract ONLY the brand's own identity — IGNORE all third-party elements:
   - Payment icons (Visa, Mastercard, PayPal, Apple Pay, Google Pay, Klarna, etc.)
   - Review widgets (Judge.me, Trustpilot, Yotpo, Stamped, etc.)
   - Chat widgets (Tidio, Intercom, Zendesk, etc.)
   - Social proof popups, cookie banners, trust badges
2. For the brandName: Look at the logo text, header, and any "Copyright © [Name]" text in the footer. Cross-reference with the URL domain "${urlDomain}" to ensure accuracy. Do NOT include payment method names or other unrelated text.
3. Be precise — every value must be directly observable from the screenshots
4. Output VALID JSON ONLY — no markdown, no code blocks, no explanations
5. If unsure about a value, choose the most conservative/neutral option

BRAND NAME RULES:
- Use the actual business name visible in the logo or header
- Cross-reference with the domain "${urlDomain}" for validation
- NEVER include payment providers, widget names, or footer junk
- Keep it clean: "Moss Scents UK" not "Moss Scents UKAmerican ExpressApple Pay..."

COLOR GUIDELINES (CRITICAL — quality over quantity):
- Extract ONLY 2-3 exact hex codes that represent the brand's TRUE identity colors
- These are the colors repeated across: nav/header background, buttons, CTA buttons, announcement banners, footer background, brand logo
- The PRIMARY brand color is the one used most consistently for buttons, headers, and key UI elements — put it FIRST
- Do NOT pad with extra colors. If the brand only has 1-2 distinct colors, return only 1-2
- NEVER include: grays (#333, #666, #999, #ccc), near-black (#111, #222), near-white (#eee, #f5f5f5), or transparent/overlay colors
- NEVER include pure black (#000000) or pure white (#ffffff) unless they are a deliberate brand accent
- IGNORE colors from third-party widgets, trust badges, payment icons, review stars

FONT GUIDELINES:
- Identify 1-3 actual font family names visible in the design
- Heading/display font first, body text font second
- Use specific names (e.g., "Playfair Display") not generic categories ("serif")

POSITIONING CRITERIA:
- "budget": Emphasizes price, discounts, value, 'cheapest' language
- "mid": Balanced quality-price, mainstream appeal
- "premium": Quality focus, exclusivity, craftsmanship, luxury cues, high-end photography

AUDIENCE MINDSET CRITERIA:
- "aspirational": Future-focused, achievement, becoming better
- "practical": Functional benefits, problem-solving, efficiency
- "emotional": Feelings, experiences, connection, belonging
- "status-driven": Prestige, recognition, social proof, exclusivity

INDUSTRY DETECTION (use these categories):
"fragrance" | "fashion-sportswear" | "beauty-skincare" | "food-restaurant"
"tech-saas" | "real-estate" | "fitness-wellness" | "jewelry-accessories"
"automotive" | "home-interior" | "education-courses" | "general"

OUTPUT FORMAT (strict JSON):
{
  "brandName": "Clean brand name from logo/header",
  "tagline": "Main tagline or hero text",
  "colors": ["#primary-brand-hex", "#secondary-brand-hex"],
  "fonts": ["Heading Font", "Body Font"],
  "brandValues": ["3-5 concrete attributes"],
  "brandAesthetic": "concise visual identity description (1 sentence max)",
  "brandToneOfVoice": ["2-3 tone traits"],
  "marketingBias": ["2-3 strategic preferences visible in copy/layout"],
  "avoidList": ["things this brand should never do based on positioning"],
  "positioning": "budget | mid | premium",
  "audienceMindset": "aspirational | practical | emotional | status-driven",
  "industry": "detected industry category",
  "productType": "specific product/service type"
}`;
}

/**
 * Build the user prompt with optional scraped text for multi-modal analysis
 */
function buildVisionUserPrompt(scrapedText?: string): string {
    let prompt = `Analyze these website screenshots and extract the complete Brand DNA. Return valid JSON only.\n\n`;

    if (scrapedText) {
        const trimmedText = scrapedText.slice(0, 4000);
        prompt += `ADDITIONAL CONTEXT — Scraped text from the website (use this alongside the visuals to identify tone, values, and positioning):\n\n${trimmedText}\n\n`;
        prompt += `Use BOTH the visual screenshots AND the text above for a comprehensive analysis. The screenshots tell you about visual identity (colors, fonts, aesthetic), while the text tells you about tone of voice, brand values, and positioning.`;
    } else {
        prompt += `Analyze the visual design, layout, typography, color palette, and any visible copy to determine the complete Brand DNA.`;
    }

    return prompt;
}

/**
 * Capture 2 screenshots (above-fold + scrolled) and return both as buffers
 */
async function captureScreenshots(url: string): Promise<Buffer[]> {

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });

    try {
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 900 });

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Wait for lazy-loaded content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to dismiss cookie/popup overlays
        try {
            const dismissSelectors = [
                '[class*="cookie"] button',
                '[class*="consent"] button',
                '[class*="popup"] [class*="close"]',
                '[class*="modal"] [class*="close"]',
                'button[aria-label="Close"]',
                '.cc-dismiss',
                '#onetrust-accept-btn-handler',
            ];
            for (const selector of dismissSelectors) {
                const btn = await page.$(selector);
                if (btn) {
                    await btn.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch {
            // Ignore popup dismissal errors
        }

        // Screenshot 1: Above the fold
        const screenshot1 = await page.screenshot({ type: 'png', fullPage: false });

        // Scroll down to see more content
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Screenshot 2: Scrolled view
        const screenshot2 = await page.screenshot({ type: 'png', fullPage: false });

        return [Buffer.from(screenshot1), Buffer.from(screenshot2)];
    } finally {
        await browser.close();
    }
}

/**
 * Extract domain from URL for anti-hallucination
 */
function extractDomain(url: string): string {
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

/**
 * Analyze screenshots with Gemini Vision to extract full Brand DNA
 */
async function analyzeWithVision(
    screenshots: Buffer[],
    urlDomain: string,
    scrapedText?: string
): Promise<VisualBrandDNA> {
    // Send both screenshots as separate images to Gemini
    const images = screenshots.map((buf) => ({
        base64: buf.toString('base64'),
        mimeType: 'image/png',
    }));

    const systemPrompt = buildVisionSystemPrompt(urlDomain);
    const userPrompt = buildVisionUserPrompt(scrapedText);

    const response = await callGeminiWithImage(images, systemPrompt, userPrompt);

    const result = parseGeminiJSON<VisualBrandDNA>(response);

    // Validate and normalize
    const validated: VisualBrandDNA = {
        brandName: result.brandName || urlDomain,
        tagline: result.tagline || '',
        colors: (result.colors || [])
            .filter((c: string) => /^#[0-9A-Fa-f]{3,8}$/.test(c))
            .filter((c: string) => {
                const hex = c.toLowerCase();
                return ![
                    '#000', '#000000', '#fff', '#ffffff', '#111', '#111111',
                    '#222', '#222222', '#333', '#333333', '#666', '#666666',
                    '#999', '#999999', '#ccc', '#cccccc', '#eee', '#eeeeee',
                    '#f0f0f0', '#f5f5f5', '#e0e0e0', '#d0d0d0',
                ].includes(hex);
            })
            .map((c: string) => c.toLowerCase())
            .slice(0, 4),
        fonts: (result.fonts || [])
            .filter((f: string) => f && !['inherit', 'system-ui', 'sans-serif', 'serif', 'monospace'].includes(f.toLowerCase()))
            .slice(0, 3),
        brandValues: (result.brandValues || []).slice(0, 5),
        brandAesthetic: result.brandAesthetic || '',
        brandToneOfVoice: (result.brandToneOfVoice || []).slice(0, 3),
        marketingBias: (result.marketingBias || []).slice(0, 3),
        avoidList: (result.avoidList || []).slice(0, 5),
        positioning: ['budget', 'mid', 'premium'].includes(result.positioning) ? result.positioning : 'mid',
        audienceMindset: ['aspirational', 'practical', 'emotional', 'status-driven'].includes(result.audienceMindset) ? result.audienceMindset : 'emotional',
        industry: result.industry || 'general',
        productType: result.productType || '',
    };

    return validated;
}

/**
 * Main export: Full Brand DNA extraction via screenshots + Gemini Vision
 */
export async function screenshotExtract(
    url: string,
    scrapedText?: string
): Promise<VisualBrandDNA> {
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }

    const domain = extractDomain(normalizedUrl);

    try {
        const screenshots = await captureScreenshots(normalizedUrl);
        const brandDNA = await analyzeWithVision(screenshots, domain, scrapedText);
        return brandDNA;
    } catch (error) {
        console.error('❌ Screenshot extraction failed:', error);
        return {
            brandName: domain,
            tagline: '',
            colors: [],
            fonts: [],
            brandValues: [],
            brandAesthetic: '',
            brandToneOfVoice: [],
            marketingBias: [],
            avoidList: [],
            positioning: 'mid',
            audienceMindset: 'emotional',
            industry: 'general',
            productType: '',
        };
    }
}
