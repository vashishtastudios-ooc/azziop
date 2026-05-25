// ============================================
// Website Scraper - Enhanced Version
// Extracts structured data from websites for brand analysis
// ============================================

import * as cheerio from 'cheerio';
import type { WebsiteData } from '@/types';

// Extended website data with more brand-specific fields
export interface ExtendedWebsiteData extends WebsiteData {
  logo: string | null;
  tagline: string | null;
  heroText: string | null;
  aboutSection: string | null;
  colors: string[];
  fonts: string[];
  socialLinks: string[];
  contactEmail: string | null;
}

// Clean and normalize text content
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

// Extract logo from website
function extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Priority selectors for logo
  const logoSelectors = [
    'img[class*="logo"]',
    'img[id*="logo"]',
    'img[alt*="logo" i]',
    'img[src*="logo"]',
    '.logo img',
    '#logo img',
    'header img:first-of-type',
    'nav img:first-of-type',
    '[class*="brand"] img',
    'a[href="/"] img',
  ];

  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      if (src && !src.includes('data:image')) {
        try {
          return new URL(src, baseUrl).href;
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

// Extract tagline from hero/banner section
function extractTagline($: cheerio.CheerioAPI): string | null {
  // Priority selectors for tagline/hero text
  const taglineSelectors = [
    '.hero h1',
    '.hero-banner h1',
    '.banner h1',
    '[class*="hero"] h1',
    '[class*="banner"] h1',
    '.hero p:first-of-type',
    '.hero-text',
    '.tagline',
    '.slogan',
    '[class*="tagline"]',
    '[class*="slogan"]',
    'header h1',
    'main h1:first-of-type',
  ];

  for (const selector of taglineSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text && text.length > 5 && text.length < 150) {
        return text;
      }
    }
  }

  // Try first h1 if nothing found
  const firstH1 = $('h1').first().text().trim();
  if (firstH1 && firstH1.length > 5 && firstH1.length < 150) {
    return firstH1;
  }

  return null;
}

// Extract hero/banner full text
function extractHeroText($: cheerio.CheerioAPI): string | null {
  const heroSelectors = [
    '.hero',
    '.hero-banner',
    '.banner',
    '[class*="hero"]',
    '[class*="banner"]',
    '.jumbotron',
    '.masthead',
  ];

  for (const selector of heroSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text && text.length > 20 && text.length < 500) {
        return cleanText(text);
      }
    }
  }

  return null;
}

// Extract About/Who We Are section
function extractAboutSection($: cheerio.CheerioAPI): string | null {
  // Look for about sections
  const aboutSelectors = [
    '#about',
    '.about',
    '[class*="about-us"]',
    '[class*="who-we-are"]',
    '[id*="about"]',
    'section:contains("About")',
    'section:contains("Who We Are")',
    'footer [class*="about"]',
  ];

  for (const selector of aboutSelectors) {
    try {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length > 50 && text.length < 1000) {
          return cleanText(text);
        }
      }
    } catch {
      continue;
    }
  }

  // Look for "Who We Are" or "About Us" headings and get next content
  let aboutFromHeading: string | null = null;
  $('h2, h3, h4').each((_, el) => {
    if (aboutFromHeading) return; // Already found
    const heading = $(el).text().toLowerCase();
    if (heading.includes('about') || heading.includes('who we are') || heading.includes('our story')) {
      const nextContent = $(el).next('p, div').text().trim();
      if (nextContent && nextContent.length > 50) {
        aboutFromHeading = cleanText(nextContent);
      }
    }
  });

  if (aboutFromHeading) {
    return aboutFromHeading;
  }

  // Try footer about section
  const footerAbout = $('footer').find('p').filter((_, el) => {
    const text = $(el).text();
    return text.length > 50 && text.length < 500;
  }).first().text();

  if (footerAbout) {
    return cleanText(footerAbout);
  }

  return null;
}

