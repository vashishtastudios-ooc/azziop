// ============================================
// Single product URL — lightweight extract for infographics
// ============================================

import * as cheerio from 'cheerio';

export type ProductPageExtract = {
  url: string;
  title: string;
  description: string;
  bulletPoints: string[];
  /** Absolute image URLs (product-ish, best-effort) */
  imageUrls: string[];
  /** Concatenated readable text for the model */
  bodySnippet: string;
};

function absUrl(base: string, src: string | undefined): string | null {
  if (!src || src.startsWith('data:')) return null;
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Basic SSRF guard — only http(s) public hosts */
export function isAllowedProductUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost') ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.16.') ||
      host.startsWith('172.17.') ||
      host.startsWith('172.18.') ||
      host.startsWith('172.19.') ||
      host.startsWith('172.2') ||
      host.startsWith('172.30.') ||
      host.startsWith('172.31.') ||
      host === '[::1]'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function scrapeProductPage(productUrl: string): Promise<ProductPageExtract> {
  const res = await fetch(productUrl, {
    signal: AbortSignal.timeout(25_000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; TatasthuBot/1.0; +https://tatasthu.com) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) {
    throw new Error(`Could not fetch product page (${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    clean($('meta[property="og:title"]').attr('content') || '') ||
    clean($('title').first().text() || '') ||
    'Product';

  const description =
    clean($('meta[property="og:description"]').attr('content') || '') ||
    clean($('meta[name="description"]').attr('content') || '') ||
    '';

  const bullets: string[] = [];
  $('ul li, ol li').each((_, el) => {
    const t = clean($(el).text());
    if (t.length > 8 && t.length < 400 && bullets.length < 24) bullets.push(t);
  });

  const imageUrls = new Set<string>();
  const og = $('meta[property="og:image"]').attr('content');
  const ogAbs = absUrl(productUrl, og);
  if (ogAbs) imageUrls.add(ogAbs);
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const a = absUrl(productUrl, src);
    if (!a) return;
    const low = a.toLowerCase();
    if (low.includes('icon') || low.includes('sprite') || low.includes('pixel')) return;
    if (low.endsWith('.svg')) return;
    imageUrls.add(a);
  });

  $('script, style, nav, footer').remove();
  const bodySnippet = clean($('main, article, [role="main"], body').first().text()).slice(0, 12_000);

  return {
    url: productUrl,
    title,
    description,
    bulletPoints: bullets.slice(0, 16),
    imageUrls: Array.from(imageUrls).slice(0, 12),
    bodySnippet,
  };
}