// Extract colors from inline styles and CSS
function extractColors($: cheerio.CheerioAPI): string[] {
  const colors = new Set<string>();

  // Common brand color locations
  const colorPatterns = [
    /#[0-9A-Fa-f]{6}\b/g,
    /#[0-9A-Fa-f]{3}\b/g,
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi,
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi,
  ];

  // Check inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    for (const pattern of colorPatterns) {
      const matches = style.match(pattern);
      if (matches) {
        matches.forEach(match => colors.add(match.toLowerCase()));
      }
    }
  });

  // Check style tags
  $('style').each((_, el) => {
    const css = $(el).text();
    for (const pattern of colorPatterns) {
      const matches = css.match(pattern);
      if (matches) {
        matches.forEach(match => colors.add(match.toLowerCase()));
      }
    }
  });

  // Check common brand color attributes
  $('[data-color], [data-brand-color]').each((_, el) => {
    const color = $(el).attr('data-color') || $(el).attr('data-brand-color');
    if (color && color.match(/^#[0-9A-Fa-f]{3,6}$/)) {
      colors.add(color.toLowerCase());
    }
  });

  const filtered = Array.from(colors).filter(color => {
    const lower = color.toLowerCase().replace(/\s/g, '');
    return ![
      '#000', '#000000', '#fff', '#ffffff', '#333', '#333333',
      '#666', '#666666', '#999', '#999999', '#ccc', '#cccccc',
      '#eee', '#eeeeee', '#f0f0f0', '#e0e0e0', '#d0d0d0',
      'rgb(0,0,0)', 'rgb(255,255,255)',
    ].includes(lower);
  });

  return filtered.slice(0, 6);
}

// Extract fonts from CSS
function extractFonts($: cheerio.CheerioAPI): string[] {
  const fonts = new Set<string>();

  // Common font-family pattern
  const fontPattern = /font-family\s*:\s*([^;]+)/gi;

  // Check inline styles
  $('[style*="font-family"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const matches = style.match(fontPattern);
    if (matches) {
      matches.forEach(match => {
        const fontValue = match.replace(/font-family\s*:\s*/i, '').trim();
        const primaryFont = fontValue.split(',')[0].trim().replace(/['"]/g, '');
        if (primaryFont && !primaryFont.includes('inherit') && !primaryFont.includes('system')) {
          fonts.add(primaryFont);
        }
      });
    }
  });

  // Check style tags
  $('style').each((_, el) => {
    const css = $(el).text();
    const matches = css.match(fontPattern);
    if (matches) {
      matches.forEach(match => {
        const fontValue = match.replace(/font-family\s*:\s*/i, '').trim();
        const primaryFont = fontValue.split(',')[0].trim().replace(/['"]/g, '');
        if (primaryFont && !primaryFont.includes('inherit') && !primaryFont.includes('system')) {
          fonts.add(primaryFont);
        }
      });
    }
  });

  // Check Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const familyMatch = href.match(/family=([^&:]+)/);
    if (familyMatch) {
      const fontNames = familyMatch[1].split('|');
      fontNames.forEach(name => {
        fonts.add(name.replace(/\+/g, ' ').split(':')[0]);
      });
    }
  });

  const result = Array.from(fonts).slice(0, 4);

  // Add defaults if not enough
  if (result.length === 0) {
    result.push('Sans-serif', 'Serif');
  }

  return result;
}

// Extract social media links
function extractSocialLinks($: cheerio.CheerioAPI): string[] {
  const socialPatterns = [
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'linkedin.com',
    'youtube.com',
    'tiktok.com',
    'pinterest.com',
  ];

  const links: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const pattern of socialPatterns) {
      if (href.includes(pattern) && !links.includes(href)) {
        links.push(href);
        break;
      }
    }
  });

  return links;
}

// Extract contact email
function extractContactEmail($: cheerio.CheerioAPI): string | null {
  // Look for mailto links
  const mailto = $('a[href^="mailto:"]').first();
  if (mailto.length) {
    const href = mailto.attr('href') || '';
    return href.replace('mailto:', '').split('?')[0];
  }

  // Look for email patterns in text
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const bodyText = $('body').text();
  const match = bodyText.match(emailPattern);

  return match ? match[0] : null;
}

// Extract visible text from HTML
function extractVisibleText($: cheerio.CheerioAPI): string {
  // Remove script, style, and other non-visible elements
  $('script, style, noscript, iframe, svg, nav, footer, header').remove();

  const textParts: string[] = [];

  // Priority content areas
  const prioritySelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '#content',
    '.main-content',
  ];

  let mainContent = '';
  for (const selector of prioritySelectors) {
    const element = $(selector);
    if (element.length) {
      mainContent = element.text();
      break;
    }
  }

  if (mainContent) {
    textParts.push(mainContent);
  } else {
    // Fall back to body text
    textParts.push($('body').text());
  }

  // Extract headings separately for emphasis
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  // Extract meta descriptions and taglines
  const taglines: string[] = [];
  $('[class*="tagline"], [class*="hero"], [class*="slogan"], .subtitle').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) taglines.push(text);
  });

  return cleanText([
    'KEY HEADINGS:',
    headings.slice(0, 10).join('\n'),
    '\nTAGLINES:',
    taglines.slice(0, 5).join('\n'),
    '\nMAIN CONTENT:',
    ...textParts,
  ].join('\n')).slice(0, 8000);
}

// Extract images from HTML
function extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const dataSrc = $(el).attr('data-src'); // Lazy loaded images
    const srcset = $(el).attr('srcset');

    const imgSrc = src || dataSrc;

    if (imgSrc && !imgSrc.includes('data:image')) {
      try {
        const fullUrl = new URL(imgSrc, baseUrl).href;
        // Filter out tracking pixels and icons
        if (!fullUrl.includes('tracking') &&
          !fullUrl.includes('pixel') &&
          !fullUrl.includes('icon') &&
          !fullUrl.includes('favicon') &&
          !fullUrl.includes('.svg')) {
          images.push(fullUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });

  // Also check for background images in style
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (match?.[1]) {
      try {
        const fullUrl = new URL(match[1], baseUrl).href;
        if (!fullUrl.includes('.svg')) {
          images.push(fullUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return Array.from(new Set(images)).slice(0, 20);
}

// Extract keywords from content
function extractKeywords($: cheerio.CheerioAPI, textContent: string): string[] {
  const keywords: string[] = [];

  // Meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords) {
    keywords.push(...metaKeywords.split(',').map(k => k.trim()));
  }

  // Extract from headings
  $('h1, h2').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text.length < 50) {
      keywords.push(text);
    }
  });

  // Extract emphasized words
  $('strong, b, em').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text.length < 30 && text.length > 2) {
      keywords.push(text);
    }
  });

  return Array.from(new Set(keywords)).slice(0, 15);
}

// Main scraping function
export async function scrapeWebsite(url: string): Promise<ExtendedWebsiteData> {
  // Normalize URL
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract all data
    const title = $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      url;

    const description = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const logo = extractLogo($, url);
    const tagline = extractTagline($);
    const heroText = extractHeroText($);
    const aboutSection = extractAboutSection($);
    const socialLinks = extractSocialLinks($);
    const contactEmail = extractContactEmail($);
    const images = extractImages($, url);
    const textContent = extractVisibleText($);
    const keywords = extractKeywords($, textContent);

    // CSS-based fallback extraction (used if Vision extraction fails)
    const colors = extractColors($);
    const fonts = extractFonts($);

    return {
      url,
      textContent,
      title,
      description,
      keywords,
      images,
      logo,
      tagline,
      heroText,
      aboutSection,
      colors,
      fonts,
      socialLinks,
      contactEmail,
    };
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
